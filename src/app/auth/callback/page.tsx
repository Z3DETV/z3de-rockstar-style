"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallback() {
  useEffect(() => {
    (async () => {
      try {
        // 1) Exchange le code URL -> session
        const code = new URLSearchParams(window.location.search).get("code");
        if (code) {
          await supabase.auth.exchangeCodeForSession(code);
        }

        // 2) Récupère l'utilisateur (session maintenant dispo)
        const { data: userRes } = await supabase.auth.getUser();
        const user = userRes.user;

        // 3) Pending username vient d'abord de user_metadata (fiable),
        // sinon fallback localStorage
        const metaPending = (user?.user_metadata as any)?.pending_username as
          | string
          | undefined;

        const localPending = localStorage.getItem("pending_username") ?? undefined;

        const pending = (metaPending || localPending)?.trim();

        if (user?.id && pending) {
          // 4) Ne set le username que s'il est vide (évite conflits / replays)
          const { data: prof } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", user.id)
            .single();

          if (!prof?.username) {
            const { error } = await supabase
              .from("profiles")
              .update({ username: pending })
              .eq("id", user.id);

            // si OK, on nettoie le localStorage
            if (!error) {
              localStorage.removeItem("pending_username");
            }
          } else {
            // profil déjà ok -> on nettoie le backup
            localStorage.removeItem("pending_username");
          }
        }
      } finally {
        // 5) Retour accueil quoi qu'il arrive
        window.location.href = "/";
      }
    })();
  }, []);

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <p className="text-white/70">Validation en cours…</p>
    </main>
  );
}
