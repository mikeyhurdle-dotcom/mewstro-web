"use server";

import { getActiveStudioName } from "@/lib/teacher-auth";
import {
  createResource,
  updateResource,
  softDeleteResource,
  studentInStudio,
} from "@/lib/teacher-queries";
import { getServerSupabase } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const MAX_PDF_BYTES = 26214400; // 25 MiB

const VALID_TYPES = ["link", "embed", "document"] as const;
const VALID_AUDIENCES = ["studio", "instrument", "student"] as const;

type ResourceType = (typeof VALID_TYPES)[number];
type AudienceType = (typeof VALID_AUDIENCES)[number];

function isValidType(v: string): v is ResourceType {
  return (VALID_TYPES as readonly string[]).includes(v);
}

function isValidAudience(v: string): v is AudienceType {
  return (VALID_AUDIENCES as readonly string[]).includes(v);
}

/**
 * Create a new studio resource (link or embed only — document upload is
 * Task 5). Validates enums server-side and scope-guards student audience.
 */
export async function createResourceAction(
  formData: FormData,
): Promise<void> {
  const studioName = await getActiveStudioName();
  if (!studioName) {
    redirect("/teacher/login");
  }

  const title = (formData.get("title") as string | null)?.trim() ?? "";
  const description =
    ((formData.get("description") as string | null)?.trim() ?? "") || null;
  const typeRaw = (formData.get("type") as string | null)?.trim() ?? "";
  const audienceRaw = (formData.get("audience") as string | null)?.trim() ?? "";
  const url =
    ((formData.get("url") as string | null)?.trim() ?? "") || null;
  const audienceInstrument =
    ((formData.get("audienceInstrument") as string | null)?.trim() ?? "") || null;
  const audienceStudentUserId =
    ((formData.get("audienceStudentUserId") as string | null)?.trim() ?? "") || null;

  if (!title) {
    redirect("/teacher/materials?error=title");
  }

  if (!isValidType(typeRaw)) {
    redirect("/teacher/materials?error=type");
  }

  if (!isValidAudience(audienceRaw)) {
    redirect("/teacher/materials?error=audience");
  }

  // Document upload is handled by uploadDocumentResourceAction (Task 5)
  if (typeRaw === "document") {
    redirect("/teacher/materials?error=doc_not_supported");
  }

  // link and embed require a URL
  if (!url) {
    redirect("/teacher/materials?error=url");
  }

  if (audienceRaw === "student") {
    if (!audienceStudentUserId) {
      redirect("/teacher/materials?error=student");
    }
    const inStudio = await studentInStudio(audienceStudentUserId, studioName);
    if (!inStudio) {
      redirect("/teacher/materials?error=scope");
    }
  }

  if (audienceRaw === "instrument" && !audienceInstrument) {
    redirect("/teacher/materials?error=instrument");
  }

  const result = await createResource({
    studioName,
    type: typeRaw,
    title,
    description,
    url,
    storagePath: null,
    audience: audienceRaw,
    audienceInstrument: audienceRaw === "instrument" ? audienceInstrument : null,
    audienceStudentUserId: audienceRaw === "student" ? audienceStudentUserId : null,
  });

  if (!result.ok) {
    redirect("/teacher/materials?error=server");
  }

  revalidatePath("/teacher/materials");
}

/**
 * Update an existing studio resource's editable fields. Scoped to the
 * teacher's studio; validates enums + URL requirement server-side.
 */
export async function updateResourceAction(
  formData: FormData,
): Promise<void> {
  const studioName = await getActiveStudioName();
  if (!studioName) {
    redirect("/teacher/login");
  }

  const id = (formData.get("resourceId") as string | null)?.trim() ?? "";
  if (!id) {
    redirect("/teacher/materials?error=server");
  }

  const title = (formData.get("title") as string | null)?.trim() ?? "";
  const description =
    ((formData.get("description") as string | null)?.trim() ?? "") || null;
  const audienceRaw = (formData.get("audience") as string | null)?.trim() ?? "";
  const url =
    ((formData.get("url") as string | null)?.trim() ?? "") || null;
  const audienceInstrument =
    ((formData.get("audienceInstrument") as string | null)?.trim() ?? "") || null;
  const audienceStudentUserId =
    ((formData.get("audienceStudentUserId") as string | null)?.trim() ?? "") || null;

  if (!title) {
    redirect("/teacher/materials?error=title");
  }

  if (!isValidAudience(audienceRaw)) {
    redirect("/teacher/materials?error=audience");
  }

  if (!url) {
    redirect("/teacher/materials?error=url");
  }

  if (audienceRaw === "student") {
    if (!audienceStudentUserId) {
      redirect("/teacher/materials?error=student");
    }
    const inStudio = await studentInStudio(audienceStudentUserId, studioName);
    if (!inStudio) {
      redirect("/teacher/materials?error=scope");
    }
  }

  if (audienceRaw === "instrument" && !audienceInstrument) {
    redirect("/teacher/materials?error=instrument");
  }

  const result = await updateResource({
    id,
    studioName,
    title,
    description,
    url,
    audience: audienceRaw,
    audienceInstrument: audienceRaw === "instrument" ? audienceInstrument : null,
    audienceStudentUserId: audienceRaw === "student" ? audienceStudentUserId : null,
  });

  if (!result.ok) {
    redirect("/teacher/materials?error=server");
  }

  revalidatePath("/teacher/materials");
}

