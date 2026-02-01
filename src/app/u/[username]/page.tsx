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
  const decoded = decodeURIComponent(raw ?? "");
  return decoded.trim().replaceAll("/", "");
}

export default async function PublicProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const supabase = publicSupabase;

  const username = normalizeUsername(params.username);
  const usernameLc = username.toLowerCase();

  let data: Profile | null = null;
  let error: any = null;

  // 1) ✅ Requête principale via la vue (case-insensitive garanti)
  {
    const res = await supabase
      .from("profiles_public")
      .select("username, display_name, bio, avatar_url, updated_at")
      .eq("username_lc", usernameLc)
      .maybeSingle();

    data = (res.data as Profile | null) ?? null;
    error = res.error ?? null;
  }

  // 2) ✅ Fallback si la vue n'existe pas OU si ça ne remonte rien
  if (!error && !data) {
    const res = await supabase
      .from("profiles")
      .select("username, display_name, bio, avatar_url, updated_at")
      .ilike("username", username)
      .limit(1)
      .maybeSingle();

    data = (res.data as Profile | null) ?? null;
    error = res.error ?? null;
  }

  if (error) {
    console.error("[public-profile] fetch error:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
      username,
    });

    return (
      <PageShell>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
          Une erreur est survenue lors du chargement du profil.
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
      <ProfileCard profile={data} />
    </PageShell>
  );
}
