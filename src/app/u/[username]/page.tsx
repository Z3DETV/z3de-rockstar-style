import ProfileCard from "@/components/ProfileCard";
import { publicSupabase } from "@/lib/supabase/public";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Profile = {
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  updated_at: string | null;
};

function PageShell({ children }: { children: React.ReactNode }) {
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

        {children}
      </div>
    </main>
  );
}

function normalizeUsername(raw: string) {
  return decodeURIComponent(raw ?? "")
    .trim()
    .replaceAll("/", "")
    .toLowerCase();
}

export default async function PublicProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const supabase = publicSupabase;

  const username = normalizeUsername(params.username);

  const { data, error } = await supabase
    .from("profiles_public")
    .select("username, display_name, bio, avatar_url, updated_at")
    .eq("username_lc", username)
    .maybeSingle();

  if (error) {
    console.error("[public-profile]", error);

    return (
      <PageShell>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
          Erreur lors du chargement du profil.
        </div>
      </PageShell>
    );
  }

  if (!data) {
    return (
      <PageShell>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
          Profil introuvable.
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <ProfileCard profile={data as Profile} />
    </PageShell>
  );
}
