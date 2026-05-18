import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date().toISOString();
    console.log(`Checking for scheduled posts at ${now}`);

    // Find all posts that are scheduled and their publish time has passed
    const { data: postsToPublish, error: fetchError } = await supabase
      .from("blog_posts")
      .select("id, title, scheduled_publish_at")
      .eq("status", "scheduled")
      .lte("scheduled_publish_at", now);

    if (fetchError) {
      console.error("Error fetching scheduled posts:", fetchError);
      return new Response(
        JSON.stringify({ success: false, error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${postsToPublish?.length || 0} posts to publish`);

    if (!postsToPublish || postsToPublish.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No scheduled posts to publish",
          published: 0 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update all scheduled posts to published
    const postIds = postsToPublish.map(p => p.id);
    const { data: updatedPosts, error: updateError } = await supabase
      .from("blog_posts")
      .update({ 
        status: "published", 
        published_at: now,
        updated_at: now
      })
      .in("id", postIds)
      .select("id, title");

    if (updateError) {
      console.error("Error publishing posts:", updateError);
      return new Response(
        JSON.stringify({ success: false, error: updateError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Successfully published ${updatedPosts?.length || 0} posts`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Published ${updatedPosts?.length || 0} scheduled posts`,
        published: updatedPosts?.length || 0,
        posts: updatedPosts?.map(p => ({ id: p.id, title: p.title }))
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
