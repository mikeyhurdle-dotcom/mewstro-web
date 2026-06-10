import { Suspense } from "react";
import type { Metadata } from "next";
import { SignUpForm } from "@/components/practice/SignUpForm";

export const metadata: Metadata = { title: "Sign up" };

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpForm />
    </Suspense>
  );
}
