import { notFound } from "next/navigation";
import ProfileCard from "@/components/ProfileCard";
import { createClient } from "@/lib/supabase/server"; // adapte si ton chemin diffère

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Profile = {
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  updated_at: string | null;
};

export default async function PublicProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const supabase = await createClient();

  const username = decodeURIComponent(params.username);

  const { data, error } = await supabase
    .from("profiles")
    .select("username, display_name, bio, avatar_url, updated_at")
    .ilike("username", username)
    .maybeSingle();

  if (error) {
    console.error("Public profile fetch error:", error);
    notFound();
  }

  if (!data) notFound();

  const profile = data as Profile;

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <a
            href="/"
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
          >
            ← Accueil
          </a>

          <span className="text-sm text-white/60">Profil public</span>
        </div>

        <ProfileCard profile={profile} />
      </div>
    </main>
  );
}
