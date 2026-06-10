import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/practice/supabase/server";
import { fetchDisplayName } from "@/lib/practice/studio";
import { SettingsView } from "@/components/practice/SettingsView";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/practice/sign-in");

  const displayName = await fetchDisplayName(supabase, user.id);

  return (
    <SettingsView
      userId={user.id}
      initialDisplayName={displayName ?? ""}
      email={user.email ?? ""}
    />
  );
}
