import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // server only
);

function json(status: number, body: any) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function cat(c: Record<string, any> | undefined, key: string) {
  return Boolean(c && c[key]);
}

export async function POST(req: Request) {
  try {
    // ✅ 1) Auth: récupère le token supabase
    const auth = req.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

    if (!token) return json(401, { ok: false, error: "Missing Authorization token" });

    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userData?.user) {
      return json(401, { ok: false, error: "Invalid session" });
    }
    const userId = userData.user.id;

    // ✅ 2) File
    const form = await req.formData();
    const file = form.get("file") as File | null;

    if (!file) return json(400, { ok: false, error: "Missing file" });

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      return json(400, { ok: false, error: "Format interdit (jpg, png, webp)." });
    }
    if (file.size > 2 * 1024 * 1024) {
      return json(400, { ok: false, error: "Image trop lourde (max 2MB)." });
    }

    // ✅ 3) Convert to data URL (pour modération image)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    // ✅ 4) Modération OpenAI (image)
    const moderation = await openai.moderations.create({
      model: "omni-moderation-latest",
      input: [
        {
          type: "image_url",
          image_url: { url: dataUrl },
        },
      ],
    });

    const result = moderation.results?.[0];
    if (!result) return json(500, { ok: false, error: "Moderation failed" });

    // ⚠️ Les catégories ont des clés du style "sexual/minors"
    const categories = (result as any).categories as Record<string, any> | undefined;

    // ✅ 5) Politique de refus (strict)
    const hardReject =
      Boolean(result.flagged) ||
      cat(categories, "sexual") ||
      cat(categories, "sexual/minors") ||
      cat(categories, "hate") ||
      cat(categories, "hate/threatening") ||
      cat(categories, "harassment") ||
      cat(categories, "harassment/threatening") ||
      cat(categories, "violence") ||
      cat(categories, "violence/graphic") ||
      cat(categories, "self-harm") ||
      cat(categories, "self-harm/intent") ||
      cat(categories, "self-harm/instructions");

    if (hardReject) {
      // (option) log
      try {
        await supabaseAdmin.from("avatar_moderation_logs").insert({
          user_id: userId,
          verdict: "rejected",
          categories,
        });
      } catch {}

      return json(403, {
        ok: false,
        error: "Avatar refusé (contenu inapproprié).",
      });
    }

    // ✅ 6) Upload Storage (serveur)
    const ext =
      file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${userId}/avatar.${ext}`;

    const { error: upErr } = await supabaseAdmin.storage
      .from("avatars")
      .upload(path, buffer, { upsert: true, contentType: file.type });

    if (upErr) return json(500, { ok: false, error: upErr.message });

    const { data: pub } = supabaseAdmin.storage.from("avatars").getPublicUrl(path);

    const { error: dbErr } = await supabaseAdmin
      .from("profiles")
      .update({ avatar_url: pub.publicUrl })
      .eq("id", userId);

    if (dbErr) return json(500, { ok: false, error: dbErr.message });

    // (option) log OK
    try {
      await supabaseAdmin.from("avatar_moderation_logs").insert({
        user_id: userId,
        verdict: "approved",
        categories,
      });
    } catch {}

    return json(200, { ok: true, url: pub.publicUrl });
  } catch (e: any) {
    return json(500, { ok: false, error: e?.message ?? "Server error" });
  }
}
