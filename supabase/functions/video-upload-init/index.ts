// Creates a Vimeo TUS upload ticket using the admin-configured access token.
// The temporary upload_link is returned to the browser, which streams the file
// directly to Vimeo (the access token never leaves the server).
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const size = Number(body?.size);
    const name = typeof body?.name === "string" ? body.name.slice(0, 200) : "Untitled";
    const description = typeof body?.description === "string" ? body.description.slice(0, 5000) : "";

    if (!Number.isFinite(size) || size <= 0 || size > 5 * 1024 * 1024 * 1024) {
      return json({ error: "Invalid file size" }, 400);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: cfg } = await admin
      .from("storage_provider_config")
      .select("default_provider, vimeo_access_token")
      .eq("id", true)
      .maybeSingle();

    const provider = (cfg?.default_provider as string) ?? "supabase";

    if (provider !== "vimeo") {
      // Fall back to Supabase Storage; client handles it directly.
      return json({ provider: "supabase" });
    }

    const token = cfg?.vimeo_access_token;
    if (!token) return json({ error: "Vimeo not configured" }, 500);

    const vimeoRes = await fetch("https://api.vimeo.com/me/videos", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.vimeo.*+json;version=3.4",
      },
      body: JSON.stringify({
        upload: { approach: "tus", size },
        name,
        description,
        privacy: { view: "anybody", embed: "public" },
      }),
    });

    const payload = await vimeoRes.json();
    if (!vimeoRes.ok) {
      return json({ error: payload?.error ?? "Vimeo upload create failed" }, 502);
    }

    // payload.uri = "/videos/1234567"
    const uri: string = payload.uri;
    const videoId = uri.split("/").pop() ?? uri;
    const uploadLink: string = payload.upload?.upload_link;
    const playbackUrl: string = payload.link ?? `https://vimeo.com/${videoId}`;
    const playerEmbedUrl = `https://player.vimeo.com/video/${videoId}`;

    return json({
      provider: "vimeo",
      uri,
      videoId,
      uploadLink,
      playbackUrl,
      playerEmbedUrl,
    });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
