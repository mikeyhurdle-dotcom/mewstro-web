import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  cookieValues: new Map<string, string>(),
  cookieSets: [] as Array<{ name: string; value: string; options: unknown }>,
  cookieDeletes: [] as string[],
  getUser: vi.fn(),
  getClaims: vi.fn(),
  signOut: vi.fn(),
  studios: [] as Array<{
    id: string;
    studio_name: string;
    teacher_email: string | null;
  }>,
  lookupError: null as unknown,
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get(name: string) {
      const value = state.cookieValues.get(name);
      return value === undefined ? undefined : { name, value };
    },
    set(name: string, value: string, options: unknown) {
      state.cookieValues.set(name, value);
      state.cookieSets.push({ name, value, options });
    },
    delete(name: string) {
      state.cookieValues.delete(name);
      state.cookieDeletes.push(name);
    },
  })),
}));

vi.mock("@/lib/teacher/supabase/server", () => ({
  createTeacherAuthClient: vi.fn(async () => ({
    auth: {
      getUser: state.getUser,
      getClaims: state.getClaims,
      signOut: state.signOut,
    },
  })),
}));

vi.mock("@/lib/supabase", () => ({
  getServerSupabase: vi.fn(() => {
    type Builder = {
      select: (columns: string) => Builder;
      ilike: (column: string, pattern: string) => Builder;
      eq: (column: string, value: unknown) => Builder;
      order: (
        column: string,
        options: { ascending: boolean },
      ) => Promise<{ data: typeof state.studios; error: unknown }>;
    };

    const builder = {} as Builder;
    builder.select = () => builder;
    builder.ilike = () => builder;
    builder.eq = () => builder;
    builder.order = async () => ({
      data: state.studios,
      error: state.lookupError,
    });

    return {
      from: vi.fn(() => builder),
    };
  }),
}));

import {
  getEntitledStudios,
  resolveActiveStudioName,
  setActiveStudioSelector,
  STUDIO_SELECTOR_COOKIE,
  teacherLogout,
} from "./teacher-auth";

const OWN_STUDIO = {
  id: "studio-own",
  studio_name: "Teacher's Studio",
  teacher_email: "teacher@example.com",
};
const SECOND_OWN_STUDIO = {
  id: "studio-second",
  studio_name: "Teacher's Second Studio",
  teacher_email: "teacher@example.com",
};
const OTHER_STUDIO = {
  id: "studio-other",
  studio_name: "Other Studio",
  teacher_email: "other@example.com",
};
const TEACHER_USER = { id: "user-teacher", email: "teacher@example.com" };

/** The session's verified claims: who it is and how they signed in. */
function claims(amr: unknown, sub = TEACHER_USER.id) {
  return { data: { claims: { sub, amr } }, error: null };
}

