"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/practice/supabase/client";
import {
  AuthShell,
  GoogleIcon,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "./AuthShell";

/** Only allow same-site relative return paths — never absolute URLs. */
export function safeNext(raw: string | null): string {
  if (raw && raw.startsWith("/practice")) return raw;
  return "/practice";
}

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function signInWithEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(
        error.message === "Invalid login credentials"
          ? "That email and password don't match. Have another go."
          : error.message,
      );
      setBusy(false);
      return;
    }

    router.push(next);
    router.refresh();
  }

  async function signInWithGoogle() {
    setBusy(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/practice/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      setError(error.message);
      setBusy(false);
    }
  }

  return (
    <AuthShell heading="Welcome back" sub="Pick up right where you left off.">
      <form onSubmit={signInWithEmail} className="flex flex-col gap-3">
        <input
          type="email"
          required
          autoComplete="email"
          placeholder="Email"
          className={inputClass}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          required
          autoComplete="current-password"
          placeholder="Password"
          className={inputClass}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <button type="submit" disabled={busy} className={primaryButtonClass}>
          Sign in
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-mewstro-dim">
        <span className="h-px flex-1 bg-[#E8DFD3]" />
        or
        <span className="h-px flex-1 bg-[#E8DFD3]" />
      </div>

      <button
        type="button"
        disabled={busy}
        onClick={signInWithGoogle}
        className={secondaryButtonClass}
      >
        <GoogleIcon />
        Continue with Google
      </button>

      <p className="mt-6 text-center text-sm text-mewstro-dim">
        New to Mewstro?{" "}
        <Link
          href={`/practice/sign-up?next=${encodeURIComponent(next)}`}
          className="font-semibold text-mewstro-primary"
        >
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
