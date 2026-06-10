import { redirect } from "next/navigation";
import { createClient } from "@/lib/practice/supabase/server";
import { PortalNav } from "@/components/practice/PortalNav";

/**
 * Shell for the signed-in portal pages. The middleware already gates
 * /practice/*, but we re-check here so a misconfigured matcher can never
 * leak an authed page.
 */
export default async function PortalAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/practice/sign-in?next=/practice");
  }

  return (
    <div className="mx-auto min-h-dvh w-full max-w-md pb-24">
      {children}
      <PortalNav />
    </div>
  );
}
