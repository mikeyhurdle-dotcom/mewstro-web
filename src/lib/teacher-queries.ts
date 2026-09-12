import { getServerSupabase } from "./supabase";

/**
 * Typed read helpers for the teacher dashboard. Every function here pulls
 * from the shared HobbyPulse Supabase project (mewstro_ prefix) and
 * filters to a single studio. Callers pass the active studio name resolved
 * from a verified Supabase identity and explicit studio entitlement via
 * `getActiveStudioName()`.
 *
 * `ELLIE_STUDIO_NAME` is kept as an exported constant only because the
 * Ellie daily-join-digest cron is studio-specific by design and references
 * it directly. Dashboard pages must NOT use this constant — they should
 * always pass the active session's studio.
 */

export const ELLIE_STUDIO_NAME = "EM:CAS";

export interface StudentRow {
  userId: string;
  displayName: string;
  memberSince: string | null; // membership created_at — absent if we can't resolve
}

export interface StudentSummary extends StudentRow {
  /** Minutes practised in the last 7 days */
  weekMinutes: number;
  /** Minutes practised in the last 30 days */
  monthMinutes: number;
  /** Count of sessions in the last 30 days */
  monthSessions: number;
  /** Current streak of consecutive practice days ending today (or yesterday) */
  currentStreak: number;
  /** ISO timestamp of the most recent session, or null if never */
  lastPracticeAt: string | null;
  /** Distinct instruments played in the last 30 days */
  instruments: string[];
  /** Count of repertoire pieces (all time) */
  repertoireCount: number;
  /** Count of milestone recordings (all time) */
  milestoneCount: number;
}

export interface StudioOverview {
  studioName: string;
  teacherName: string;
  inviteCode: string;
  students: StudentSummary[];
  /** Aggregate minutes across all students this week */
  totalWeekMinutes: number;
  /** Count of active students (at least 1 session in last 7 days) */
  activeThisWeek: number;
  /** Count of students with any session ever */
  totalStudents: number;
}

export interface SessionRow {
  id: string;
  sessionDate: string;
  durationMinutes: number;
  taskType: string;
  instrumentType: string;
  focusLevel: number | null;
  mood: string | null;
  notes: string | null;
  repertoireId: string | null;
}

export interface RepertoireRow {
  id: string;
  title: string;
  artist: string | null;
  status: string;
  totalPracticeMinutes: number;
  instrumentType: string;
  targetBpm: number | null;
  currentBpm: number | null;
  targetCompletionDate: string | null;
}

export interface MilestoneRow {
  id: string;
  repertoireId: string;
  milestoneType: string;
  previousValue: string | null;
  newValue: string | null;
  createdAt: string;
  durationSeconds: number;
  /** 5-minute signed URL into the private `milestones` bucket. Present
   * when the student has flipped share_with_teacher on AND the file has
   * actually been uploaded. Null when the milestone is local-only. */
  videoUrl: string | null;
}

export interface StudentDetail extends StudentSummary {
  studioName: string;
  recentSessions: SessionRow[];
  repertoire: RepertoireRow[];
  milestones: MilestoneRow[];
  /** Map of YYYY-MM-DD → total minutes for the last 90 days */
  heatmap: Record<string, number>;
  assignments: StudentAssignmentRow[];
}

// ─── Assignment types ──────────────────────────────────────────────────

export interface AssignmentRow {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  createdAt: string;
  targetCount: number;
  completedCount: number;
  targets: { userId: string; displayName: string }[];
  completions: {
    userId: string;
    displayName: string;
    completedAt: string;
    notes: string | null;
  }[];
}

export interface StudentAssignmentRow {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  createdAt: string;
  completedAt: string | null;
  completionNotes: string | null;
}

export interface AssignmentSummary {
  activeCount: number;
  totalTargets: number;
  totalCompleted: number;
  /** Rolling completion rate across all active assignments (0-100) */
  completionPct: number;
}

/**
 * Day-local streak count. Mirrors the logic in the iOS `StreakCalculator`
 * (rewritten in Stage 1 — uses Set<Date> with startOfDay bucketing) so web
 * and iOS show the same number.
 */
