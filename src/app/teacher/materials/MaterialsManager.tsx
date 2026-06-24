"use client";

import { useState } from "react";
import type { StudioResourceRow } from "@/lib/teacher-queries";
import {
  createResourceAction,
  updateResourceAction,
  deleteResourceAction,
  uploadDocumentResourceAction,
} from "./actions";

// Instrument list — mirrors iOS InstrumentType enum
const INSTRUMENTS = [
  "piano",
  "guitar",
  "violin",
  "drums",
  "voice",
  "flute",
  "saxophone",
  "trumpet",
  "cello",
  "bass",
  "ukulele",
  "other",
] as const;

const TYPE_OPTIONS: Array<{
  value: string;
  label: string;
}> = [
  { value: "link", label: "Link" },
  { value: "embed", label: "Embed (YouTube / Vimeo)" },
  { value: "document", label: "Document (PDF)" },
];

const MAX_PDF_BYTES = 26214400; // 25 MiB

type ResourceType = "link" | "embed" | "document";
type AudienceType = "studio" | "instrument" | "student";

const AUDIENCE_BADGE: Record<AudienceType, string> = {
  studio: "bg-[#2D8B7E]/10 text-[#2D8B7E] border-[#2D8B7E]/30",
  instrument: "bg-blue-50 text-blue-700 border-blue-200",
  student: "bg-amber-50 text-amber-700 border-amber-200",
};

export interface StudentOption {
  userId: string;
  displayName: string;
}

// ─── Resource row (read-only + edit) ────────────────────────────────────

