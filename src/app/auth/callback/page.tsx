"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallback() {
  useEffect(() => {
    (async () => {
      // échange le code URL contre une session
      const code = new URLSearchParams(window.location.search).get("code");
      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }

      // applique le pseudo stocké pendant l'inscription
      const pending = localStorage.getItem("pending_username");
      if (pending) {
        const { data } = await supabase.auth.getUser();
        const userId = data.user?.id;

        if (userId) {
          const { error } = await supabase
            .from("profiles")
            .update({ username: pending })
            .eq("id", userId);

          // si OK, on nettoie
          if (!error) localStorage.removeItem("pending_username");
        }
      }

      // retour accueil
      window.location.href = "/";
    })();
  }, []);

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <p className="text-white/70">Validation en cours…</p>
    </main>
  );
}
