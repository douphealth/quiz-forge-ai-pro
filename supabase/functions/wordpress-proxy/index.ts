import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url) {
      return new Response(JSON.stringify({ error: "URL is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Try WP REST API: extract slug from URL and fetch post
    const urlObj = new URL(url);
    const origin = urlObj.origin;
    const slug = urlObj.pathname.split("/").filter(Boolean).pop() || "";

    // Try fetching by slug from WP REST API
    const apiUrl = `${origin}/wp-json/wp/v2/posts?slug=${slug}&_fields=title,content`;
    const resp = await fetch(apiUrl);

    if (!resp.ok) {
      throw new Error(`WordPress API returned ${resp.status}`);
    }

    const posts = await resp.json();
    if (!posts || posts.length === 0) {
      throw new Error("Post not found");
    }

    const post = posts[0];
    // Strip HTML tags for clean text
    const content = post.content.rendered.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    const title = post.title.rendered.replace(/<[^>]*>/g, "").trim();

    return new Response(JSON.stringify({ title, content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
