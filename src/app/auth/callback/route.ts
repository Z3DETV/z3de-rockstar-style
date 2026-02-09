import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

function safeNext(raw: string | null) {
  if (!raw) return "/";
  if (!raw.startsWith("/")) return "/";
  if (raw.startsWith("//")) return "/";
  return raw;
}

export async function GET(request: Request) {
  const url = new URL(request.url);

  const code = url.searchParams.get("code"); // PKCE
  const token_hash = url.searchParams.get("token_hash"); // OTP
  const type = url.searchParams.get("type"); // signup/recovery/etc
  const next = safeNext(url.searchParams.get("next"));

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  try {
    if (code) {
      await supabase.auth.exchangeCodeForSession(code);
      return NextResponse.redirect(new URL(next, url.origin));
    }

    if (token_hash && type) {
      await supabase.auth.verifyOtp({ token_hash, type: type as any });
      return NextResponse.redirect(new URL(next, url.origin));
    }

    return NextResponse.redirect(new URL("/auth?mode=login", url.origin));
  } catch {
    return NextResponse.redirect(new URL("/auth?mode=login", url.origin));
  }
}
