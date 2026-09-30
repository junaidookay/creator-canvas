// Manages storage provider config. GET returns masked values; POST saves.
// Only admins may call. Uses service role internally; never returns raw secrets.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;

const mask = (v: string | null | undefined) => {
  if (!v) return null;
  const s = String(v);
  if (s.length <= 4) return "•".repeat(s.length);
  return `••••••••${s.slice(-4)}`;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) return json({ error: "Forbidden" }, 403);

    if (req.method === "GET") {
      const { data } = await admin
        .from("storage_provider_config")
        .select("*")
        .eq("id", true)
        .maybeSingle();

      return json({
        default_provider: (data?.default_provider as string) ?? "supabase",
        vimeo_access_token_mask: mask(data?.vimeo_access_token),
        vimeo_configured: !!data?.vimeo_access_token,
        bunny_api_key_mask: mask(data?.bunny_api_key),
        bunny_library_id: data?.bunny_library_id ?? null,
        bunny_cdn_hostname: data?.bunny_cdn_hostname ?? null,
        bunny_configured:
          !!data?.bunny_api_key && !!data?.bunny_library_id && !!data?.bunny_cdn_hostname,
        updated_at: data?.updated_at ?? null,
      });
    }

    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const {
        default_provider,
        vimeo_access_token,
        bunny_api_key,
        bunny_library_id,
        bunny_cdn_hostname,
      } = body ?? {};

      if (!["supabase", "vimeo", "bunny"].includes(default_provider))
        return json({ error: "Invalid default_provider" }, 400);

      // Load existing to preserve secrets when field is omitted / left blank.
      const { data: existing } = await admin
        .from("storage_provider_config")
        .select("*")
        .eq("id", true)
        .maybeSingle();

      const nextVimeo =
        typeof vimeo_access_token === "string" && vimeo_access_token.trim().length > 0
          ? vimeo_access_token.trim()
          : existing?.vimeo_access_token ?? null;

      const nextBunnyKey =
        typeof bunny_api_key === "string" && bunny_api_key.trim().length > 0
          ? bunny_api_key.trim()
          : existing?.bunny_api_key ?? null;

      // Non-secret fields: allow explicit empty string to clear.
      const nextBunnyLib =
        typeof bunny_library_id === "string"
          ? bunny_library_id.trim() || null
          : existing?.bunny_library_id ?? null;
      const nextBunnyCdn =
        typeof bunny_cdn_hostname === "string"
          ? bunny_cdn_hostname.trim() || null
          : existing?.bunny_cdn_hostname ?? null;

      if (default_provider === "vimeo" && !nextVimeo)
        return json({ error: "Vimeo token required to set Vimeo as default" }, 400);
      if (default_provider === "bunny" && (!nextBunnyKey || !nextBunnyLib || !nextBunnyCdn))
        return json({ error: "Bunny credentials incomplete" }, 400);

      // Validate Vimeo token if provided/changed.
      if (nextVimeo && nextVimeo !== existing?.vimeo_access_token) {
        const check = await fetch("https://api.vimeo.com/me", {
          headers: {
            Authorization: `Bearer ${nextVimeo}`,
            Accept: "application/vnd.vimeo.*+json;version=3.4",
          },
        });
        const t = await check.text();
        if (!check.ok) return json({ error: `Vimeo token invalid: ${check.status}` }, 400);
        void t;
      }

      const { error: upErr } = await admin.from("storage_provider_config").upsert({
        id: true,
        default_provider,
        vimeo_access_token: nextVimeo,
        bunny_api_key: nextBunnyKey,
        bunny_library_id: nextBunnyLib,
        bunny_cdn_hostname: nextBunnyCdn,
        updated_by: userData.user.id,
      });
      if (upErr) return json({ error: upErr.message }, 500);

      return json({ ok: true });
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