function calcStreak(sessionDates: Date[]): number {
  if (sessionDates.length === 0) return 0;

  const bucket = new Set<string>();
  for (const d of sessionDates) {
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    bucket.add(key);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const key = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

  let cursor: Date;
  if (bucket.has(key(today))) {
    cursor = new Date(today);
  } else {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (bucket.has(key(yesterday))) {
      cursor = yesterday;
    } else {
      return 0;
    }
  }

  let streak = 0;
  while (bucket.has(key(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/**
 * Pull the full studio overview: teacher metadata + every student + their
 * aggregate practice stats for the student list view.
 */
export async function getStudioOverview(
  studioName: string,
): Promise<StudioOverview> {
  const supabase = getServerSupabase();

  // 1. Studio metadata
  const { data: studio, error: studioErr } = await supabase
    .from("mewstro_studios")
    .select("teacher_name, studio_name, invite_code")
    .eq("studio_name", studioName)
    .single();

  if (studioErr || !studio) {
    throw new Error(
      `Studio lookup failed: ${studioErr?.message ?? "not found"}`,
    );
  }

  // 2. Memberships for this studio. Teachers see ALL students regardless
  // of `opted_in` — that flag controls peer-leaderboard visibility on iOS,
  // not teacher visibility. Decision locked 2026-04-30 (HOBTRAC-118).
  const { data: memberships, error: memErr } = await supabase
    .from("mewstro_leaderboard_memberships")
    .select("user_id, display_name_override, opted_in")
    .eq("studio_name", studioName);

  if (memErr || !memberships) {
    throw new Error(
      `Membership fetch failed: ${memErr?.message ?? "empty"}`,
    );
  }

  const userIds = memberships.map((m) => m.user_id);
  if (userIds.length === 0) {
    return {
      studioName: studio.studio_name,
      teacherName: studio.teacher_name,
      inviteCode: studio.invite_code,
      students: [],
      totalWeekMinutes: 0,
      activeThisWeek: 0,
      totalStudents: 0,
    };
  }

  // 3. Last 30 days of sessions for every student in one query
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: sessions, error: sessErr } = await supabase
    .from("mewstro_practice_sessions")
    .select("user_id, session_date, duration_minutes, instrument_type")
    .in("user_id", userIds)
    .gte("session_date", thirtyDaysAgo.toISOString());

  if (sessErr) {
    throw new Error(`Sessions fetch failed: ${sessErr.message}`);
  }

  // 4. Repertoire + milestone counts per user (all time, excluding tombstoned)
  const [{ data: repertoire }, { data: milestones }] = await Promise.all([
    supabase
      .from("mewstro_repertoire")
      .select("user_id")
      .in("user_id", userIds)
      .is("deleted_at", null),
    supabase
      .from("mewstro_milestone_recordings")
      .select("user_id")
      .in("user_id", userIds),
  ]);

  // Aggregate per student
  const weekCutoff = new Date();
  weekCutoff.setDate(weekCutoff.getDate() - 7);

  const students: StudentSummary[] = memberships.map((m) => {
    const userSessions = (sessions ?? []).filter(
      (s) => s.user_id === m.user_id,
    );

    const weekSessions = userSessions.filter(
      (s) => new Date(s.session_date) >= weekCutoff,
    );

    const weekMinutes = weekSessions.reduce(
      (sum, s) => sum + s.duration_minutes,
      0,
    );
    const monthMinutes = userSessions.reduce(
      (sum, s) => sum + s.duration_minutes,
      0,
    );
    const lastSession = userSessions
      .map((s) => s.session_date)
      .sort()
      .reverse()[0];

    const instruments = Array.from(
      new Set(userSessions.map((s) => s.instrument_type)),
    );

    const sessionDates = userSessions.map((s) => new Date(s.session_date));
    const streak = calcStreak(sessionDates);

    const rCount = (repertoire ?? []).filter(
      (r) => r.user_id === m.user_id,
    ).length;
    const mCount = (milestones ?? []).filter(
      (x) => x.user_id === m.user_id,
    ).length;

    return {
      userId: m.user_id,
      displayName: m.display_name_override ?? "Student",
      memberSince: null,
      weekMinutes,
      monthMinutes,
      monthSessions: userSessions.length,
      currentStreak: streak,
      lastPracticeAt: lastSession ?? null,
      instruments,
      repertoireCount: rCount,
      milestoneCount: mCount,
    };
  });

  // Sort by weekMinutes desc (leaderboard order)
  students.sort((a, b) => b.weekMinutes - a.weekMinutes);

  const totalWeekMinutes = students.reduce((s, x) => s + x.weekMinutes, 0);
  const activeThisWeek = students.filter((s) => s.weekMinutes > 0).length;

  return {
    studioName: studio.studio_name,
    teacherName: studio.teacher_name,
    inviteCode: studio.invite_code,
    students,
    totalWeekMinutes,
    activeThisWeek,
    totalStudents: students.length,
  };
}

/**
 * Full detail for a single student: sessions, repertoire, milestones, and
 * a 90-day heatmap.
 */
export async function getStudentDetail(
  userId: string,
  studioName: string,
): Promise<StudentDetail | null> {
  const supabase = getServerSupabase();

  // Confirm the student belongs to this studio
  const { data: membership, error: memErr } = await supabase
    .from("mewstro_leaderboard_memberships")
    .select("user_id, display_name_override, studio_name")
    .eq("user_id", userId)
    .eq("studio_name", studioName)
    .single();

  if (memErr || !membership) return null;

  // 90 days of sessions, all repertoire, all milestones, in parallel
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const [sessionsRes, repertoireRes, milestonesRes] = await Promise.all([
    supabase
      .from("mewstro_practice_sessions")
      .select(
        "id, session_date, duration_minutes, task_type, instrument_type, focus_level, mood, notes, repertoire_id",
      )
      .eq("user_id", userId)
      .gte("session_date", ninetyDaysAgo.toISOString())
      .order("session_date", { ascending: false }),
    supabase
      .from("mewstro_repertoire")
      .select(
        "id, title, artist, status, total_practice_minutes, instrument_type, target_bpm, current_bpm, target_completion_date",
      )
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("mewstro_milestone_recordings")
      .select(
        "id, repertoire_id, milestone_type, previous_value, new_value, created_at, duration_seconds, storage_path, share_with_teacher",
      )
      .eq("user_id", userId)
      .eq("share_with_teacher", true)
      .order("created_at", { ascending: false }),
  ]);

  const sessions = sessionsRes.data ?? [];
  const repertoire = repertoireRes.data ?? [];
  const rawMilestones = milestonesRes.data ?? [];

  // Mint 5-minute signed URLs for each milestone that's actually been
  // uploaded. RLS on the `milestones` bucket re-evaluates per request so a
  // student revoking share_with_teacher takes effect on the *next* fetch
  // even if a previously-issued URL hasn't expired.
  const milestones = await Promise.all(
    rawMilestones.map(async (m) => {
      let videoUrl: string | null = null;
      if (m.storage_path) {
        const { data: signed } = await supabase.storage
          .from("milestones")
          .createSignedUrl(m.storage_path, 300);
        videoUrl = signed?.signedUrl ?? null;
      }
      return { ...m, videoUrl };
    }),
  );

  // Build 90-day heatmap: YYYY-MM-DD → minutes
  const heatmap: Record<string, number> = {};
  for (const s of sessions) {
    const d = new Date(s.session_date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    heatmap[key] = (heatmap[key] ?? 0) + s.duration_minutes;
  }

  // Reuse the overview aggregator logic by constructing a single-student
  // summary from the fetched data. Keeps the math consistent.
  const weekCutoff = new Date();
  weekCutoff.setDate(weekCutoff.getDate() - 7);
  const thirtyCutoff = new Date();
  thirtyCutoff.setDate(thirtyCutoff.getDate() - 30);

  const last30 = sessions.filter(
    (s) => new Date(s.session_date) >= thirtyCutoff,
  );
  const last7 = last30.filter(
    (s) => new Date(s.session_date) >= weekCutoff,
  );

  const weekMinutes = last7.reduce((sum, s) => sum + s.duration_minutes, 0);
  const monthMinutes = last30.reduce((sum, s) => sum + s.duration_minutes, 0);
  const streak = calcStreak(sessions.map((s) => new Date(s.session_date)));
  const instruments = Array.from(
    new Set(last30.map((s) => s.instrument_type)),
  );

  // Pull assignments targeted at this student + their completion status
  const studentAssignments = await getAssignmentsForStudent(userId);

  return {
    userId,
    displayName: membership.display_name_override ?? "Student",
    memberSince: null,
    studioName: membership.studio_name,
    weekMinutes,
    monthMinutes,
    monthSessions: last30.length,
    currentStreak: streak,
    lastPracticeAt: sessions[0]?.session_date ?? null,
    instruments,
    repertoireCount: repertoire.length,
    milestoneCount: milestones.length,
    recentSessions: sessions.slice(0, 30).map((s) => ({
      id: s.id,
      sessionDate: s.session_date,
      durationMinutes: s.duration_minutes,
      taskType: s.task_type,
      instrumentType: s.instrument_type,
      focusLevel: s.focus_level,
      mood: s.mood,
      notes: s.notes,
      repertoireId: s.repertoire_id,
    })),
    repertoire: repertoire.map((r) => ({
      id: r.id,
      title: r.title,
      artist: r.artist,
      status: r.status,
      totalPracticeMinutes: r.total_practice_minutes,
      instrumentType: r.instrument_type,
      targetBpm: r.target_bpm,
      currentBpm: r.current_bpm,
      targetCompletionDate: r.target_completion_date,
    })),
    milestones: milestones.map((m) => ({
      id: m.id,
      repertoireId: m.repertoire_id,
      milestoneType: m.milestone_type,
      previousValue: m.previous_value,
      newValue: m.new_value,
      createdAt: m.created_at,
      durationSeconds: m.duration_seconds,
      videoUrl: m.videoUrl,
    })),
    heatmap,
    assignments: studentAssignments,
  };
}

// ─── Assignment queries ────────────────────────────────────────────────

/**
 * All assignments for a studio, most recent first, with target and
 * completion details joined in.
 */
export async function getAssignmentsForStudio(
  studioName: string,
): Promise<AssignmentRow[]> {
  const supabase = getServerSupabase();

  // Resolve studio id
  const { data: studio } = await supabase
    .from("mewstro_studios")
    .select("id")
    .eq("studio_name", studioName)
    .single();

  if (!studio) return [];

  // Pull assignments for the studio
  const { data: assignments, error } = await supabase
    .from("mewstro_assignments")
    .select("id, title, description, due_date, created_at")
    .eq("studio_id", studio.id)
    .order("created_at", { ascending: false });

  if (error || !assignments) return [];

  if (assignments.length === 0) return [];

  const ids = assignments.map((a) => a.id);

  // Pull every target and completion for this set of assignments
  const [{ data: targets }, { data: completions }, { data: memberships }] =
    await Promise.all([
      supabase
        .from("mewstro_assignment_targets")
        .select("assignment_id, student_user_id")
        .in("assignment_id", ids),
      supabase
        .from("mewstro_assignment_completions")
        .select(
          "assignment_id, student_user_id, completed_at, notes",
        )
        .in("assignment_id", ids),
      supabase
        .from("mewstro_leaderboard_memberships")
        .select("user_id, display_name_override")
        .eq("studio_name", studioName),
    ]);

  const nameFor = (userId: string): string => {
    const row = memberships?.find((m) => m.user_id === userId);
    return row?.display_name_override ?? "Student";
  };

  return assignments.map((a) => {
    const aTargets = (targets ?? []).filter(
      (t) => t.assignment_id === a.id,
    );
    const aCompletions = (completions ?? []).filter(
      (c) => c.assignment_id === a.id,
    );
    return {
      id: a.id,
      title: a.title,
      description: a.description,
      dueDate: a.due_date,
      createdAt: a.created_at,
      targetCount: aTargets.length,
      completedCount: aCompletions.length,
      targets: aTargets.map((t) => ({
        userId: t.student_user_id,
        displayName: nameFor(t.student_user_id),
      })),
      completions: aCompletions.map((c) => ({
        userId: c.student_user_id,
        displayName: nameFor(c.student_user_id),
        completedAt: c.completed_at,
        notes: c.notes,
      })),
    };
  });
}

/**
 * Assignments targeted at a specific student, with their own completion
 * state joined in.
 */
export async function getAssignmentsForStudent(
  studentUserId: string,
): Promise<StudentAssignmentRow[]> {
  const supabase = getServerSupabase();

  // Assignment ids the student is targeted by
  const { data: targets } = await supabase
    .from("mewstro_assignment_targets")
    .select("assignment_id")
    .eq("student_user_id", studentUserId);

  const assignmentIds = (targets ?? []).map((t) => t.assignment_id);
  if (assignmentIds.length === 0) return [];

  const [{ data: assignments }, { data: completions }] = await Promise.all([
    supabase
      .from("mewstro_assignments")
      .select("id, title, description, due_date, created_at")
      .in("id", assignmentIds)
      .order("created_at", { ascending: false }),
    supabase
      .from("mewstro_assignment_completions")
      .select("assignment_id, completed_at, notes")
      .in("assignment_id", assignmentIds)
      .eq("student_user_id", studentUserId),
  ]);

  return (assignments ?? []).map((a) => {
    const completion = (completions ?? []).find(
      (c) => c.assignment_id === a.id,
    );
    return {
      id: a.id,
      title: a.title,
      description: a.description,
      dueDate: a.due_date,
      createdAt: a.created_at,
      completedAt: completion?.completed_at ?? null,
      completionNotes: completion?.notes ?? null,
    };
  });
}

/**
 * Summary stats across all of a studio's assignments — for the main
 * dashboard stat card.
 */
export async function getAssignmentSummary(
  studioName: string,
): Promise<AssignmentSummary> {
  const assignments = await getAssignmentsForStudio(studioName);
  const activeCount = assignments.length;
  const totalTargets = assignments.reduce(
    (sum, a) => sum + a.targetCount,
    0,
  );
  const totalCompleted = assignments.reduce(
    (sum, a) => sum + a.completedCount,
    0,
  );
  const completionPct =
    totalTargets > 0
      ? Math.round((totalCompleted / totalTargets) * 100)
      : 0;
  return { activeCount, totalTargets, totalCompleted, completionPct };
}

/**
 * Create a new assignment, target it at students, in one transaction-ish
 * flow. Called from the create form server action.
 */
export async function createAssignment(args: {
  studioName: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  studentUserIds: string[];
  idempotencyKey: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const supabase = getServerSupabase();

  const { data: studio, error: studioErr } = await supabase
    .from("mewstro_studios")
    .select("id, teacher_email")
    .eq("studio_name", args.studioName)
    .single();
  if (studioErr || !studio) return { ok: false, error: "Studio not found" };

  const placeholderTeacherId = "00000000-0000-0000-0000-000000000001";

  // Idempotent insert: a retry with the same key is ignored. We then read
  // back the row for this key so a double-submit returns the SAME id.
  const { error: upsertErr } = await supabase
    .from("mewstro_assignments")
    .upsert(
      {
        studio_id: studio.id,
        teacher_user_id: placeholderTeacherId,
        title: args.title,
        description: args.description,
        due_date: args.dueDate,
        idempotency_key: args.idempotencyKey,
      },
      { onConflict: "idempotency_key", ignoreDuplicates: true },
    );
  if (upsertErr) return { ok: false, error: upsertErr.message };

  // Read back the row for this idempotency key. Under a concurrent double-
  // submit the losing request's ON CONFLICT skips the insert and then reads
  // the winner's row — but if that insert isn't visible yet, retry once.
  let createdId: string | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    const { data } = await supabase
      .from("mewstro_assignments")
      .select("id")
      .eq("idempotency_key", args.idempotencyKey)
      .maybeSingle();
    if (data?.id) {
      createdId = data.id;
      break;
    }
    if (attempt === 0) await new Promise((r) => setTimeout(r, 150));
  }
  if (!createdId) {
    return { ok: false, error: "Insert failed" };
  }

  // Targets: PK is (assignment_id, student_user_id) so re-inserting on a
  // retry is naturally idempotent — ignore duplicates.
  if (args.studentUserIds.length > 0) {
    const rows = args.studentUserIds.map((uid) => ({
      assignment_id: createdId,
      student_user_id: uid,
    }));
    const { error: targetErr } = await supabase
      .from("mewstro_assignment_targets")
      .upsert(rows, {
        onConflict: "assignment_id,student_user_id",
        ignoreDuplicates: true,
      });
    if (targetErr) {
      return { ok: false, error: `Assignment created but targets failed: ${targetErr.message}` };
    }
  }

  return { ok: true, id: createdId };
}

// ─── Repertoire write helpers ──────────────────────────────────────────

/**
 * Returns true iff a `mewstro_leaderboard_memberships` row exists for the
 * given student under the given studio. Used as a multi-tenant scope guard
 * before any repertoire write so a teacher authed to studio A cannot touch
 * students in studio B.
 */
export async function studentInStudio(
  studentUserId: string,
  studioName: string,
): Promise<boolean> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("mewstro_leaderboard_memberships")
    .select("user_id")
    .eq("user_id", studentUserId)
    .eq("studio_name", studioName)
    .maybeSingle();
  return !error && data !== null;
}

/**
 * Update editable fields on a repertoire piece. `updated_at` is stamped by
 * the DB trigger — do NOT pass it here.
 * The `studentUserId` is used as a defence-in-depth `.eq("user_id", …)` on
 * the UPDATE so the write is always scoped to the owning student's row, even
 * if the piece id were somehow spoofed to belong to a different user.
 */
export async function updateRepertoirePiece(args: {
  id: string;
  studentUserId: string;
  studioName: string;
  title?: string;
  artist?: string | null;
  status?: string;
  targetBpm?: number | null;
  targetCompletionDate?: string | null;
  instrumentType?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getServerSupabase();
  const fields: Record<string, unknown> = {};
  if (args.title !== undefined) fields.title = args.title;
  if (args.artist !== undefined) fields.artist = args.artist;
  if (args.status !== undefined) fields.status = args.status;
  if (args.targetBpm !== undefined) fields.target_bpm = args.targetBpm;
  if (args.targetCompletionDate !== undefined)
    fields.target_completion_date = args.targetCompletionDate;
  if (args.instrumentType !== undefined) fields.instrument_type = args.instrumentType;
  const { error } = await supabase
    .from("mewstro_repertoire")
    .update(fields)
    .eq("id", args.id)
    .eq("user_id", args.studentUserId);
  return error ? { ok: false, error: error.message } : { ok: true };
}

/**
 * Soft-delete a repertoire piece by setting `deleted_at`. The DB trigger
 * also stamps `updated_at`.
 * The `studentUserId` is used as a defence-in-depth `.eq("user_id", …)` so
 * the delete cannot touch a row belonging to a different student.
 */
export async function softDeleteRepertoirePiece(
  id: string,
  studentUserId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getServerSupabase();
  const { error } = await supabase
    .from("mewstro_repertoire")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", studentUserId);
  return error ? { ok: false, error: error.message } : { ok: true };
}

// ─── Studio resource helpers ───────────────────────────────────────────

export interface StudioResourceRow {
  id: string;
  studioId: string;
  type: "link" | "embed" | "document";
  title: string;
  description: string | null;
  url: string | null;
  storagePath: string | null;
  audience: "studio" | "instrument" | "student";
  audienceInstrument: string | null;
  audienceStudentUserId: string | null;
  createdAt: string;
}

/**
 * List all non-deleted studio resources for a given studio, most recent
 * first. Uses service-role so no RLS; caller must resolve studioName
 * from the active session before calling.
 */
export async function listStudioResources(
  studioName: string,
): Promise<StudioResourceRow[]> {
  const supabase = getServerSupabase();

  const { data: studio, error: studioErr } = await supabase
    .from("mewstro_studios")
    .select("id")
    .eq("studio_name", studioName)
    .single();

  if (studioErr || !studio) return [];

  const { data, error } = await supabase
    .from("mewstro_studio_resources")
    .select(
      "id, studio_id, type, title, description, url, storage_path, audience, audience_instrument, audience_student_user_id, created_at",
    )
    .eq("studio_id", studio.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((r) => ({
    id: r.id,
    studioId: r.studio_id,
    type: r.type as "link" | "embed" | "document",
    title: r.title,
    description: r.description,
    url: r.url,
    storagePath: r.storage_path,
    audience: r.audience as "studio" | "instrument" | "student",
    audienceInstrument: r.audience_instrument,
    audienceStudentUserId: r.audience_student_user_id,
    createdAt: r.created_at,
  }));
}

/**
 * Insert a new studio resource. studio_id is resolved from studioName.
 * `updated_at` is trigger-stamped — do NOT pass it. For audience=student,
 * the action must have verified `studentInStudio` before calling this.
 */
export async function createResource(args: {
  studioName: string;
  type: "link" | "embed" | "document";
  title: string;
  description: string | null;
  url: string | null;
  storagePath: string | null;
  audience: "studio" | "instrument" | "student";
  audienceInstrument: string | null;
  audienceStudentUserId: string | null;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const supabase = getServerSupabase();

  const { data: studio, error: studioErr } = await supabase
    .from("mewstro_studios")
    .select("id")
    .eq("studio_name", args.studioName)
    .single();

  if (studioErr || !studio) return { ok: false, error: "Studio not found" };

  const { data, error } = await supabase
    .from("mewstro_studio_resources")
    .insert({
      studio_id: studio.id,
      type: args.type,
      title: args.title,
      description: args.description,
      url: args.url,
      storage_path: args.storagePath,
      audience: args.audience,
      audience_instrument: args.audienceInstrument,
      audience_student_user_id: args.audienceStudentUserId,
    })
    .select("id")
    .single();

  return error || !data
    ? { ok: false, error: error?.message ?? "Insert failed" }
    : { ok: true, id: data.id };
}

/**
 * Update editable fields on a studio resource, scoped to the studio.
 * `updated_at` is stamped by the DB trigger — do NOT set it here.
 */
export async function updateResource(args: {
  id: string;
  studioName: string;
  title?: string;
  description?: string | null;
  url?: string | null;
  audience?: "studio" | "instrument" | "student";
  audienceInstrument?: string | null;
  audienceStudentUserId?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getServerSupabase();

  const { data: studio, error: studioErr } = await supabase
    .from("mewstro_studios")
    .select("id")
    .eq("studio_name", args.studioName)
    .single();

  if (studioErr || !studio) return { ok: false, error: "Studio not found" };

  const fields: Record<string, unknown> = {};
  if (args.title !== undefined) fields.title = args.title;
  if (args.description !== undefined) fields.description = args.description;
  if (args.url !== undefined) fields.url = args.url;
  if (args.audience !== undefined) fields.audience = args.audience;
  if (args.audienceInstrument !== undefined)
    fields.audience_instrument = args.audienceInstrument;
  if (args.audienceStudentUserId !== undefined)
    fields.audience_student_user_id = args.audienceStudentUserId;

  const { error } = await supabase
    .from("mewstro_studio_resources")
    .update(fields)
    .eq("id", args.id)
    .eq("studio_id", studio.id);

  return error ? { ok: false, error: error.message } : { ok: true };
}

/**
 * Soft-delete a studio resource by setting `deleted_at`, scoped to the
 * studio so a teacher cannot delete resources from another studio.
 */
export async function softDeleteResource(
  id: string,
  studioName: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getServerSupabase();

  const { data: studio, error: studioErr } = await supabase
    .from("mewstro_studios")
    .select("id")
    .eq("studio_name", studioName)
    .single();

  if (studioErr || !studio) return { ok: false, error: "Studio not found" };

  const { error } = await supabase
    .from("mewstro_studio_resources")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("studio_id", studio.id);

  return error ? { ok: false, error: error.message } : { ok: true };
}

// ─── Repertoire write helpers ──────────────────────────────────────────

/**
 * Insert a new repertoire piece for a student. `total_practice_minutes`
 * defaults to 0; `updated_at` is stamped by the DB trigger.
 */
export async function addRepertoirePiece(args: {
  studentUserId: string;
  title: string;
  artist: string | null;
  status: string;
  instrumentType: string;
  targetBpm: number | null;
  targetCompletionDate: string | null;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("mewstro_repertoire")
    .insert({
      user_id: args.studentUserId,
      title: args.title,
      artist: args.artist,
      status: args.status,
      instrument_type: args.instrumentType,
      target_bpm: args.targetBpm,
      target_completion_date: args.targetCompletionDate,
      total_practice_minutes: 0,
    })
    .select("id")
    .single();
  return error || !data
    ? { ok: false, error: error?.message ?? "Insert failed" }
    : { ok: true, id: data.id };
}
