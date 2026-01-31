"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Profile = {
  username: string | null;
  avatar_url?: string | null;
};

export default function Navbar() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);

      if (data.user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("username, avatar_url")
          .eq("id", data.user.id)
          .single();

        setProfile(profileData ?? null);
      } else {
        setProfile(null);
      }

      setLoading(false);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      getUser();
    });

    return () => subscription.unsubscribe();
  }, []);

  // Close dropdown on outside click / ESC
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const username = profile?.username ?? null;

  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-black/60 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="font-semibold tracking-wider">
          Z3DE.GG
        </Link>

        {/* Right */}
        <div className="flex items-center gap-3 text-sm">
          {loading ? null : user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 hover:bg-white/10"
              >
                {/* Avatar */}
                <div className="h-8 w-8 overflow-hidden rounded-lg bg-white/10">
                  {profile?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.avatar_url}
                      alt="avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>

                <span className="text-white/80">
                  @{username ?? "player"}
                </span>

                <span className="text-white/50">▾</span>
              </button>

              {open && (
                <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-white/10 bg-black/95 shadow-xl">
                  <div className="px-4 py-3">
                    <p className="text-xs text-white/50">Connecté en tant que</p>
                    <p className="mt-1 truncate text-sm font-medium">
                      @{username ?? "player"}
                    </p>
                  </div>

                  <div className="h-px bg-white/10" />

                  <div className="p-2">
                    <Link
                      href={username ? `/u/${username}` : "/account/profil"}
                      onClick={() => setOpen(false)}
                      className="block rounded-xl px-3 py-2 text-white/80 hover:bg-white/10"
                    >
                      Mon profil
                    </Link>

                    <Link
                      href="/account/profil"
                      onClick={() => setOpen(false)}
                      className="block rounded-xl px-3 py-2 text-white/80 hover:bg-white/10"
                    >
                      Paramètres
                    </Link>

                    <button
                      onClick={logout}
                      className="mt-1 block w-full rounded-xl px-3 py-2 text-left text-white/80 hover:bg-white/10"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/auth?mode=login" className="hover:text-white/90">
                Login
              </Link>

              <Link
                href="/auth?mode=register"
                className="rounded bg-white px-3 py-1 text-black hover:bg-white/90"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
