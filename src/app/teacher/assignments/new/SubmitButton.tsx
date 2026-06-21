"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-[#2D8B7E] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#246F64] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? "Creating…" : "Create assignment"}
    </button>
  );
}