function ResourceRow({
  resource,
  students,
}: {
  resource: StudioResourceRow;
  students: StudentOption[];
}) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  const [title, setTitle] = useState(resource.title);
  const [description, setDescription] = useState(resource.description ?? "");
  const [url, setUrl] = useState(resource.url ?? "");
  const [audience, setAudience] = useState<AudienceType>(
    resource.audience as AudienceType,
  );
  const [audienceInstrument, setAudienceInstrument] = useState(
    resource.audienceInstrument ?? INSTRUMENTS[0],
  );
  const [audienceStudentUserId, setAudienceStudentUserId] = useState(
    resource.audienceStudentUserId ?? "",
  );

  function audienceBadgeLabel(): string {
    if (resource.audience === "studio") return "Studio";
    if (resource.audience === "instrument")
      return resource.audienceInstrument ?? "Instrument";
    if (resource.audience === "student") {
      const s = students.find(
        (st) => st.userId === resource.audienceStudentUserId,
      );
      return s ? s.displayName : "A student";
    }
    return resource.audience;
  }

  async function handleSave(formData: FormData) {
    setBusy(true);
    await updateResourceAction(formData);
    setBusy(false);
    setEditing(false);
  }

  async function handleDelete(formData: FormData) {
    if (
      !window.confirm(
        `Delete "${resource.title}"? It will be removed from the student app immediately.`,
      )
    )
      return;
    setBusy(true);
    await deleteResourceAction(formData);
    // Page revalidates; component unmounts — no need to reset busy
  }

  if (editing) {
    return (
      <div className="rounded-xl border border-[#2D8B7E]/40 bg-[#F7FDFC] p-4">
        <form action={handleSave} className="space-y-3">
          <input type="hidden" name="resourceId" value={resource.id} />

          <div>
            <label className="mb-1 block text-xs font-medium text-[#6B7280]">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              name="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-[#E8DFD3] bg-white px-3 py-2 text-sm text-[#1A1A2E] focus:border-[#2D8B7E] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-[#6B7280]">
              Description
            </label>
            <textarea
              name="description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-[#E8DFD3] bg-white px-3 py-2 text-sm text-[#1A1A2E] focus:border-[#2D8B7E] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-[#6B7280]">
              URL <span className="text-red-500">*</span>
            </label>
            <input
              name="url"
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
              className="w-full rounded-lg border border-[#E8DFD3] bg-white px-3 py-2 text-sm text-[#1A1A2E] focus:border-[#2D8B7E] focus:outline-none"
            />
          </div>

          <AudienceSelector
            audience={audience}
            setAudience={setAudience}
            audienceInstrument={audienceInstrument}
            setAudienceInstrument={setAudienceInstrument}
            audienceStudentUserId={audienceStudentUserId}
            setAudienceStudentUserId={setAudienceStudentUserId}
            students={students}
          />

          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={() => setEditing(false)}
              disabled={busy}
              className="text-sm text-[#6B7280] hover:text-[#1A1A2E] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-[#2D8B7E] px-4 py-1.5 text-sm font-semibold text-white hover:bg-[#246F64] disabled:opacity-50"
            >
              {busy ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Read-only display
  return (
    <div className="rounded-xl border border-[#E8DFD3] bg-[#FFFBF7] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-[#1A1A2E] truncate">
              {resource.title}
            </p>
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize flex-shrink-0 ${
                AUDIENCE_BADGE[resource.audience as AudienceType]
              }`}
            >
              {audienceBadgeLabel()}
            </span>
            <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-500 flex-shrink-0 capitalize">
              {resource.type}
            </span>
          </div>
          {resource.description && (
            <p className="mt-1 text-sm text-[#6B7280] truncate">
              {resource.description}
            </p>
          )}
          {resource.url && (
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 block truncate text-xs text-[#2D8B7E] hover:underline"
            >
              {resource.url}
            </a>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setEditing(true)}
            className="rounded-lg border border-[#E8DFD3] bg-white px-2.5 py-1 text-xs font-medium text-[#2D8B7E] hover:bg-[#2D8B7E]/5 transition-colors"
          >
            Edit
          </button>
          <form action={handleDelete}>
            <input type="hidden" name="resourceId" value={resource.id} />
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg border border-red-200 bg-white px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              Delete
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Shared audience selector ─────────────────────────────────────────────

function AudienceSelector({
  audience,
  setAudience,
  audienceInstrument,
  setAudienceInstrument,
  audienceStudentUserId,
  setAudienceStudentUserId,
  students,
}: {
  audience: AudienceType;
  setAudience: (v: AudienceType) => void;
  audienceInstrument: string;
  setAudienceInstrument: (v: string) => void;
  audienceStudentUserId: string;
  setAudienceStudentUserId: (v: string) => void;
  students: StudentOption[];
}) {
  return (
    <div className="space-y-2">
      <label className="mb-1 block text-xs font-medium text-[#6B7280]">
        Who can see this?
      </label>
      {/* Hidden fields carry the derived values for the FormData */}
      <input type="hidden" name="audience" value={audience} />
      <input
        type="hidden"
        name="audienceInstrument"
        value={audience === "instrument" ? audienceInstrument : ""}
      />
      <input
        type="hidden"
        name="audienceStudentUserId"
        value={audience === "student" ? audienceStudentUserId : ""}
      />

      <div className="flex gap-2 flex-wrap">
        {(["studio", "instrument", "student"] as AudienceType[]).map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => setAudience(opt)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
              audience === opt
                ? "border-[#2D8B7E] bg-[#2D8B7E] text-white"
                : "border-[#E8DFD3] bg-white text-[#6B7280] hover:border-[#2D8B7E]/40"
            }`}
          >
            {opt === "studio" ? "Whole studio" : opt}
          </button>
        ))}
      </div>

      {audience === "instrument" && (
        <select
          value={audienceInstrument}
          onChange={(e) => setAudienceInstrument(e.target.value)}
          className="w-full rounded-lg border border-[#E8DFD3] bg-white px-3 py-2 text-sm text-[#1A1A2E] focus:border-[#2D8B7E] focus:outline-none capitalize"
        >
          {INSTRUMENTS.map((inst) => (
            <option key={inst} value={inst} className="capitalize">
              {inst.charAt(0).toUpperCase() + inst.slice(1)}
            </option>
          ))}
        </select>
      )}

      {audience === "student" && (
        <select
          value={audienceStudentUserId}
          onChange={(e) => setAudienceStudentUserId(e.target.value)}
          className="w-full rounded-lg border border-[#E8DFD3] bg-white px-3 py-2 text-sm text-[#1A1A2E] focus:border-[#2D8B7E] focus:outline-none"
        >
          <option value="">Select a student…</option>
          {students.map((s) => (
            <option key={s.userId} value={s.userId}>
              {s.displayName}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

// ─── Add material form ───────────────────────────────────────────────────

function AddMaterialForm({ students }: { students: StudentOption[] }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [type, setType] = useState<ResourceType>("link");
  const [audience, setAudience] = useState<AudienceType>("studio");
  const [audienceInstrument, setAudienceInstrument] = useState<string>(
    INSTRUMENTS[0],
  );
  const [audienceStudentUserId, setAudienceStudentUserId] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);
  const [ipChecked, setIpChecked] = useState(false);

  function handleTypeChange(newType: ResourceType) {
    setType(newType);
    setFileError(null);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) {
      setFileError(null);
      return;
    }
    if (f.type !== "application/pdf") {
      setFileError("Only PDF files are accepted.");
      e.target.value = "";
      return;
    }
    if (f.size > MAX_PDF_BYTES) {
      setFileError("File exceeds the 25 MB limit. Please choose a smaller PDF.");
      e.target.value = "";
      return;
    }
    setFileError(null);
  }

  async function handleAdd(formData: FormData) {
    // Client-side guard for document type
    if (type === "document") {
      const f = formData.get("pdfFile");
      if (!(f instanceof File) || f.size === 0) {
        setFileError("Please select a PDF file.");
        return;
      }
      if (f.type !== "application/pdf") {
        setFileError("Only PDF files are accepted.");
        return;
      }
      if (f.size > MAX_PDF_BYTES) {
        setFileError("File exceeds the 25 MB limit.");
        return;
      }
      if (!ipChecked) {
        setFileError("You must confirm you have the right to share this material.");
        return;
      }
      formData.set("ipAttestation", "true");
      setBusy(true);
      await uploadDocumentResourceAction(formData);
      setBusy(false);
      setOpen(false);
      return;
    }

    setBusy(true);
    await createResourceAction(formData);
    setBusy(false);
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[#2D8B7E]/50 px-3 py-2 text-sm font-medium text-[#2D8B7E] hover:bg-[#2D8B7E]/5 transition-colors w-full justify-center"
      >
        <span className="text-base leading-none">+</span> Add material
      </button>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-dashed border-[#2D8B7E]/50 bg-[#F7FDFC] p-4">
      <p className="mb-3 text-sm font-semibold text-[#1A1A2E]">
        New material
      </p>
      <form action={handleAdd} className="space-y-3">
        {/* Type picker */}
        <div>
          <label className="mb-1 block text-xs font-medium text-[#6B7280]">
            Type
          </label>
          <input type="hidden" name="type" value={type} />
          <div className="flex gap-2 flex-wrap">
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleTypeChange(opt.value as ResourceType)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  type === opt.value
                    ? "border-[#2D8B7E] bg-[#2D8B7E] text-white"
                    : "border-[#E8DFD3] bg-white text-[#6B7280] hover:border-[#2D8B7E]/40"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="mb-1 block text-xs font-medium text-[#6B7280]">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            name="title"
            required
            placeholder="e.g. Grade 5 theory guide"
            className="w-full rounded-lg border border-[#E8DFD3] bg-white px-3 py-2 text-sm text-[#1A1A2E] focus:border-[#2D8B7E] focus:outline-none"
          />
        </div>

        {/* Description */}
        <div>
          <label className="mb-1 block text-xs font-medium text-[#6B7280]">
            Description
          </label>
          <textarea
            name="description"
            rows={2}
            placeholder="Optional — what's this for?"
            className="w-full rounded-lg border border-[#E8DFD3] bg-white px-3 py-2 text-sm text-[#1A1A2E] focus:border-[#2D8B7E] focus:outline-none"
          />
        </div>

        {/* URL — link and embed only */}
        {type !== "document" && (
          <div>
            <label className="mb-1 block text-xs font-medium text-[#6B7280]">
              URL <span className="text-red-500">*</span>
            </label>
            <input
              name="url"
              type="url"
              required
              placeholder={
                type === "embed"
                  ? "https://youtu.be/… or https://vimeo.com/…"
                  : "https://…"
              }
              className="w-full rounded-lg border border-[#E8DFD3] bg-white px-3 py-2 text-sm text-[#1A1A2E] focus:border-[#2D8B7E] focus:outline-none"
            />
          </div>
        )}

        {/* PDF upload — document type only */}
        {type === "document" && (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-[#6B7280]">
                PDF file <span className="text-red-500">*</span>
              </label>
              <input
                name="pdfFile"
                type="file"
                accept="application/pdf"
                required
                onChange={handleFileChange}
                className="w-full rounded-lg border border-[#E8DFD3] bg-white px-3 py-2 text-sm text-[#1A1A2E] file:mr-3 file:rounded file:border-0 file:bg-[#2D8B7E]/10 file:px-3 file:py-1 file:text-xs file:font-medium file:text-[#2D8B7E] focus:border-[#2D8B7E] focus:outline-none"
              />
              <p className="mt-1 text-xs text-[#6B7280]">PDF only · max 25 MB</p>
              {fileError && (
                <p className="mt-1 text-xs font-medium text-red-600">{fileError}</p>
              )}
            </div>

            {/* IP attestation */}
            <label className="flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                checked={ipChecked}
                onChange={(e) => setIpChecked(e.target.checked)}
                className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-[#E8DFD3] text-[#2D8B7E] focus:ring-[#2D8B7E]"
              />
              <span className="text-xs text-[#6B7280]">
                I confirm that I have the right to share this material with my
                students (e.g. I created it, or have a licence to distribute it).{" "}
                <span className="text-red-500">*</span>
              </span>
            </label>
          </div>
        )}

        <AudienceSelector
          audience={audience}
          setAudience={setAudience}
          audienceInstrument={audienceInstrument}
          setAudienceInstrument={setAudienceInstrument}
          audienceStudentUserId={audienceStudentUserId}
          setAudienceStudentUserId={setAudienceStudentUserId}
          students={students}
        />

        <div className="flex items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={() => setOpen(false)}
            disabled={busy}
            className="text-sm text-[#6B7280] hover:text-[#1A1A2E] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-[#2D8B7E] px-4 py-1.5 text-sm font-semibold text-white hover:bg-[#246F64] disabled:opacity-50"
          >
            {busy ? "Uploading…" : "Add material"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────

export default function MaterialsManager({
  resources,
  students,
}: {
  resources: StudioResourceRow[];
  students: StudentOption[];
}) {
  return (
    <div>
      {resources.length === 0 ? (
        <p className="text-sm text-[#6B7280]">
          No materials yet. Add a link or embed below and your students will
          see it in the app.
        </p>
      ) : (
        <div className="space-y-3">
          {resources.map((r) => (
            <ResourceRow key={r.id} resource={r} students={students} />
          ))}
        </div>
      )}
      <AddMaterialForm students={students} />
    </div>
  );
}
