import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

async function tryWpRestApi(origin: string, slug: string): Promise<{ title: string; content: string } | null> {
  // Try posts, then pages
  for (const type of ["posts", "pages"]) {
    try {
      const apiUrl = `${origin}/wp-json/wp/v2/${type}?slug=${slug}&_fields=title,content`;
      const resp = await fetch(apiUrl);
      if (!resp.ok) { await resp.text(); continue; }
      const items = await resp.json();
      if (items?.length > 0) {
        return {
          title: stripHtml(items[0].title.rendered),
          content: stripHtml(items[0].content.rendered),
        };
      }
    } catch { /* try next type */ }
  }
  return null;
}

async function fetchAsHtml(url: string): Promise<{ title: string; content: string }> {
  const resp = await fetch(url, {
    headers: { "User-Agent": "QuizForgeAI/2.0 (content fetcher)" },
  });
  if (!resp.ok) throw new Error(`Failed to fetch URL (${resp.status})`);
  const html = await resp.text();

  // Extract title
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? stripHtml(titleMatch[1]) : "Untitled";

  // Try to extract main content from <article> or <main>, fallback to <body>
  let contentHtml = "";
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);

  if (articleMatch) {
    contentHtml = articleMatch[1];
  } else if (mainMatch) {
    contentHtml = mainMatch[1];
  } else if (bodyMatch) {
    contentHtml = bodyMatch[1];
  } else {
    contentHtml = html;
  }

  // Remove script/style tags before stripping
  contentHtml = contentHtml
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "");

  const content = stripHtml(contentHtml);
  if (!content || content.length < 50) {
    throw new Error("Could not extract meaningful content from the page");
  }

  return { title, content };
}

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

    const urlObj = new URL(url);
    const origin = urlObj.origin;
    // Extract the last non-empty path segment as slug
    const pathSegments = urlObj.pathname.split("/").filter(Boolean);
    const slug = pathSegments[pathSegments.length - 1] || "";

    let result: { title: string; content: string } | null = null;

    // Strategy 1: Try WP REST API with slug (posts + pages)
    if (slug) {
      result = await tryWpRestApi(origin, slug);
    }

    // Strategy 2: Try additional slug variants (handle trailing index, numeric suffixes)
    if (!result && pathSegments.length > 1) {
      const altSlug = pathSegments[pathSegments.length - 2];
      if (altSlug && altSlug !== slug) {
        result = await tryWpRestApi(origin, altSlug);
      }
    }

    // Strategy 3: Direct HTML fetch + content extraction (works for any website)
    if (!result) {
      console.log("[wordpress-proxy] WP REST API failed, falling back to HTML extraction");
      result = await fetchAsHtml(url);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[wordpress-proxy] error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
