"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Profile = {
  username: string | null;
};

export default function Navbar() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);

      if (data.user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", data.user.id)
          .single();

        setProfile(profileData);
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
        <div className="flex items-center gap-4 text-sm">
          {loading ? null : user ? (
            <>
              {/* Mon profil public */}
              {username ? (
                <Link href={`/u/${username}`} className="text-white/80 hover:text-white">
                  @{username}
                </Link>
              ) : (
                <Link href="/account/profil" className="text-white/80 hover:text-white">
                  @player
                </Link>
              )}

              {/* Paramètres profil */}
              <Link href="/account/profil" className="text-white/70 hover:text-white">
                Paramètres
              </Link>

              <button
                onClick={logout}
                className="rounded border border-white/20 px-3 py-1 hover:bg-white/10"
              >
                Logout
              </button>
            </>
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
