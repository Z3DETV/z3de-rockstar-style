"use client";

import { useState } from "react";
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

export default function ProfileEditForm({
  profile,
  onUpdated,
}: {
  profile: Profile;
  onUpdated?: () => void;
}) {
  const [username, setUsername] = useState(profile.username);
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function save() {
    setMsg(null);
    setSaving(true);

    const nextUsername = username.trim();

    // règle username
    if (!isValidUsername(nextUsername)) {
      setSaving(false);
      setMsg("Erreur : username invalide (3-20, lettres/chiffres/_)");
      return;
    }

    // règle 30 jours (si changement)
    if (nextUsername !== profile.username) {
      const last = profile.last_username_change_at
        ? new Date(profile.last_username_change_at).getTime()
        : 0;
      const now = Date.now();
      const days30 = 30 * 24 * 60 * 60 * 1000;

      if (last && now - last < days30) {
        setSaving(false);
        setMsg("Erreur : tu peux changer de pseudo seulement tous les 30 jours.");
        return;
      }

      // check unicité (case-insensitive)
      const { data: exists } = await supabase
        .from("profiles")
        .select("id")
        .ilike("username", nextUsername)
        .maybeSingle();

      if (exists && exists.id !== profile.id) {
        setSaving(false);
        setMsg("Erreur : ce pseudo est déjà pris.");
        return;
      }
    }

    const payload: any = {
      username: nextUsername,
      display_name: displayName.trim() || null,
      bio: bio.trim() || null,
    };

    if (nextUsername !== profile.username) {
      payload.last_username_change_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", profile.id);

    setSaving(false);

    if (error) {
      setMsg(`Erreur : ${error.message}`);
      return;
    }

    setMsg("Profil mis à jour ✅");
    onUpdated?.();
  }

  async function uploadAvatar(file: File) {
    setMsg(null);
    setUploading(true);

    const allowed = ["image/jpeg", "image/png", "image/webp"];

    if (!allowed.includes(file.type)) {
      setUploading(false);
      setMsg("Format interdit (JPG / PNG / WEBP uniquement).");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setUploading(false);
      setMsg("Image trop lourde (max 2MB).");
      return;
    }

    try {
      const ext =
        file.type === "image/png"
          ? "png"
          : file.type === "image/webp"
          ? "webp"
          : "jpg";

      const path = `${profile.id}/avatar.${ext}`;

      // Upload Supabase Storage
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (upErr) throw upErr;

      // URL publique
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);

      // Update DB
      const { error: dbErr } = await supabase
        .from("profiles")
        .update({ avatar_url: data.publicUrl })
        .eq("id", profile.id);

      if (dbErr) throw dbErr;

      setMsg("Avatar mis à jour ✅");
      onUpdated?.();
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
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt="avatar"
              className="h-full w-full object-cover"
            />
          ) : null}
        </div>

        <div>
          <label className="cursor-pointer rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 inline-block">
            {uploading ? "Upload..." : "Changer l’avatar"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadAvatar(f);
              }}
              disabled={uploading}
            />
          </label>

          <p className="mt-2 text-xs text-white/50">
            (MVP) Pas de modération auto pour l’instant.
          </p>
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
