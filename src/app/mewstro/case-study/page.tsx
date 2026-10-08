import { permanentRedirect } from "next/navigation";

/**
 * The 2026 Founding Studio case study was retired in October 2026 when that
 * studio closed. Old links land on the story page instead.
 */
export default function RetiredCaseStudyPage() {
  permanentRedirect("/mewstro/story");
}
