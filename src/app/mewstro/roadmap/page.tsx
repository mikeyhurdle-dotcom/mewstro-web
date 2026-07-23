import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Roadmap · Mewstro",
  description:
    "What's new in Mewstro and what's coming next. We ship constantly — here's the latest for teachers and their students.",
};

type Status = "live" | "next" | "earlier" | "progress";

const GROUPS: {
  heading: string;
  status: Status;
  blurb?: string;
  items: string[];
}[] = [
  {
    heading: "Live now",
    status: "live",
    blurb: "In your teacher dashboard today.",
    items: [
      "Studio Materials — share links, videos & PDFs with your studio",
      "Per-student assignments — set a task for one student from their page",
      "Edit a student's repertoire from your dashboard",
      "Student web portal — students practise from any browser",
      "Android app for students",
    ],
  },
  {
    heading: "Rolling out in the next app update",
    status: "next",
    blurb: "Built and on the way to your students' iPhones.",
    items: [
      "Studio Materials inside the student app",
      "Assignment inbox & history in the app",
      "Synced repertoire in the app",
    ],
  },
  {
    heading: "Earlier",
    status: "earlier",
    items: [
      "Studio leaderboard",
      "Milestone moments — students share practice clips",
      "Studio digest emails",
    ],
  },
  {
    heading: "In progress",
    status: "progress",
    blurb: "What we're building next.",
    items: ["Combined instruments (guitar + vocals)"],
  },
];

const BADGE: Record<Status, { label: string; cls: string }> = {
  live: { label: "Live", cls: "bg-[#2D8B7E] text-white" },
  next: { label: "Next update", cls: "bg-[#2D8B7E]/15 text-[#2D8B7E]" },
  earlier: { label: "Shipped", cls: "bg-[#E8DFD3] text-[#5A4E42]" },
  progress: { label: "In progress", cls: "bg-amber-100 text-amber-800" },
};

export default function MewstroRoadmapPage() {
  return (
    <div>
      <section className="bg-[#FFFBF7] px-6 py-16 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold text-[#1A1A2E]">Roadmap</h1>
          <p className="mt-3 text-lg text-[#5A4E42]">
            We ship constantly. Here&apos;s what&apos;s new for you and your
            students — and what&apos;s coming next.
          </p>
        </div>
      </section>

      <section className="px-6 py-12">
        <div className="mx-auto max-w-3xl space-y-10">
          {GROUPS.map((group) => (
            <div key={group.heading}>
              <div className="mb-2 flex flex-wrap items-center gap-3">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold ${BADGE[group.status].cls}`}
                >
                  {BADGE[group.status].label}
                </span>
                <h2 className="text-xl font-bold text-[#1A1A2E]">
                  {group.heading}
                </h2>
              </div>
              {group.blurb && (
                <p className="mb-3 text-sm text-[#6B7280]">{group.blurb}</p>
              )}
              <ul className="space-y-2">
                {group.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 rounded-xl border border-[#E8DFD3] bg-white px-4 py-3 text-sm text-[#1A1A2E]"
                  >
                    <span className="mt-0.5 text-[#2D8B7E]">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <p className="pt-2 text-center text-sm text-[#6B7280]">
            Founding Studios get first input on what we build next.
          </p>
        </div>
      </section>
    </div>
  );
}