describe("teacher authorization", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
    process.env.TEACHER_DASHBOARD_PASSWORD_DEMO = "retired-secret";

    state.cookieValues.clear();
    state.cookieSets.length = 0;
    state.cookieDeletes.length = 0;
    state.studios = [];
    state.lookupError = null;
    state.getUser.mockReset();
    state.getUser.mockResolvedValue({ data: { user: null }, error: null });
    state.getClaims.mockReset();
    state.getClaims.mockResolvedValue(
      claims([{ method: "magiclink", timestamp: 1 }]),
    );
    state.signOut.mockReset();
    state.signOut.mockResolvedValue({ error: null });
  });

  it("rejects a forged legacy password cookie even when legacy env vars exist", async () => {
    state.cookieValues.set("mewstro_teacher_session", "Mewstro Studio");

    await expect(resolveActiveStudioName()).resolves.toBeNull();
    expect(state.getUser).toHaveBeenCalledOnce();
  });

  it("keeps a verified teacher's entitled studio accessible", async () => {
    state.getUser.mockResolvedValue({
      data: { user: TEACHER_USER },
      error: null,
    });
    state.studios = [OWN_STUDIO, SECOND_OWN_STUDIO, OTHER_STUDIO];
    state.cookieValues.set(STUDIO_SELECTOR_COOKIE, SECOND_OWN_STUDIO.id);

    await expect(resolveActiveStudioName()).resolves.toBe(
      SECOND_OWN_STUDIO.studio_name,
    );
  });

  it("rejects an authenticated identity without an active studio entitlement", async () => {
    state.getUser.mockResolvedValue({
      data: { user: { id: TEACHER_USER.id, email: "unknown@example.com" } },
      error: null,
    });

    await expect(resolveActiveStudioName()).resolves.toBeNull();
  });

  it("fails closed when Supabase returns user data alongside an auth error", async () => {
    state.getUser.mockResolvedValue({
      data: { user: TEACHER_USER },
      error: new Error("invalid session"),
    });
    state.studios = [OWN_STUDIO];

    await expect(resolveActiveStudioName()).resolves.toBeNull();
  });

  it.each(["password", "oauth", "anonymous"])(
    "rejects a %s session even when its email owns a studio",
    async (method) => {
      state.getUser.mockResolvedValue({
        data: { user: TEACHER_USER },
        error: null,
      });
      state.getClaims.mockResolvedValue(claims([{ method, timestamp: 1 }]));
      state.studios = [OWN_STUDIO];

      await expect(resolveActiveStudioName()).resolves.toBeNull();
      await expect(setActiveStudioSelector(OWN_STUDIO.id)).resolves.toBe(false);
    },
  );

  it.each([
    [[{ method: "otp", timestamp: 1 }]],
    [["magiclink"]],
    [[{ method: "magiclink", timestamp: 1 }, { method: "totp", timestamp: 2 }]],
  ])("accepts a session established by an emailed link (%j)", async (amr) => {
    state.getUser.mockResolvedValue({
      data: { user: TEACHER_USER },
      error: null,
    });
    state.getClaims.mockResolvedValue(claims(amr));
    state.studios = [OWN_STUDIO];

    await expect(resolveActiveStudioName()).resolves.toBe(
      OWN_STUDIO.studio_name,
    );
  });

  it("fails closed when the session claims cannot be verified", async () => {
    state.getUser.mockResolvedValue({
      data: { user: TEACHER_USER },
      error: null,
    });
    state.getClaims.mockResolvedValue({
      data: null,
      error: new Error("bad signature"),
    });
    state.studios = [OWN_STUDIO];

    await expect(resolveActiveStudioName()).resolves.toBeNull();
  });

  it("fails closed when the claims carry no sign-in method", async () => {
    state.getUser.mockResolvedValue({
      data: { user: TEACHER_USER },
      error: null,
    });
    state.getClaims.mockResolvedValue(claims(undefined));
    state.studios = [OWN_STUDIO];

    await expect(resolveActiveStudioName()).resolves.toBeNull();
  });

  it("fails closed when the claims belong to a different user", async () => {
    state.getUser.mockResolvedValue({
      data: { user: TEACHER_USER },
      error: null,
    });
    state.getClaims.mockResolvedValue(
      claims([{ method: "magiclink", timestamp: 1 }], "user-someone-else"),
    );
    state.studios = [OWN_STUDIO];

    await expect(resolveActiveStudioName()).resolves.toBeNull();
  });

  it("ignores a forged cross-studio selector and stays inside the entitlement set", async () => {
    state.getUser.mockResolvedValue({
      data: { user: TEACHER_USER },
      error: null,
    });
    state.studios = [OWN_STUDIO, OTHER_STUDIO];
    state.cookieValues.set(STUDIO_SELECTOR_COOKIE, OTHER_STUDIO.id);

    await expect(resolveActiveStudioName()).resolves.toBe(
      OWN_STUDIO.studio_name,
    );
  });

  it("refuses to issue a selector for a studio the teacher does not own", async () => {
    state.getUser.mockResolvedValue({
      data: { user: TEACHER_USER },
      error: null,
    });
    state.studios = [OWN_STUDIO, OTHER_STUDIO];

    await expect(setActiveStudioSelector(OTHER_STUDIO.id)).resolves.toBe(false);
    expect(state.cookieSets).toHaveLength(0);
  });

  it("issues the selector only for a currently entitled studio", async () => {
    state.getUser.mockResolvedValue({
      data: { user: TEACHER_USER },
      error: null,
    });
    state.studios = [OWN_STUDIO, OTHER_STUDIO];

    await expect(setActiveStudioSelector(OWN_STUDIO.id)).resolves.toBe(true);
    expect(state.cookieSets).toEqual([
      expect.objectContaining({
        name: STUDIO_SELECTOR_COOKIE,
        value: OWN_STUDIO.id,
      }),
    ]);
  });

  it("matches wildcard-bearing emails as exact values, not PostgREST patterns", async () => {
    state.studios = [
      OTHER_STUDIO,
      {
        id: "studio-special",
        studio_name: "Special Studio",
        teacher_email: "teach%_*er@example.com",
      },
    ];

    await expect(
      getEntitledStudios("TEACH%_*ER@example.com"),
    ).resolves.toEqual([
      { id: "studio-special", studio_name: "Special Studio" },
    ]);
  });

  it("logs out of Supabase and clears both current and legacy cookies", async () => {
    state.cookieValues.set(STUDIO_SELECTOR_COOKIE, OWN_STUDIO.id);
    state.cookieValues.set("mewstro_teacher_session", OWN_STUDIO.studio_name);

    await teacherLogout();

    expect(state.cookieDeletes).toEqual([
      "mewstro_teacher_session",
      STUDIO_SELECTOR_COOKIE,
    ]);
    expect(state.signOut).toHaveBeenCalledOnce();
  });
});
