import ProfileCard from "@/components/ProfileCard";
import { createClient } from "@/lib/supabase/server";

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

  const username = decodeURIComponent(params.username).trim();

  // ✅ Requête robuste (insensible à la casse + 1 ligne)
  const { data, error } = await supabase
    .from("profiles")
    .select("username, display_name, bio, avatar_url, updated_at")
    .ilike("username", username)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[public-profile] fetch error:", error);
    return (
      <main className="min-h-screen px-6 py-10">
        <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
          Une erreur est survenue lors du chargement du profil.
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen px-6 py-10">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 flex items-center justify-between">
            <a
              href="/"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
            >
              ← Accueil
            </a>
            <span className="text-sm text-white/60">Profil public</span>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
            Profil introuvable.
          </div>
        </div>
      </main>
    );
  }

  const profile = data as Profile;

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-3xl">
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
