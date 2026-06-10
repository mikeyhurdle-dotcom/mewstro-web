import Image from "next/image";
import Link from "next/link";

export default function TodayPage() {
  return (
    <main className="flex flex-col items-center px-6 pt-12 text-center">
      <Image
        src="/mewstro/mascot.png"
        alt="Mewstro the cat, baton at the ready"
        width={140}
        height={140}
        priority
      />
      <h1 className="mt-6 text-2xl font-bold">Ready when you are</h1>
      <p className="mt-2 text-sm text-mewstro-dim">
        Every practice deserves an encore.
      </p>
      <Link
        href="/practice/timer"
        className="mt-8 w-full rounded-2xl bg-mewstro-primary px-6 py-4 text-base font-semibold text-white shadow-sm"
      >
        Start practising
      </Link>
    </main>
  );
}
