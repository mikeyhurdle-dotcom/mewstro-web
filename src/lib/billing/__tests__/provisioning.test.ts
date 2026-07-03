import { describe, expect, it } from "vitest";
import {
  DEFAULT_STUDIO_NAME,
  STUDIO_NAME_MAX_LENGTH,
  extractStudioNameField,
  resolveProvisionNames,
  uniqueStudioName,
} from "../provisioning";

describe("extractStudioNameField", () => {
  it("finds the studio_name field and trims it", () => {
    expect(
      extractStudioNameField([
        { key: "something_else", text: { value: "nope" } },
        { key: "studio_name", text: { value: "  Sarah's Piano Studio  " } },
      ]),
    ).toBe("Sarah's Piano Studio");
  });

  it("returns null when the field is missing, empty, or whitespace", () => {
    expect(extractStudioNameField(undefined)).toBeNull();
    expect(extractStudioNameField(null)).toBeNull();
    expect(extractStudioNameField([])).toBeNull();
    expect(
      extractStudioNameField([{ key: "studio_name", text: { value: "" } }]),
    ).toBeNull();
    expect(
      extractStudioNameField([{ key: "studio_name", text: { value: "   " } }]),
    ).toBeNull();
    expect(extractStudioNameField([{ key: "studio_name" }])).toBeNull();
  });

  it("clamps absurdly long names to the checkout maximum", () => {
    const long = "x".repeat(500);
    expect(
      extractStudioNameField([{ key: "studio_name", text: { value: long } }])
        ?.length,
    ).toBe(STUDIO_NAME_MAX_LENGTH);
  });
});

describe("resolveProvisionNames", () => {
  it("prefers the checkout custom field for the studio name", () => {
    const { studioName, teacherName } = resolveProvisionNames({
      studioNameField: "Harmony House",
      customerName: "Sarah Chen",
      teacherEmail: "sarah@example.com",
    });
    expect(studioName).toBe("Harmony House");
    expect(teacherName).toBe("Sarah Chen");
  });

  it("falls back to <FirstName>'s Studio from the customer name", () => {
    const { studioName } = resolveProvisionNames({
      studioNameField: null,
      customerName: "Sarah Chen",
      teacherEmail: "sarah@example.com",
    });
    expect(studioName).toBe("Sarah's Studio");
  });

  it("falls back to the neutral default when there's no name at all", () => {
    const { studioName, teacherName } = resolveProvisionNames({
      studioNameField: null,
      customerName: null,
      teacherEmail: "sarah@example.com",
    });
    expect(studioName).toBe(DEFAULT_STUDIO_NAME);
    expect(teacherName).toBe("sarah");
  });

  it("treats a whitespace-only customer name as absent", () => {
    const { studioName, teacherName } = resolveProvisionNames({
      studioNameField: null,
      customerName: "   ",
      teacherEmail: "j.ingram@example.com",
    });
    expect(studioName).toBe(DEFAULT_STUDIO_NAME);
    expect(teacherName).toBe("j.ingram");
  });
});

describe("uniqueStudioName", () => {
  it("returns the base name when it's free", async () => {
    expect(await uniqueStudioName("Piano Studio", async () => false)).toBe(
      "Piano Studio",
    );
  });

  it("appends an incrementing number on collision", async () => {
    const taken = new Set(["Piano Studio", "Piano Studio 2"]);
    expect(
      await uniqueStudioName("Piano Studio", async (n) => taken.has(n)),
    ).toBe("Piano Studio 3");
  });
});
