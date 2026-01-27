"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

function fmtDate(d: string | null) {
  if (!d) return "—";
  const dt = new Date(d);
  return dt.toLocaleDateString("fr-FR", { year: "numeric", month: "2-digit", day: "2-digit" });
}

export default function AccountPage() {
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [username, setUsername] = useState<string>("");
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [lastChangeAt, setLastChangeAt] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const nextChangeAt = useMemo(() => {
    if (!lastChangeAt) return null;
    const dt = new Date(lastChangeAt);
    dt.setDate(dt.getDate() + 30);
    return dt.toISOString();
  }, [lastChangeAt]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const u = data.user;
      if (!u) {
        window.location.href = "/auth";
        return;
      }
      setUserEmail(u.email ?? null);

      const { data: prof, error } = await supabase
        .from("profiles")
        .select("username,last_username_change_at")
        .eq("id", u.id)
        .single();

      if (!error && prof) {
        setCurrentUsername(prof.username ?? null);
        setUsername(prof.username ?? "");
        setLastChangeAt(prof.last_username_change_at ?? null);
      }

      setLoading(false);
    })();
  }, []);

  async function saveUsername() {
    setMsg(null);
    setBusy(true);

    const newU = username.trim();

    try {
      const { data } = await supabase.auth.getUser();
      const u = data.user;
      if (!u) throw new Error("Non connecté.");

      const { error } = await supabase
        .from("profiles")
        .update({ username: newU })
        .eq("id", u.id);

      if (error) {
        const raw = String(error.message || error);

        if (raw.includes("duplicate key") || raw.includes("unique")) {
          throw new Error("Ce pseudo est déjà pris.");
        }

        // When 30-day policy blocks, Supabase often returns "permission denied" or RLS related message
        if (raw.toLowerCase().includes("row-level security") || raw.toLowerCase().includes("permission")) {
          throw new Error("Tu peux changer ton pseudo seulement tous les 30 jours.");
        }

        throw new Error(raw);
      }

      // Re-fetch to update timestamps
      const { data: prof } = await supabase
        .from("profiles")
        .select("username,last_username_change_at")
        .eq("id", u.id)
        .single();

      setCurrentUsername(prof?.username ?? null);
      setLastChangeAt(prof?.last_username_change_at ?? null);

      setMsg("✅ Pseudo mis à jour.");
    } catch (e: any) {
      setMsg(e?.message ?? "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (loading) {
    return <main className="min-h-screen bg-black text-white p-8">Chargement…</main>;
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-10">
      <div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">Mon compte</h1>
            <p className="text-sm text-white/70">{userEmail}</p>
          </div>
          <button className="text-sm text-white/70 hover:text-white" onClick={logout}>
            Déconnexion
          </button>
        </div>

        <div className="mt-6 space-y-2">
          <p className="text-sm text-white/70">
            Pseudo actuel : <span className="text-white">{currentUsername ?? "—"}</span>
          </p>
          <p className="text-sm text-white/70">
            Dernier changement : <span className="text-white">{fmtDate(lastChangeAt)}</span>
          </p>
          <p className="text-sm text-white/70">
            Prochain changement possible :{" "}
            <span className="text-white">{nextChangeAt ? fmtDate(nextChangeAt) : "—"}</span>
          </p>
        </div>

        <div className="mt-6 space-y-3">
          <label className="text-sm text-white/70">Changer de pseudo</label>
          <input
            className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 outline-none"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <p className="text-xs text-white/60">3–20 caractères, lettres/chiffres/_.</p>

          <button
            disabled={busy}
            onClick={saveUsername}
            className="w-full rounded-xl bg-white text-black py-3 font-medium hover:bg-white/90 disabled:opacity-60"
          >
            {busy ? "..." : "Enregistrer"}
          </button>

          {msg && <p className="text-sm text-white/80">{msg}</p>}
        </div>
      </div>
    </main>
  );
}