/**
 * Soft-delete a studio resource. Scoped to the teacher's studio.
 */
export async function deleteResourceAction(
  formData: FormData,
): Promise<void> {
  const studioName = await getActiveStudioName();
  if (!studioName) {
    redirect("/teacher/login");
  }

  const id = (formData.get("resourceId") as string | null)?.trim() ?? "";
  if (!id) {
    redirect("/teacher/materials?error=server");
  }

  const result = await softDeleteResource(id, studioName);
  if (!result.ok) {
    redirect("/teacher/materials?error=server");
  }

  revalidatePath("/teacher/materials");
}

/**
 * Upload a PDF document as a studio resource. Enforces server-side:
 * - MIME type must be application/pdf
 * - Size must be ≤ 25 MiB (26214400 bytes)
 * - IP attestation checkbox must be present and equal "true"
 * - Studio scope-guarded; student-audience uses studentInStudio guard.
 */
export async function uploadDocumentResourceAction(
  formData: FormData,
): Promise<void> {
  const studioName = await getActiveStudioName();
  if (!studioName) {
    redirect("/teacher/login");
  }

  // ── IP attestation check ────────────────────────────────────────────────
  const ipAttestation = formData.get("ipAttestation");
  if (ipAttestation !== "true") {
    redirect("/teacher/materials?error=attestation");
  }

  // ── File validation ─────────────────────────────────────────────────────
  const file = formData.get("pdfFile");
  if (!(file instanceof File) || file.size === 0) {
    redirect("/teacher/materials?error=file_missing");
  }

  if (file.type !== "application/pdf") {
    redirect("/teacher/materials?error=file_type");
  }

  if (file.size > MAX_PDF_BYTES) {
    redirect("/teacher/materials?error=file_size");
  }

  // ── Metadata ────────────────────────────────────────────────────────────
  const title = (formData.get("title") as string | null)?.trim() ?? "";
  if (!title) {
    redirect("/teacher/materials?error=title");
  }

  const description =
    ((formData.get("description") as string | null)?.trim() ?? "") || null;
  const audienceRaw = (formData.get("audience") as string | null)?.trim() ?? "";

  if (!isValidAudience(audienceRaw)) {
    redirect("/teacher/materials?error=audience");
  }

  const audienceInstrument =
    ((formData.get("audienceInstrument") as string | null)?.trim() ?? "") || null;
  const audienceStudentUserId =
    ((formData.get("audienceStudentUserId") as string | null)?.trim() ?? "") || null;

  if (audienceRaw === "student") {
    if (!audienceStudentUserId) {
      redirect("/teacher/materials?error=student");
    }
    const inStudio = await studentInStudio(audienceStudentUserId, studioName);
    if (!inStudio) {
      redirect("/teacher/materials?error=scope");
    }
  }

  if (audienceRaw === "instrument" && !audienceInstrument) {
    redirect("/teacher/materials?error=instrument");
  }

  // ── Resolve studio id ───────────────────────────────────────────────────
  const supabase = getServerSupabase();
  const { data: studio, error: studioErr } = await supabase
    .from("mewstro_studios")
    .select("id")
    .eq("studio_name", studioName)
    .single();

  if (studioErr || !studio) {
    redirect("/teacher/materials?error=server");
  }

  // ── Upload to storage ───────────────────────────────────────────────────
  const fileId = crypto.randomUUID();
  const storagePath = `${studio.id}/${fileId}.pdf`;

  const fileBuffer = await file.arrayBuffer();

  const { error: uploadErr } = await supabase.storage
    .from("studio-resources")
    .upload(storagePath, fileBuffer, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (uploadErr) {
    redirect("/teacher/materials?error=upload");
  }

  // ── Insert DB row ───────────────────────────────────────────────────────
  const result = await createResource({
    studioName,
    type: "document",
    title,
    description,
    url: null,
    storagePath,
    audience: audienceRaw as "studio" | "instrument" | "student",
    audienceInstrument: audienceRaw === "instrument" ? audienceInstrument : null,
    audienceStudentUserId:
      audienceRaw === "student" ? audienceStudentUserId : null,
  });

  if (!result.ok) {
    // Best-effort cleanup of the orphaned storage object
    await supabase.storage.from("studio-resources").remove([storagePath]);
    redirect("/teacher/materials?error=server");
  }

  revalidatePath("/teacher/materials");
}
