import Image from "next/image";

/** Shared chrome for the sign-in / sign-up screens. */
export function AuthShell({
  heading,
  sub,
  children,
}: {
  heading: string;
  sub: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 pt-14">
      <div className="flex flex-col items-center text-center">
        <Image
          src="/mewstro/mascot.png"
          alt="Mewstro the cat"
          width={96}
          height={96}
          priority
        />
        <h1 className="mt-5 text-2xl font-bold">{heading}</h1>
        <p className="mt-2 text-sm text-mewstro-dim">{sub}</p>
      </div>
      <div className="mt-8">{children}</div>
    </main>
  );
}

export function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.1H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z"
      />
    </svg>
  );
}

export const inputClass =
  "w-full rounded-xl border border-[#E8DFD3] bg-mewstro-surface px-4 py-3 text-base outline-none focus:border-mewstro-primary";

export const primaryButtonClass =
  "w-full rounded-2xl bg-mewstro-primary px-6 py-3.5 text-base font-semibold text-white shadow-sm disabled:opacity-50";

export const secondaryButtonClass =
  "flex w-full items-center justify-center gap-2 rounded-2xl border border-[#E8DFD3] bg-mewstro-surface px-6 py-3.5 text-base font-semibold";
