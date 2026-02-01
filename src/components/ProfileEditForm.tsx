"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  last_username_change_at: string | null;
};

function isValidUsername(u: string) {
  return /^[a-zA-Z0-9_]{3,20}$/.test(u);
}

function withCacheBuster(url: string, bust: number) {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}v=${bust}`;
}

export default function ProfileEditForm({
  profile,
  onUpdated,
}: {
  profile: Profile;
  onUpdated?: () => void;
}) {
  const router = useRouter();

  const [username, setUsername] = useState(profile.username);
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [msg, setMsg] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // évite Date.now() à chaque render (sinon l'image reload en boucle)
  const [avatarBust, setAvatarBust] = useState<number>(() => Date.now());

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Avatar affiché avec anti-cache contrôlé
  const avatarSrc = useMemo(() => {
    if (!profile.avatar_url) return null;
    return withCacheBuster(profile.avatar_url, avatarBust);
  }, [profile.avatar_url, avatarBust]);

  // Resync quand le parent renvoie un profile mis à jour
  useEffect(() => {
    setUsername(profile.username);
    setDisplayName(profile.display_name ?? "");
    setBio(profile.bio ?? "");
    // si l'avatar url change, on bust une fois
    setAvatarBust(Date.now());
  }, [profile.id, profile.username, profile.display_name, profile.bio, profile.avatar_url]);

  async function save() {
    setMsg(null);
    setSaving(true);

    try {
      const nextUsername = username.trim();

      if (!isValidUsername(nextUsername)) {
        throw new Error("Erreur : username invalide (3-20, lettres/chiffres/_)");
      }

      // règle 30 jours (si changement)
      if (nextUsername !== profile.username) {
        const last = profile.last_username_change_at
          ? new Date(profile.last_username_change_at).getTime()
          : 0;

        const now = Date.now();
        const days30 = 30 * 24 * 60 * 60 * 1000;

        if (last && now - last < days30) {
          throw new Error("Erreur : tu peux changer de pseudo seulement tous les 30 jours.");
        }

        // check unicité (case-insensitive)
        const { data: exists, error: existsErr } = await supabase
          .from("profiles")
          .select("id")
          .ilike("username", nextUsername)
          .maybeSingle();

        if (existsErr) throw existsErr;

        if (exists && exists.id !== profile.id) {
          throw new Error("Erreur : ce pseudo est déjà pris.");
        }
      }

      const payload: {
        username: string;
        display_name: string | null;
        bio: string | null;
        last_username_change_at?: string;
      } = {
        username: nextUsername,
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
      };

      if (nextUsername !== profile.username) {
        payload.last_username_change_at = new Date().toISOString();
      }

      const { error } = await supabase.from("profiles").update(payload).eq("id", profile.id);
      if (error) throw error;

      setMsg("Profil mis à jour ✅");
      onUpdated?.();

      // CRUCIAL: force le refresh des pages server-side qui lisent profiles
      router.refresh();
    } catch (e: any) {
      setMsg(e?.message ?? "Erreur sauvegarde.");
    } finally {
      setSaving(false);
    }
  }

  async function uploadAvatar(file: File) {
    setMsg(null);
    setUploading(true);

    const allowed = ["image/jpeg", "image/png", "image/webp"];

    try {
      if (!allowed.includes(file.type)) {
        throw new Error("Format interdit (JPG / PNG / WEBP uniquement).");
      }
      if (file.size > 2 * 1024 * 1024) {
        throw new Error("Image trop lourde (max 2MB).");
      }

      const ext =
        file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";

      // IMPORTANT: garder 1 seul fichier par user (upsert)
      const path = `${profile.id}/avatar.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (upErr) {
        const m = String(upErr.message || "").toLowerCase();
        if (m.includes("bucket")) {
          throw new Error(
            "Bucket 'avatars' introuvable. Supabase > Storage > crée un bucket nommé exactement 'avatars'."
          );
        }
        if (m.includes("row-level security") || m.includes("rls") || m.includes("permission")) {
          throw new Error(
            "Permissions Storage insuffisantes (RLS). Ajoute une policy permettant l’upload dans 'avatars' pour les users authentifiés."
          );
        }
        throw upErr;
      }

      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = pub.publicUrl;

      // On peut aussi sauver l'url avec un bust pour éviter cache CDN
      const bustedUrl = withCacheBuster(publicUrl, Date.now());

      const { error: dbErr } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", profile.id);

      if (dbErr) throw dbErr;

      // reset input (pour re-sélectionner même fichier)
      if (fileInputRef.current) fileInputRef.current.value = "";

      // met à jour l'affichage local immédiatement
      setAvatarBust(Date.now());

      setMsg("Avatar mis à jour ✅");
      onUpdated?.();

      // CRUCIAL: force le refresh (home / navbar / profil public, etc.)
      router.refresh();
    } catch (e: any) {
      setMsg(e?.message ?? "Erreur upload.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 overflow-hidden rounded-2xl bg-white/10">
          {avatarSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarSrc} alt="avatar" className="h-full w-full object-cover" />
          ) : null}
        </div>

        <div>
          <label className="inline-block cursor-pointer rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10">
            {uploading ? "Upload..." : "Changer l’avatar"}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadAvatar(f);
              }}
              disabled={uploading}
            />
          </label>

          <p className="mt-2 text-xs text-white/50">(MVP) Pas de modération auto pour l’instant.</p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <label className="text-sm text-white/70">Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 outline-none focus:border-white/25"
          />
          <p className="mt-1 text-xs text-white/50">3–20 caractères, lettres/chiffres/_</p>
        </div>

        <div>
          <label className="text-sm text-white/70">Nom affiché</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 outline-none focus:border-white/25"
          />
        </div>

        <div>
          <label className="text-sm text-white/70">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 outline-none focus:border-white/25"
          />
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black disabled:opacity-60"
        >
          {saving ? "Enregistrement..." : "Enregistrer"}
        </button>

        {msg ? <p className="text-sm text-white/70">{msg}</p> : null}

        <div className="pt-2 text-sm text-white/60">
          Profil public :{" "}
          <a className="underline" href={`/u/${username.trim()}`}>
            /u/{username.trim()}
          </a>
        </div>
      </div>
    </div>
  );
}
