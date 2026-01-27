"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

function normalizeUsername(input: string) {
  return input.trim();
}

function isValidUsername(u: string) {
  return u.length >= 3 && u.length <= 20 && /^[A-Za-z0-9_]+$/.test(u);
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

    const u = normalizeUsername(username);

    if (!u) {
      setMsg("Choisis un pseudo.");
      return;
    }
    if (!isValidUsername(u)) {
      setMsg("Pseudo invalide. 3–20 caractères, lettres/chiffres/_ uniquement.");
      return;
    }

    setBusy(true);

    try {
      // Backup local (utile si jamais metadata ne passe pas dans un contexte bizarre)
      localStorage.setItem("pending_username", u);

      const origin = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
          data: {
            // ✅ le pseudo voyage avec la confirmation email
            pending_username: u,
          },
        },
      });

      if (error) throw error;

      setMsg(
        "✅ Compte créé ! Va confirmer ton email. Après validation, tu seras renvoyé automatiquement sur le site."
      );
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

      // Après login, on revient sur l'accueil
      window.location.href = "/";
    } catch (err: any) {
      setMsg(err?.message ?? "Erreur inconnue");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">
              {mode === "register" ? "Créer un compte" : "Se connecter"}
            </h1>
            <a
              href="/"
              className="mt-2 inline-block text-sm text-white/70 hover:text-white"
            >
              ← Retour à l’accueil
            </a>
          </div>

          <button
            className="text-sm text-white/70 hover:text-white"
            onClick={() => setMode(mode === "register" ? "login" : "register")}
          >
            {mode === "register" ? "J’ai déjà un compte" : "Créer un compte"}
          </button>
        </div>

        <form
          className="mt-6 space-y-3"
          onSubmit={mode === "register" ? onRegister : onLogin}
        >
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
                Règles : 3–20 caractères, lettres/chiffres/_ uniquement.{" "}
                {usernameHint && `(${usernameHint})`}
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
