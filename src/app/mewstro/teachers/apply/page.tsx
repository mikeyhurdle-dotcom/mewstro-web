"use client";

import {
  useState,
  useMemo,
  useEffect,
  useRef,
  FormEvent,
  Suspense,
} from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getConsentStatus, trackLink, studioSizeTier } from "@/lib/tealium";
import { FOUNDING_SLOTS_LEFT } from "@/config/founding";
import { resolveAttribution } from "@/lib/utm";

const INSTRUMENTS = [
  { id: "piano", label: "Piano" },
  { id: "voice", label: "Voice" },
  { id: "violin", label: "Violin" },
  { id: "guitar", label: "Guitar" },
  { id: "drums", label: "Drums" },
  { id: "brass", label: "Brass" },
  { id: "woodwind", label: "Woodwind" },
  { id: "strings", label: "Other strings" },
  { id: "other", label: "Other" },
];

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success" }
  | { status: "error"; message: string };

function TeacherApplyForm() {
  const [submit, setSubmit] = useState<SubmitState>({ status: "idle" });
  const [selectedInstruments, setSelectedInstruments] = useState<Set<string>>(
    new Set(),
  );

  const searchParams = useSearchParams();

  // Resolve attribution from first-touch cookie, falling back to current URL.
  // Runs on the client after mount so cookie is readable.
  const [attribution, setAttribution] = useState<{
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
    referrer?: string;
    first_landing_page?: string;
  }>({});

  useEffect(() => {
    setAttribution(
      resolveAttribution({
        utm_source: searchParams.get("utm_source") ?? undefined,
        utm_medium: searchParams.get("utm_medium") ?? undefined,
        utm_campaign: searchParams.get("utm_campaign") ?? undefined,
        utm_content: searchParams.get("utm_content") ?? undefined,
        utm_term: searchParams.get("utm_term") ?? undefined,
      }),
    );
  }, [searchParams]);

  const utm = useMemo(
    () => ({
      source: attribution.utm_source,
      medium: attribution.utm_medium,
      campaign: attribution.utm_campaign,
      content: attribution.utm_content,
      referrer:
        attribution.referrer ??
        (typeof document !== "undefined"
          ? document.referrer || undefined
          : undefined),
    }),
    [
      attribution.utm_source,
      attribution.utm_medium,
      attribution.utm_campaign,
      attribution.utm_content,
      attribution.referrer,
    ],
  );

  useEffect(() => {
    trackLink("teacher_landing_viewed", {
      brand: "teacher",
      page_type: "apply",
      utm_source: utm.source ?? "",
      utm_medium: utm.medium ?? "",
      utm_campaign: utm.campaign ?? "",
      utm_content: utm.content ?? "",
    });
  }, [utm.source, utm.medium, utm.campaign, utm.content]);

  // Form lifecycle — fires teacher_apply_started on first field focus,
  // and teacher_apply_abandoned on unload if the user engaged but didn't submit.
  const formStartedRef = useRef(false);
  const submittedRef = useRef(false);

  // Captured form state, mirrored from inputs as the user types so that the
  // abandon beacon and the progress event have the user's email (without it,
  // AudienceStream has no way to address an abandon-recovery email).
  const firstNameRef = useRef("");
  const emailRef = useRef("");
  const progressFiredRef = useRef(false);

  const onFieldFocus = () => {
    if (formStartedRef.current) return;
    formStartedRef.current = true;
    trackLink("teacher_apply_started", {
      brand: "teacher",
      page_type: "apply",
      utm_source: utm.source ?? "",
      utm_medium: utm.medium ?? "",
      utm_campaign: utm.campaign ?? "",
      utm_content: utm.content ?? "",
    });
  };

  // Permissive email shape check — TLD must be 2+ chars to avoid firing on
  // "user@host.c" mid-type. Server still validates properly on submit.
  const isProbablyEmail = (s: string) => /.+@.+\..{2,}/.test(s);

  // onChange just mirrors the latest value into refs so the abandon beacon
  // (read at pagehide time) always has the freshest input. We deliberately
  // do NOT fire teacher_apply_progress here — see onIdentityBlur.
  const onIdentityChange = (
    field: "firstName" | "email",
    value: string,
  ) => {
    if (field === "firstName") firstNameRef.current = value;
    else emailRef.current = value;
  };

  // teacher_apply_progress fires once on email-field blur (i.e. the user has
  // finished typing the email and tabbed/clicked away). Firing on change
  // misfires mid-type — e.g. "user@host.c" passes a permissive regex and
  // leaves AudienceStream with a truncated email forever.
  const onIdentityBlur = () => {
    if (progressFiredRef.current) return;
    if (!isProbablyEmail(emailRef.current)) return;
    progressFiredRef.current = true;
    trackLink("teacher_apply_progress", {
      brand: "teacher",
      page_type: "apply",
      email: emailRef.current,
      first_name: firstNameRef.current,
      utm_source: utm.source ?? "",
      utm_medium: utm.medium ?? "",
      utm_campaign: utm.campaign ?? "",
      utm_content: utm.content ?? "",
    });
  };

  useEffect(() => {
    const onPageHide = () => {
      if (!formStartedRef.current || submittedRef.current) return;
      // Honour the cookie banner — if the visitor declined non-essential,
      // don't fire a marketing-purpose abandon event even via beacon.
      if (getConsentStatus() !== "granted") return;
      // sendBeacon survives unload where fetch would not. utag.link is
      // non-blocking but isn't guaranteed to complete on unload, so we go
      // direct to Tealium collect.
      const account = process.env.NEXT_PUBLIC_TEALIUM_ACCOUNT;
      const profile = process.env.NEXT_PUBLIC_TEALIUM_PROFILE;
      if (!account || !profile) return;
      if (typeof navigator === "undefined" || !navigator.sendBeacon) return;
      try {
        const payload = {
          tealium_account: account,
          tealium_profile: profile,
          tealium_event: "teacher_apply_abandoned",
          event_name: "teacher_apply_abandoned",
          brand: "teacher",
          page_type: "apply",
          email: emailRef.current,
          first_name: firstNameRef.current,
          has_email: emailRef.current ? "true" : "false",
          utm_source: utm.source ?? "",
          utm_medium: utm.medium ?? "",
          utm_campaign: utm.campaign ?? "",
          utm_content: utm.content ?? "",
        };
        navigator.sendBeacon(
          "https://collect.tealiumiq.com/event",
          new Blob([JSON.stringify(payload)], { type: "application/json" }),
        );
      } catch {
        // never break unload
      }
    };
    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, [utm.source, utm.medium, utm.campaign, utm.content]);

  function toggleInstrument(id: string) {
    setSelectedInstruments((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmit({ status: "submitting" });

    const form = e.currentTarget;
    const data = new FormData(form);

    const studentCount = data.get("estimatedStudentCount")
      ? Number(data.get("estimatedStudentCount"))
      : undefined;

    const payload = {
      firstName: data.get("firstName"),
      lastName: data.get("lastName"),
      email: data.get("email"),
      studioName: data.get("studioName") || undefined,
      location: data.get("location") || undefined,
      country: data.get("country") || "UK",
      estimatedStudentCount: studentCount,
      yearsTeaching: data.get("yearsTeaching")
        ? Number(data.get("yearsTeaching"))
        : undefined,
      instruments: Array.from(selectedInstruments),
      howHeard: data.get("howHeard") || undefined,
      notes: data.get("notes") || undefined,
      consent: data.get("consent") === "on",
      utmSource: utm.source,
      utmMedium: utm.medium,
      utmCampaign: utm.campaign,
      utmContent: utm.content,
      utmTerm: attribution.utm_term,
      firstLandingPage: attribution.first_landing_page,
      referrer: utm.referrer,
    };

    const analyticsBase = {
      brand: "teacher" as const,
      page_type: "apply" as const,
      studio_size_tier: studioSizeTier(studentCount) ?? "",
      instruments_count: String(selectedInstruments.size),
      has_studio_name: payload.studioName ? "true" : "false",
      country: String(payload.country ?? ""),
      utm_source: utm.source ?? "",
      utm_medium: utm.medium ?? "",
      utm_campaign: utm.campaign ?? "",
      utm_content: utm.content ?? "",
    };

    trackLink("teacher_apply_submitted", analyticsBase);

    try {
      const res = await fetch("/api/teacher-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        const message =
          json.error ?? "Something went wrong. Please try again.";
        setSubmit({ status: "error", message });
        trackLink("teacher_apply_failed", {
          ...analyticsBase,
          error_message: message,
          http_status: String(res.status),
        });
        return;
      }
      submittedRef.current = true;
      setSubmit({ status: "success" });
      trackLink("teacher_apply_succeeded", analyticsBase);
    } catch {
      const message = "Network error. Please try again.";
      setSubmit({ status: "error", message });
      trackLink("teacher_apply_failed", {
        ...analyticsBase,
        error_message: message,
        http_status: "0",
      });
    }
  }

  if (submit.status === "success") {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20">
        <div className="rounded-3xl border border-[#2D8B7E]/30 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#2D8B7E]/10">
            <Image
              src="/mewstro/mascot-celebrating.png"
              alt=""
              width={64}
              height={64}
            />
          </div>
          <h1 className="text-3xl font-bold text-[#1A1A2E]">
            Application received — I&apos;ll be in touch personally.
          </h1>
          <p className="mt-4 text-base text-[#5A4E42]">
            The founding round is open and I&apos;m hand-picking the studios
            — there are {FOUNDING_SLOTS_LEFT} of 5 spots left. I&apos;ll email
            you personally to set up a quick call. Applications are handled in
            order, so the sooner the better.
          </p>
          <div className="mt-8 rounded-2xl bg-[#FAF6EF] p-6 text-left text-sm text-[#5A4E42]">
            <p className="font-semibold text-[#1A1A2E]">
              What happens next:
            </p>
            <ol className="mt-3 space-y-2">
              <li>
                <strong>1.</strong> I email you personally to set up a
                15-minute call, in order of application.
              </li>
              <li>
                <strong>2.</strong> We make sure Mewstro&apos;s a genuine
                fit for your studio.
              </li>
              <li>
                <strong>3.</strong> Founding Studios get 50% off for life,
                a direct line to me, and first say on where Mewstro goes
                next. Only {FOUNDING_SLOTS_LEFT} of 5 spots left.
              </li>
            </ol>
          </div>
          <div className="mt-8 rounded-2xl border border-[#2D8B7E]/30 bg-[#2D8B7E]/5 p-5 text-left text-sm text-[#5A4E42]">
            <p className="font-semibold text-[#1A1A2E]">
              While you wait, take a look at the Studio toolkit.
            </p>
            <p className="mt-2">
              The handouts you&apos;ll be sending to your students and
              parents are already built. Have a play, generate a sample
              with your studio name, see what your rollout will feel like.
            </p>
            <Link
              href="/mewstro/teachers/assets"
              className="mt-3 inline-block font-semibold text-[#2D8B7E] hover:underline"
            >
              Browse the Studio toolkit →
            </Link>
          </div>
          <p className="mt-6 text-sm text-[#6B7280]">
            Or read the story behind Mewstro{" "}
            <Link
              href="/mewstro/story"
              className="font-semibold text-[#2D8B7E] hover:underline"
            >
              here
            </Link>
            .
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-14 md:py-20">
      <div className="mb-10 text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-[#2D8B7E]">
          Founding Studios — now open
        </p>
        <h1 className="mt-2 text-4xl font-bold text-[#1A1A2E] md:text-5xl">
          Claim one of the last {FOUNDING_SLOTS_LEFT} founding spots.
        </h1>
        <p className="mt-5 text-base text-[#5A4E42] md:text-lg">
          The founding pilot with my own piano teacher Ellie is done —
          Mewstro&apos;s proven in a real studio. The founding round is open
          and I&apos;m hand-picking the studios. Apply now and I&apos;ll speak
          to you personally. You get 50% off for life, a direct line to me,
          and first say on where the product goes next. Only{" "}
          {FOUNDING_SLOTS_LEFT} of 5 slots left, by application.
        </p>
      </div>

      {/* Founding Studio #2 (Josh Ingram) reassurance quote — approved for public use */}
      <figure className="mb-10 rounded-3xl border border-[#E8DFD3] bg-[#FAF6EF] p-6 md:p-8">
        <blockquote className="text-base leading-relaxed text-[#1A1A2E]">
          &ldquo;Overall Mewstro has given me a clearer understanding of my
          students&apos; activity in between lessons. It has allowed me greater
          ease of sharing learning materials with my students and has enabled me
          to have a source of contact which was missing before using the
          app.&rdquo;
        </blockquote>
        <figcaption className="mt-4">
          <span className="text-sm font-semibold text-[#1A1A2E]">
            Josh Ingram
          </span>
          <span className="ml-2 text-xs text-[#6B7280]">
            Founding Studio #2
          </span>
        </figcaption>
      </figure>

      <form
        onSubmit={onSubmit}
        onFocusCapture={onFieldFocus}
        className="rounded-3xl border border-[#E8DFD3] bg-white p-8 shadow-sm md:p-10"
      >
        {/* Name + email */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field label="First name" required>
            <input
              type="text"
              name="firstName"
              required
              maxLength={80}
              className={inputClass}
              autoComplete="given-name"
              onChange={(e) =>
                onIdentityChange("firstName", e.currentTarget.value)
              }
            />
          </Field>
          <Field label="Last name" required>
            <input
              type="text"
              name="lastName"
              required
              maxLength={80}
              className={inputClass}
              autoComplete="family-name"
            />
          </Field>
        </div>
        <Field label="Email" required>
          <input
            type="email"
            name="email"
            required
            maxLength={200}
            className={inputClass}
            autoComplete="email"
            onChange={(e) =>
              onIdentityChange("email", e.currentTarget.value)
            }
            onBlur={onIdentityBlur}
          />
        </Field>

        {/* Studio */}
        <Field
          label="Studio name"
          hint="Leave blank if you teach under your own name."
        >
          <input
            type="text"
            name="studioName"
            maxLength={150}
            className={inputClass}
          />
        </Field>

        {/* Location */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field label="City / town">
            <input
              type="text"
              name="location"
              maxLength={150}
              className={inputClass}
              placeholder="Oxford, UK"
              autoComplete="address-level2"
            />
          </Field>
          <Field label="Country">
            <input
              type="text"
              name="country"
              defaultValue="UK"
              maxLength={80}
              className={inputClass}
              autoComplete="country"
            />
          </Field>
        </div>

        {/* Students + years */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field
            label="How many students do you teach?"
            hint="A rough number is fine."
          >
            <input
              type="number"
              name="estimatedStudentCount"
              min={0}
              max={1000}
              step={1}
              className={inputClass}
              inputMode="numeric"
            />
          </Field>
          <Field label="Years teaching">
            <input
              type="number"
              name="yearsTeaching"
              min={0}
              max={80}
              step={1}
              className={inputClass}
              inputMode="numeric"
            />
          </Field>
        </div>

        {/* Instruments */}
        <Field
          label="Instruments you teach"
          hint="Pick all that apply."
        >
          <div className="mt-2 flex flex-wrap gap-2">
            {INSTRUMENTS.map((i) => {
              const selected = selectedInstruments.has(i.id);
              return (
                <button
                  key={i.id}
                  type="button"
                  onClick={() => toggleInstrument(i.id)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    selected
                      ? "border-[#2D8B7E] bg-[#2D8B7E] text-white"
                      : "border-[#E8DFD3] bg-white text-[#5A4E42] hover:border-[#2D8B7E]/50"
                  }`}
                  aria-pressed={selected}
                >
                  {i.label}
                </button>
              );
            })}
          </div>
        </Field>

        {/* How heard */}
        <Field
          label="How did you hear about Mewstro?"
          hint="Directory, social media, another teacher, a search. Anything you can remember is useful."
        >
          <input
            type="text"
            name="howHeard"
            maxLength={500}
            className={inputClass}
          />
        </Field>

        {/* Notes */}
        <Field
          label="Anything you'd like me to know?"
          hint="Optional. What you're hoping Mewstro can do, what other tools you've tried, studio specifics."
        >
          <textarea
            name="notes"
            maxLength={2000}
            rows={4}
            className={`${inputClass} resize-y`}
          />
        </Field>

        {/* Consent */}
        <div className="mt-6">
          <label className="flex items-start gap-3 text-sm text-[#5A4E42]">
            <input
              type="checkbox"
              name="consent"
              required
              className="mt-0.5 h-4 w-4 rounded border-[#E8DFD3] text-[#2D8B7E] focus:ring-[#2D8B7E]"
            />
            <span>
              I&apos;m happy to be contacted about my application and
              Mewstro&apos;s Founding Teacher programme. You won&apos;t be
              added to any mailing list.
            </span>
          </label>
        </div>

        {submit.status === "error" && (
          <p
            role="alert"
            className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {submit.message}
          </p>
        )}

        <div className="mt-8 flex flex-col-reverse items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[#6B7280]">
            No spam. I read every application personally.
          </p>
          <button
            type="submit"
            disabled={submit.status === "submitting"}
            className="rounded-full bg-[#2D8B7E] px-8 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.02] disabled:cursor-wait disabled:opacity-60"
          >
            {submit.status === "submitting"
              ? "Submitting..."
              : "Apply for a Founding Studio"}
          </button>
        </div>
      </form>

      <p className="mt-8 text-center text-sm text-[#6B7280]">
        Not a teacher? Mewstro for solo learners lives{" "}
        <Link
          href="/mewstro/app"
          className="font-semibold text-[#2D8B7E] hover:underline"
        >
          here
        </Link>
        .
      </p>
    </div>
  );
}

export default function TeacherApplyPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-6 py-14" />}>
      <TeacherApplyForm />
    </Suspense>
  );
}

const inputClass =
  "mt-2 w-full rounded-xl border border-[#E8DFD3] bg-white px-4 py-3 text-sm text-[#1A1A2E] shadow-sm outline-none transition-colors placeholder:text-[#9CA3AF] focus:border-[#2D8B7E] focus:ring-2 focus:ring-[#2D8B7E]/20";

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-5">
      <label className="block text-sm font-semibold text-[#1A1A2E]">
        {label}
        {required && <span className="ml-1 text-[#2D8B7E]">*</span>}
      </label>
      {hint && (
        <p className="mt-0.5 text-xs text-[#6B7280]">{hint}</p>
      )}
      {children}
    </div>
  );
}
