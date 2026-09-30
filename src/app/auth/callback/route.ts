import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get("next") ?? "/optimizer";

  const code = searchParams.get("code");
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    return NextResponse.redirect(`${origin}/auth?error=otp_expired`);
  }

  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as "email" | "signup" | "recovery" | "invite" | null;
  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    return NextResponse.redirect(`${origin}/auth?error=otp_expired`);
  }

  const err = searchParams.get("error_code") || searchParams.get("error");
  if (err) return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent(err)}`);
  return NextResponse.redirect(`${origin}/auth`);
}
