// Bulk generate featured images for all blog_posts where featured_image is null.
// Uses Pollinations.AI (free, no key) as primary. Stores external URL only.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function slugSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function buildPollinationsUrl(title: string): string {
  const safeTitle = title.replace(/["'\\]/g, "").slice(0, 120);
  const prompt = `Premium print-on-demand t-shirt mockup, folded cotton tee on clean minimal studio background, soft lighting, high detail, the phrase "${safeTitle}" printed on the shirt in bold modern typography, product photography, 4k, ecommerce quality`;
  const seed = slugSeed(title);
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1200&height=630&nologo=true&enhance=true&model=flux&seed=${seed}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const body = await req.json().catch(() => ({}));
    const limit = Math.min(Number(body.limit ?? 50), 200);
    const dryRun = Boolean(body.dryRun);

    const { data: posts, error } = await supabase
      .from("blog_posts")
      .select("id, title, slug")
      .is("featured_image", null)
      .eq("status", "published")
      .limit(limit);

    if (error) throw error;
    if (!posts || posts.length === 0) {
      return new Response(JSON.stringify({ ok: true, updated: 0, message: "No posts need images" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let updated = 0;
    const failures: string[] = [];
    for (const p of posts) {
      const imageUrl = buildPollinationsUrl(p.title);
      if (dryRun) { updated++; continue; }
      const { error: upErr } = await supabase.from("blog_posts").update({ featured_image: imageUrl }).eq("id", p.id);
      if (upErr) failures.push(`${p.slug}: ${upErr.message}`);
      else updated++;
    }

    return new Response(JSON.stringify({ ok: true, updated, total: posts.length, failures }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: (error as Error).message }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
