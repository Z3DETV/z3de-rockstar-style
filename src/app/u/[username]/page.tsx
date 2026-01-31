"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProfileCard from "../../../components/ProfileCard";
import { supabase } from "@/lib/supabaseClient";

type Profile = {
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  updated_at: string | null;
};

export default function PublicProfilePage() {
  const params = useParams<{ username: string }>();
  const router = useRouter();
  const username = decodeURIComponent(params.username);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function run() {
      setLoading(true);

      const { data, error } = await supabase
        .from("profiles")
        .select("username, display_name, bio, avatar_url, updated_at")
        .ilike("username", username)
        .maybeSingle();

      if (!mounted) return;

      if (error || !data) setProfile(null);
      else setProfile(data as Profile);

      setLoading(false);
    }

    run();
    return () => {
      mounted = false;
    };
  }, [username]);

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => {
              // back si possible, sinon home
              if (window.history.length > 1) router.back();
              else router.push("/");
            }}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
          >
            ← Retour
          </button>

          <a
            href="/"
            className="text-sm text-white/60 hover:text-white/80"
          >
            Accueil
          </a>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
            Chargement...
          </div>
        ) : profile ? (
          <ProfileCard profile={profile} />
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
            Profil introuvable.
          </div>
        )}
      </div>
    </main>
  );
}
