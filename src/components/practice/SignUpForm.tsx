"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/practice/supabase/client";
import { safeNext } from "./SignInForm";
import {
  AuthShell,
  GoogleIcon,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "./AuthShell";

export function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);

  async function signUpWithEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/practice/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }

    if (data.session) {
      router.push(next);
      router.refresh();
      return;
    }

    // Email confirmation is on for this project — the session arrives
    // once they tap the link in their inbox.
    setConfirmSent(true);
    setBusy(false);
  }

  async function signUpWithGoogle() {
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

  if (confirmSent) {
    return (
      <AuthShell
        heading="Check your inbox"
        sub={`We've sent a confirmation link to ${email}. Tap it and you'll land right back here, signed in and ready to play.`}
      >
        <p className="text-center text-sm text-mewstro-dim">
          Nothing arrived? Check spam, or{" "}
          <button
            type="button"
            className="font-semibold text-mewstro-primary"
            onClick={() => setConfirmSent(false)}
          >
            try again
          </button>
          .
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      heading="Join Mewstro"
      sub="Track your practice, keep your streak, and stay in tune with your teacher."
    >
      <form onSubmit={signUpWithEmail} className="flex flex-col gap-3">
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
          minLength={8}
          autoComplete="new-password"
          placeholder="Password (8+ characters)"
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
          Create account
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
        onClick={signUpWithGoogle}
        className={secondaryButtonClass}
      >
        <GoogleIcon />
        Continue with Google
      </button>

      <p className="mt-6 text-center text-sm text-mewstro-dim">
        Already have an account?{" "}
        <Link
          href={`/practice/sign-in?next=${encodeURIComponent(next)}`}
          className="font-semibold text-mewstro-primary"
        >
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
