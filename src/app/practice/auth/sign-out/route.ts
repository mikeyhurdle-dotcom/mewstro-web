import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/practice/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/practice/sign-in`, 303);
}
