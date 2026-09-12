import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  getActiveStudioName: vi.fn(),
  createAssignment: vi.fn(),
  redirect: vi.fn((destination: string) => {
    throw new Error(`REDIRECT:${destination}`);
  }),
}));

vi.mock("@/lib/teacher-auth", () => ({
  getActiveStudioName: state.getActiveStudioName,
}));

vi.mock("@/lib/teacher-queries", () => ({
  createAssignment: state.createAssignment,
}));

vi.mock("next/navigation", () => ({
  redirect: state.redirect,
}));

import { createAssignmentAction } from "./actions";

function validAssignment(): FormData {
  const formData = new FormData();
  formData.set("title", "Scales");
  formData.set("studentIds", "student-1");
  formData.set("idempotencyKey", "request-1");
  return formData;
}

describe("createAssignmentAction authorization", () => {
  beforeEach(() => {
    state.getActiveStudioName.mockReset();
    state.createAssignment.mockReset();
    state.redirect.mockClear();
  });

  it("fails closed before any write when no verified teacher is entitled", async () => {
    state.getActiveStudioName.mockResolvedValue(null);

    await expect(createAssignmentAction(validAssignment())).rejects.toThrow(
      "REDIRECT:/teacher/login",
    );
    expect(state.createAssignment).not.toHaveBeenCalled();
  });

  it("scopes an authorized write to the teacher's entitled studio", async () => {
    state.getActiveStudioName.mockResolvedValue("Teacher's Studio");
    state.createAssignment.mockResolvedValue({ ok: true, id: "assignment-1" });

    await expect(createAssignmentAction(validAssignment())).rejects.toThrow(
      "REDIRECT:/teacher/assignments?created=1",
    );
    expect(state.createAssignment).toHaveBeenCalledWith(
      expect.objectContaining({ studioName: "Teacher's Studio" }),
    );
  });
});
