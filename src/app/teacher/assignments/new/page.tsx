import { getActiveStudioName } from "@/lib/teacher-auth";
import { getStudioOverview } from "@/lib/teacher-queries";
import { redirect } from "next/navigation";
import Link from "next/link";
import { randomUUID } from "crypto";
import { createAssignmentAction } from "./actions";
import { SubmitButton } from "./SubmitButton";

export const metadata = {
  title: "New assignment · Mewstro Teacher",
  robots: { index: false, follow: false },
};

function errorFor(code: string | undefined): string | null {
  if (!code) return null;
  switch (code) {
    case "title":
      return "Give the assignment a title before saving.";
    case "students":
      return "Pick at least one student to assign this to.";
    case "server":
      return "Something went wrong saving. Try again — if it keeps failing, message me.";
    default:
      return null;
  }
}

export default async function NewAssignmentPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const studioName = await getActiveStudioName();
  if (!studioName) {
    redirect("/teacher/login");
  }

  const overview = await getStudioOverview(studioName);
  const params = await searchParams;
  const errorMessage = errorFor(params.error);
  const idempotencyKey = randomUUID();

  // Suggested default due date: next Sunday
  const suggestedDueDate = (() => {
    const d = new Date();
    const daysUntilSunday = (7 - d.getDay()) % 7 || 7;
    d.setDate(d.getDate() + daysUntilSunday);
    return d.toISOString().slice(0, 10);
  })();

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link
        href="/teacher/assignments"
        className="mb-6 inline-flex items-center gap-1 text-sm text-[#6B7280] hover:text-[#2D8B7E] transition-colors"
      >
        <span>←</span> Back to assignments
      </Link>

      <h1 className="text-3xl font-bold">New assignment</h1>
      <p className="mt-1 text-sm text-[#6B7280]">
        Set a task for your studio. Students see it in their app and mark
        it complete when they&apos;re done.
      </p>

      {errorMessage && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <form action={createAssignmentAction} className="mt-8 space-y-6">
        <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
        {/* Title */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-semibold text-[#1A1A2E]"
          >
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            placeholder="e.g. Practice your scales this week"
            autoComplete="off"
            className="mt-1.5 block w-full rounded-lg border border-[#E8DFD3] bg-white px-3 py-2.5 text-base focus:border-[#2D8B7E] focus:outline-none focus:ring-2 focus:ring-[#2D8B7E]/20"
          />
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-semibold text-[#1A1A2E]"
          >
            Description{" "}
            <span className="text-xs font-normal text-[#6B7280]">
              (optional)
            </span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            placeholder="What do you want them to work on? Any specific goals? Keep it short — this is what they'll read in the app."
            className="mt-1.5 block w-full rounded-lg border border-[#E8DFD3] bg-white px-3 py-2.5 text-base focus:border-[#2D8B7E] focus:outline-none focus:ring-2 focus:ring-[#2D8B7E]/20"
          />
        </div>

        {/* Due date */}
        <div>
          <label
            htmlFor="dueDate"
            className="block text-sm font-semibold text-[#1A1A2E]"
          >
            Due date{" "}
            <span className="text-xs font-normal text-[#6B7280]">
              (optional)
            </span>
          </label>
          <input
            id="dueDate"
            name="dueDate"
            type="date"
            defaultValue={suggestedDueDate}
            className="mt-1.5 block w-full rounded-lg border border-[#E8DFD3] bg-white px-3 py-2.5 text-base focus:border-[#2D8B7E] focus:outline-none focus:ring-2 focus:ring-[#2D8B7E]/20"
          />
          <p className="mt-1 text-xs text-[#6B7280]">
            Defaults to next Sunday. Leave empty for no deadline.
          </p>
        </div>

        {/* Student multi-select — default all checked */}
        <div>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-semibold text-[#1A1A2E]">
              Who is this for?
            </label>
            <span className="text-xs text-[#6B7280]">
              Tap any name to remove them
            </span>
          </div>
          <div className="mt-2 rounded-xl border border-[#E8DFD3] bg-white p-2">
            {overview.students.length === 0 ? (
              <p className="p-4 text-sm text-[#6B7280]">
                No students in your studio yet. Share your invite code
                first.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {overview.students.map((s) => (
                  <label
                    key={s.userId}
                    className="group flex items-center gap-2 rounded-lg p-2 text-sm hover:bg-[#FAF6EF] cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      name="studentIds"
                      value={s.userId}
                      defaultChecked
                      className="h-4 w-4 rounded border-[#E8DFD3] text-[#2D8B7E] focus:ring-[#2D8B7E]"
                    />
                    <span className="font-medium text-[#1A1A2E] truncate">
                      {s.displayName}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <p className="mt-2 text-xs text-[#6B7280]">
            All students are selected by default — uncheck anyone you
            don&apos;t want to include.
          </p>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 border-t border-[#E8DFD3] pt-6">
          <Link
            href="/teacher/assignments"
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-[#6B7280] hover:text-[#1A1A2E] transition-colors"
          >
            Cancel
          </Link>
          <SubmitButton />
        </div>
      </form>
    </div>
  );
}
