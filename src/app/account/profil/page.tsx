"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProfileEditForm from "../../../components/ProfileEditForm";
import { supabase } from "@/lib/supabaseClient";

type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  last_username_change_at: string | null;
};

export default function ProfileSettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);

      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (!user) {
        router.push("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, bio, avatar_url, last_username_change_at")
        .eq("id", user.id)
        .single();

      if (!mounted) return;

      if (error) {
        setProfile(null);
      } else {
        setProfile(data as Profile);
      }

      setLoading(false);
    }

    load();
    return () => {
      mounted = false;
    };
  }, [router]);

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold">Mon profil</h1>
        <p className="mt-1 text-white/60">Modifie ton pseudo, ta bio et ton avatar.</p>

        <div className="mt-6">
          {loading ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
              Chargement...
            </div>
          ) : profile ? (
            <ProfileEditForm profile={profile} onUpdated={() => router.refresh()} />
          ) : (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-200">
              Impossible de charger ton profil.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
