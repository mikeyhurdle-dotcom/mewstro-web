"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/practice/supabase/client";
import { saveDisplayName } from "@/lib/practice/studio";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "./AuthShell";

/**
 * Deliberately minimal: display name + sign out. The display name is
 * written to mewstro_user_profiles and propagated to the leaderboard
 * membership override, same as iOS.
 */
export function SettingsView({
  userId,
  initialDisplayName,
  email,
}: {
  userId: string;
  initialDisplayName: string;
  email: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialDisplayName);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    setSaved(false);

    try {
      await saveDisplayName(createClient(), userId, name);
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
    setBusy(false);
  }

  return (
    <main className="flex flex-col px-6 pt-10">
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="mt-1 text-sm text-mewstro-dim">{email}</p>

      <form onSubmit={handleSave} className="mt-8 flex flex-col gap-3">
        <label className="text-sm">
          <span className="font-semibold">Display name</span>
          <input
            type="text"
            required
            autoCapitalize="words"
            className={`mt-1 ${inputClass}`}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSaved(false);
            }}
          />
          <span className="mt-1 block text-xs text-mewstro-dim">
            Shown to your teacher and on the studio leaderboard.
          </span>
        </label>

        {saved && (
          <p className="text-sm font-semibold text-mewstro-primary" role="status">
            Saved — sounding good!
          </p>
        )}
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy || !name.trim()}
          className={primaryButtonClass}
        >
          Save
        </button>
      </form>

      <form action="/practice/auth/sign-out" method="POST" className="mt-10">
        <button type="submit" className={secondaryButtonClass}>
          Sign out
        </button>
      </form>
    </main>
  );
}
