"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

function normalizeUsername(input: string) {
  return input.trim();
}

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const usernameHint = useMemo(() => {
    const u = normalizeUsername(username);
    if (!u) return null;
    if (u.length < 3) return "Pseudo trop court (min 3)";
    if (u.length > 20) return "Pseudo trop long (max 20)";
    if (!/^[A-Za-z0-9_]+$/.test(u)) return "Uniquement lettres/chiffres/_";
    return "OK";
  }, [username]);

  async function onRegister(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);

    const u = normalizeUsername(username);

    try {
      // 1) Sign up
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;

      const userId = data.user?.id;
      if (!userId) {
        setMsg("Inscription OK. Vérifie ton email si demandé par Supabase.");
        return;
      }

      // 2) Set username in profiles (unique constraint enforced in DB)
      const { error: upErr } = await supabase
        .from("profiles")
        .update({ username: u })
        .eq("id", userId);

      if (upErr) {
        // If username is taken (unique violation), show a friendly message
        const raw = String(upErr.message || upErr);
        if (raw.includes("duplicate key") || raw.includes("unique")) {
          setMsg("Ce pseudo est déjà pris. Essaie-en un autre.");
        } else {
          setMsg("Compte créé, mais pseudo refusé: " + raw);
        }
        return;
      }

      setMsg("✅ Compte créé ! Tu peux te connecter.");
      setMode("login");
    } catch (err: any) {
      setMsg(err?.message ?? "Erreur inconnue");
    } finally {
      setBusy(false);
    }
  }

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      // Redirect simple
      window.location.href = "/account";
    } catch (err: any) {
      setMsg(err?.message ?? "Erreur inconnue");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">
            {mode === "register" ? "Créer un compte" : "Se connecter"}
          </h1>
          <button
            className="text-sm text-white/70 hover:text-white"
            onClick={() => setMode(mode === "register" ? "login" : "register")}
          >
            {mode === "register" ? "J’ai déjà un compte" : "Créer un compte"}
          </button>
        </div>

        <form className="mt-6 space-y-3" onSubmit={mode === "register" ? onRegister : onLogin}>
          <input
            className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 outline-none"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />

          <input
            className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 outline-none"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete={mode === "register" ? "new-password" : "current-password"}
          />

          {mode === "register" && (
            <>
              <input
                className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 outline-none"
                placeholder="Pseudo (unique)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <p className="text-xs text-white/60">
                Règles : 3–20 caractères, lettres/chiffres/_ uniquement. {usernameHint && `(${usernameHint})`}
              </p>
            </>
          )}

          <button
            disabled={busy}
            className="w-full rounded-xl bg-white text-black py-3 font-medium hover:bg-white/90 disabled:opacity-60"
          >
            {busy ? "..." : mode === "register" ? "Créer" : "Connexion"}
          </button>
        </form>

        {msg && <p className="mt-4 text-sm text-white/80">{msg}</p>}
      </div>
    </main>
  );
}
