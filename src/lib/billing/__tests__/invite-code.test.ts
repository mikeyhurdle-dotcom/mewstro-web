import { describe, expect, it } from "vitest";
import {
  INVITE_CODE_MAX_LENGTH,
  INVITE_CODE_MIN_LENGTH,
  deriveInviteCodeBase,
  generateInviteCode,
} from "../invite-code";

const neverTaken = async () => false;

/** Deterministic "random" that walks the alphabet one step per call. */
function steppedRandom(): () => number {
  let i = 0;
  return () => {
    i = (i + 1) % 31;
    return i / 31;
  };
}

function takenSet(...codes: string[]): (code: string) => Promise<boolean> {
  const set = new Set(codes);
  return async (code) => set.has(code);
}

describe("deriveInviteCodeBase", () => {
  it("uppercases and strips everything outside A-Z0-9", () => {
    expect(deriveInviteCodeBase("Sarah's Piano Studio")).toBe("SARAHSPI");
    expect(deriveInviteCodeBase("EM:CAS")).toBe("EMCAS");
    expect(deriveInviteCodeBase("Studio 42!")).toBe("STUDIO42");
  });

  it("truncates to the maximum length", () => {
    const base = deriveInviteCodeBase("The Grand Conservatoire of Music");
    expect(base.length).toBe(INVITE_CODE_MAX_LENGTH);
    expect(base).toBe("THEGRAND");
  });

  it("handles names with no usable characters", () => {
    expect(deriveInviteCodeBase("🎹🎻")).toBe("");
    expect(deriveInviteCodeBase("   ")).toBe("");
  });
});

describe("generateInviteCode", () => {
  it("uses the name-derived base when free", async () => {
    const code = await generateInviteCode(
      "Sarah's Piano Studio",
      neverTaken,
      steppedRandom(),
    );
    expect(code).toBe("SARAHSPI");
  });

  it("pads short names up to the minimum length", async () => {
    const code = await generateInviteCode("Em", neverTaken, steppedRandom());
    expect(code.length).toBeGreaterThanOrEqual(INVITE_CODE_MIN_LENGTH);
    expect(code.startsWith("EM")).toBe(true);
    expect(code).toMatch(/^[A-Z0-9]+$/);
  });

  it("produces a fully random code for unusable names", async () => {
    const code = await generateInviteCode("🎹🎻", neverTaken, steppedRandom());
    expect(code.length).toBeGreaterThanOrEqual(INVITE_CODE_MIN_LENGTH);
    expect(code.length).toBeLessThanOrEqual(INVITE_CODE_MAX_LENGTH);
    expect(code).toMatch(/^[A-Z0-9]+$/);
  });

  it("keeps a recognisable stem and varies the tail on collision", async () => {
    const code = await generateInviteCode(
      "Sarah's Piano Studio",
      takenSet("SARAHSPI"),
      steppedRandom(),
    );
    expect(code).not.toBe("SARAHSPI");
    expect(code.startsWith("SARAHS")).toBe(true);
    expect(code.length).toBe(INVITE_CODE_MAX_LENGTH);
  });

  it("checks every candidate against existing codes until one is free", async () => {
    const checked: string[] = [];
    const set = new Set(["SARAHSPI"]);
    const code = await generateInviteCode(
      "Sarah's Piano Studio",
      async (c) => {
        checked.push(c);
        return set.has(c);
      },
      steppedRandom(),
    );
    expect(checked[0]).toBe("SARAHSPI");
    expect(checked[checked.length - 1]).toBe(code);
    expect(set.has(code)).toBe(false);
  });

  it("falls back to a fully random code when the stem is exhausted", async () => {
    // Everything starting with the stem is taken; only stem-free random
    // codes are allowed through.
    const code = await generateInviteCode(
      "Sarah's Piano Studio",
      async (c) => c.startsWith("SARAHS"),
      steppedRandom(),
    );
    expect(code.startsWith("SARAHS")).toBe(false);
    expect(code.length).toBe(INVITE_CODE_MAX_LENGTH);
    expect(code).toMatch(/^[A-Z0-9]+$/);
  });

  it("always yields codes within 6-8 chars of A-Z0-9 for varied names", async () => {
    const names = [
      "A",
      "Josh Ingram Studio",
      "Ms. Lee — Violin & Viola (Cambridge)",
      "音乐工作室",
      "The Extremely Long Studio Name That Never Ends",
    ];
    for (const name of names) {
      const code = await generateInviteCode(name, neverTaken, steppedRandom());
      expect(code.length).toBeGreaterThanOrEqual(INVITE_CODE_MIN_LENGTH);
      expect(code.length).toBeLessThanOrEqual(INVITE_CODE_MAX_LENGTH);
      expect(code).toMatch(/^[A-Z0-9]+$/);
    }
  });
});
