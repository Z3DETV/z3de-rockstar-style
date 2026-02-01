import ProfileCard from "@/components/ProfileCard";
import { createClient } from "@/lib/supabase/server";
import React from "react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Profile = {
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  updated_at: string | null;
};

type Slot =
  | "wall"
  | "floor"
  | "furniture_1"
  | "decor_1"
  | "decor_2"
  | "effect_1";

const SLOTS: Slot[] = [
  "wall",
  "floor",
  "furniture_1",
  "decor_1",
  "decor_2",
  "effect_1",
];

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
  if (!raw) return "";

  return decodeURIComponent(raw).split("?")[0].trim().replaceAll("/", "");
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username: raw } = await params;
  const username = normalizeUsername(raw);

  if (!username) {
    return (
      <PageShell>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
          Username manquant dans l’URL.
        </div>
      </PageShell>
    );
  }

  const supabase = await createClient();

  /* =========================
     1) Profil public
  ========================== */
  const { data: profile, error: publicError } = await supabase
    .from("profiles_public")
    .select("username, display_name, bio, avatar_url, updated_at")
    .eq("username_lc", username.toLowerCase())
    .maybeSingle();

  if (publicError || !profile) {
    console.error("[public-profile]", publicError);

    return (
      <PageShell>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
          Profil introuvable.
        </div>
      </PageShell>
    );
  }

  /* =========================
     2) Récupérer ID depuis profiles
  ========================== */
  const { data: privateProfile, error: privateError } = await supabase
    .from("profiles")
    .select("id")
    .eq("username_lc", username.toLowerCase())
    .maybeSingle();

  if (privateError || !privateProfile) {
    console.error("[private-profile]", privateError);

    return (
      <PageShell>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
          Impossible de charger la maison.
        </div>
      </PageShell>
    );
  }

  const userId = privateProfile.id;

  /* =========================
     3) Maison équipée
  ========================== */
  const { data: equippedRows, error: homeError } = await supabase
    .from("home_equipped")
    .select(
      `
      slot,
      user_items (
        items (
          name
        )
      )
    `
    )
    .eq("user_id", userId);

  if (homeError) {
    console.error("[public-home]", homeError);
  }

  const equippedMap = new Map<Slot, string>();

  for (const row of (equippedRows ?? []) as any[]) {
    const slot = row?.slot as Slot | undefined;
    const name = row?.user_items?.items?.name as string | undefined;

    if (slot && SLOTS.includes(slot)) {
      equippedMap.set(slot, name ?? "—");
    }
  }

  return (
    <PageShell>
      <div className="space-y-6">
        <ProfileCard profile={profile as Profile} />

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">🏠 Appartement</h2>
            <span className="text-sm text-white/60">@{profile.username}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {SLOTS.map((slot) => (
              <div
                key={slot}
                className="rounded-xl border border-white/10 bg-black/30 p-3"
              >
                <div className="text-xs text-white/60">{slot}</div>
                <div className="mt-1 font-medium">
                  {equippedMap.get(slot) ?? "—"}
                </div>
              </div>
            ))}
          </div>

          {!equippedRows?.length && (
            <div className="mt-4 text-sm text-white/60">
              Aucune décoration équipée.
            </div>
          )}
        </section>
      </div>
    </PageShell>
  );
}
