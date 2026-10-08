import { NextRequest, NextResponse } from "next/server";
import { ServerClient } from "postmark";
import { getServerSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

/**
 * Interest capture for the structured exam-prep pathway (ABRSM first).
 * Stores one row in mewstro_exam_prep_interest and emails Mikey. This is
 * the demand test for building the pathway: nothing here promises a feature.
 */

const BOARDS = ["abrsm", "trinity", "rsl", "lcm", "other", "unsure"] as const;
const TIMEFRAMES = ["this_term", "next_six_months", "next_year", "unsure"] as const;
const ROLES = ["learner", "teacher", "parent"] as const;

type Board = (typeof BOARDS)[number];
type Timeframe = (typeof TIMEFRAMES)[number];
type Role = (typeof ROLES)[number];

interface InterestPayload {
  email: string;
  role: Role;
  instrument: string | null;
  board: Board;
  grade: number | null;
  timeframe: Timeframe;
  hasTeacher: boolean | null;
  note: string | null;
  sourcePath: string | null;
}

function str(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const t = value.trim();
  return t ? t.slice(0, max) : null;
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : null;
}

function parse(body: unknown): InterestPayload | { error: string } {
  if (typeof body !== "object" || body === null) return { error: "Invalid payload" };
  const raw = body as Record<string, unknown>;

  // Honeypot: real browsers leave it empty.
  if (str(raw.website, 10)) return { error: "Invalid payload" };

  const email = str(raw.email, 200)?.toLowerCase() ?? null;
  if (!email || !/.+@.+\..+/.test(email)) return { error: "A valid email is required" };

  const role = oneOf(raw.role, ROLES) ?? "learner";
  const board = oneOf(raw.board, BOARDS) ?? "unsure";
  const timeframe = oneOf(raw.timeframe, TIMEFRAMES) ?? "unsure";

  const gradeRaw = typeof raw.grade === "string" ? Number(raw.grade) : raw.grade;
  const grade =
    typeof gradeRaw === "number" && Number.isInteger(gradeRaw) && gradeRaw >= 1 && gradeRaw <= 8
      ? gradeRaw
      : null;

  const hasTeacher =
    raw.hasTeacher === "yes" ? true : raw.hasTeacher === "no" ? false : null;

  return {
    email,
    role,
    instrument: str(raw.instrument, 60),
    board,
    grade,
    timeframe,
    hasTeacher,
    note: str(raw.note, 1000),
    sourcePath: str(raw.sourcePath, 300),
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function notify(p: InterestPayload): void {
  const token = process.env.POSTMARK_SERVER_TOKEN;
  const to = process.env.NOTIFY_EMAIL ?? "mikey@mewstro.com";
  if (!token) return;
  const rows: Array<[string, string]> = [
    ["Email", p.email],
    ["Role", p.role],
    ["Instrument", p.instrument ?? "-"],
    ["Board", p.board],
    ["Grade", p.grade ? String(p.grade) : "-"],
    ["When", p.timeframe],
    ["Has teacher", p.hasTeacher === null ? "-" : p.hasTeacher ? "yes" : "no"],
    ["Note", p.note ?? "-"],
  ];
  const text = ["New exam-prep interest", "", ...rows.map(([k, v]) => `${k}: ${v}`)].join("\n");
  const html = `<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1a1a1a;line-height:1.6;max-width:520px;margin:0 auto;padding:24px;">
<h2 style="color:#2D8B7E;margin-top:0;">New exam-prep interest 🎵</h2>
<table style="width:100%;border-collapse:collapse;font-size:14px;">
${rows
  .map(
    ([k, v]) =>
      `<tr><td style="padding:6px 0;color:#6B7280;width:120px;">${k}</td><td style="padding:6px 0;">${escapeHtml(v)}</td></tr>`,
  )
  .join("\n")}
</table>
</body></html>`;
  void new ServerClient(token)
    .sendEmail({
      From: "Mewstro <noreply@mewstro.com>",
      To: to,
      Subject: `Exam-prep interest: ${p.board} grade ${p.grade ?? "?"} (${p.role})`,
      TextBody: text,
      HtmlBody: html,
      MessageStream: "outbound",
    })
    .catch(() => {
      // Never let a notification failure surface to the visitor.
    });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = parse(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { error } = await getServerSupabase()
    .from("mewstro_exam_prep_interest")
    .insert({
      email: parsed.email,
      role: parsed.role,
      instrument: parsed.instrument,
      board: parsed.board,
      grade: parsed.grade,
      timeframe: parsed.timeframe,
      has_teacher: parsed.hasTeacher,
      note: parsed.note,
      source_path: parsed.sourcePath,
      user_agent: req.headers.get("user-agent"),
    });

  if (error) {
    console.error("exam-prep-interest insert failed", error);
    return NextResponse.json(
      { error: "Something went wrong saving that. Try again in a moment." },
      { status: 500 },
    );
  }

  notify(parsed);
  return NextResponse.json({ ok: true });
}
