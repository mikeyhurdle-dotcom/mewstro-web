/**
 * Studio invite-code generation for self-serve provisioning.
 *
 * Codes are 6–8 chars, A–Z0–9 only, derived from the studio name so they
 * look hand-made ("Sarah's Piano Studio" → SARAHSPI) rather than random
 * noise. Existing hand-minted codes (EMCAS, MEWSTRO, JOSHINGRAM…) live in
 * the same `mewstro_studios.invite_code` column (UNIQUE), so every
 * candidate is collision-checked before use.
 *
 * Pure logic — the caller supplies `isTaken` (a DB lookup) and can inject
 * `random` for deterministic tests.
 */

export const INVITE_CODE_MIN_LENGTH = 6;
export const INVITE_CODE_MAX_LENGTH = 8;

const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O/1/I/L — read-aloud safe

function randomChars(count: number, random: () => number): string {
  let out = "";
  for (let i = 0; i < count; i++) {
    out += CODE_ALPHABET[Math.floor(random() * CODE_ALPHABET.length)];
  }
  return out;
}

/**
 * Derives the human-readable base of an invite code from a studio name:
 * uppercase, A–Z0–9 only, truncated to the max length. May come back
 * shorter than the minimum (or empty) — `generateInviteCode` pads it.
 */
export function deriveInviteCodeBase(studioName: string): string {
  return studioName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, INVITE_CODE_MAX_LENGTH);
}

/**
 * Generates a unique invite code for a new studio.
 *
 * Strategy:
 *   1. The name-derived base, padded with random chars up to the minimum
 *      length if the name is short.
 *   2. On collision: first 6 chars of the base + 2 random chars, retried.
 *   3. Last resort: fully random 8 chars (practically collision-free).
 *
 * `isTaken` is consulted for every candidate. A unique constraint on the
 * column remains the final arbiter — callers should still handle a 23505
 * by retrying, since two webhooks could race between check and insert.
 */
export async function generateInviteCode(
  studioName: string,
  isTaken: (code: string) => Promise<boolean>,
  random: () => number = Math.random,
): Promise<string> {
  const base = deriveInviteCodeBase(studioName);

  const first =
    base.length >= INVITE_CODE_MIN_LENGTH
      ? base
      : base + randomChars(INVITE_CODE_MIN_LENGTH - base.length, random);
  if (!(await isTaken(first))) return first;

  // Collision: keep the recognisable stem, vary the tail.
  const stem = first.slice(0, INVITE_CODE_MAX_LENGTH - 2);
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = stem + randomChars(2, random);
    if (!(await isTaken(candidate))) return candidate;
  }

  // Practically unreachable, but never loop forever on a hot stem.
  for (;;) {
    const candidate = randomChars(INVITE_CODE_MAX_LENGTH, random);
    if (!(await isTaken(candidate))) return candidate;
  }
}
