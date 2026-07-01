import { getActiveStudioName } from "@/lib/teacher-auth";
import {
  getAssignmentsForStudio,
  type AssignmentRow,
} from "@/lib/teacher-queries";
import { redirect } from "next/navigation";
import Link from "next/link";

function formatDueDate(dueIso: string | null): {
  label: string;
  urgency: "overdue" | "soon" | "ok" | "none";
} {
  if (!dueIso) return { label: "No due date", urgency: "none" };
  const due = new Date(dueIso + "T23:59:59");
  const now = new Date();
  const diffDays = Math.floor(
    (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays < 0) {
    return {
      label: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? "" : "s"}`,
      urgency: "overdue",
    };
  }
  if (diffDays === 0) return { label: "Due today", urgency: "soon" };
  if (diffDays === 1) return { label: "Due tomorrow", urgency: "soon" };
  if (diffDays <= 3) return { label: `Due in ${diffDays} days`, urgency: "soon" };
  return { label: `Due in ${diffDays} days`, urgency: "ok" };
}

function formatRelative(iso: string): string {
  const diffDays = Math.floor(
    (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return `${Math.floor(diffDays / 7)} weeks ago`;
}

export default async function AssignmentsPage() {
  const studioName = await getActiveStudioName();
  if (!studioName) {
    redirect("/teacher/login");
  }

  const assignments = await getAssignmentsForStudio(studioName);

  const activeAssignments = assignments.filter((a) => {
    if (!a.dueDate) return true;
    const due = new Date(a.dueDate + "T23:59:59");
    return due >= new Date() || a.completedCount < a.targetCount;
  });

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      {/* Breadcrumb */}
      <Link
        href="/teacher"
        className="mb-6 inline-flex items-center gap-1 text-sm text-[#6B7280] hover:text-[#2D8B7E] transition-colors"
      >
        <span>←</span> Back to studio
      </Link>

      {/* Header */}
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Assignments</h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            Set tasks for your studio and see who&apos;s done them.
          </p>
        </div>
        <Link
          href="/teacher/assignments/new"
          className="inline-flex items-center gap-2 rounded-xl bg-[#2D8B7E] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#246F64] transition-colors"
        >
          <span className="text-lg leading-none">+</span> New assignment
        </Link>
      </div>

      {/* Summary stats */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        <StatCard
          label="Active assignments"
          value={String(activeAssignments.length)}
        />
        <StatCard
          label="Total completions"
          value={String(
            assignments.reduce((s, a) => s + a.completedCount, 0),
          )}
        />
        <StatCard
          label="Completion rate"
          value={(() => {
            const totalTargets = assignments.reduce(
              (s, a) => s + a.targetCount,
              0,
            );
            const totalDone = assignments.reduce(
              (s, a) => s + a.completedCount,
              0,
            );
            return totalTargets > 0
              ? `${Math.round((totalDone / totalTargets) * 100)}%`
              : "—";
          })()}
        />
      </div>

      {/* Assignment list */}
      {assignments.length === 0 ? (
        <div className="rounded-2xl border border-[#E8DFD3] bg-white p-16 text-center shadow-sm">
          <p className="text-lg font-medium">No assignments yet</p>
          <p className="mt-2 text-sm text-[#6B7280]">
            Tap &ldquo;New assignment&rdquo; above to set your first task.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((a) => (
            <AssignmentCard key={a.id} assignment={a} />
          ))}
        </div>
      )}

    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#E8DFD3] bg-white p-5 shadow-sm">
      <p className="text-xs uppercase tracking-wider text-[#6B7280]">
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold text-[#1A1A2E]">{value}</p>
    </div>
  );
}

function AssignmentCard({ assignment }: { assignment: AssignmentRow }) {
  const due = formatDueDate(assignment.dueDate);
  const completionPct =
    assignment.targetCount > 0
      ? Math.round(
          (assignment.completedCount / assignment.targetCount) * 100,
        )
      : 0;

  const urgencyStyles = {
    overdue: "bg-red-50 text-red-700 border-red-200",
    soon: "bg-amber-50 text-amber-700 border-amber-200",
    ok: "bg-[#2D8B7E]/10 text-[#2D8B7E] border-[#2D8B7E]/20",
    none: "bg-gray-50 text-gray-600 border-gray-200",
  };

  return (
    <div className="rounded-2xl border border-[#E8DFD3] bg-white p-6 shadow-sm hover:border-[#2D8B7E]/40 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold truncate">
              {assignment.title}
            </h3>
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${urgencyStyles[due.urgency]}`}
            >
              {due.label}
            </span>
          </div>
          {assignment.description && (
            <p className="mt-2 text-sm text-[#5A4E42] line-clamp-2">
              {assignment.description}
            </p>
          )}
          <p className="mt-2 text-xs text-[#6B7280]">
            Set {formatRelative(assignment.createdAt)}
          </p>
        </div>

        <div className="flex-shrink-0 text-right">
          <p className="text-3xl font-bold text-[#1A1A2E]">
            {assignment.completedCount}
            <span className="text-lg text-[#6B7280]">
              /{assignment.targetCount}
            </span>
          </p>
          <p className="text-xs text-[#6B7280]">completed</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#F0EBE2]">
        <div
          className="h-full bg-[#2D8B7E] transition-all"
          style={{ width: `${completionPct}%` }}
        />
      </div>

      {/* Target + completion chips */}
      {assignment.targets.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {assignment.targets.map((t) => {
            const isDone = assignment.completions.some(
              (c) => c.userId === t.userId,
            );
            return (
              <span
                key={t.userId}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
                  isDone
                    ? "bg-[#2D8B7E] text-white border-[#2D8B7E]"
                    : "bg-white text-[#5A4E42] border-[#E8DFD3]"
                }`}
              >
                {isDone && <span>✓</span>}
                {t.displayName}
              </span>
            );
          })}
        </div>
      )}

      {/* Completion notes — "how it went", per student */}
      {assignment.completions.some((c) => c.notes && c.notes.trim()) && (
        <div className="mt-4 space-y-2 border-t border-[#F0EBE2] pt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
            Notes from students
          </p>
          {assignment.completions
            .filter((c) => c.notes && c.notes.trim())
            .map((c) => (
              <div key={c.userId} className="flex gap-2 text-sm">
                <span className="shrink-0 font-medium text-[#2D8B7E]">
                  {c.displayName}
                </span>
                <span className="italic text-[#5A4E42]">
                  &ldquo;{c.notes}&rdquo;
                </span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

