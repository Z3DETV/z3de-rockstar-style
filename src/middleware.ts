import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";

  // ✅ Canonique = www.z3de.net
  // Si on arrive sur z3de.net -> on redirige vers www.z3de.net
  if (host === "z3de.net" || host.startsWith("z3de.net:")) {
    const url = request.nextUrl.clone();
    url.hostname = host.replace(/^z3de\.net/, "www.z3de.net").replace(/:\d+$/, "");
    return NextResponse.redirect(url, 308);
  }

  // --- Supabase SSR (ton code) ---
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
