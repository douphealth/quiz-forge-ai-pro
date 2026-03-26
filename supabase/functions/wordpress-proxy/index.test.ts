import "https://deno.land/std@0.224.0/dotenv/load.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

Deno.test("wordpress-proxy returns 400 when URL is missing", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/wordpress-proxy`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({}),
  });
  const data = await response.json();
  if (response.status !== 400) {
    throw new Error(`Expected 400, got ${response.status}: ${JSON.stringify(data)}`);
  }
  if (!data.error) {
    throw new Error("Expected error field");
  }
});

Deno.test("wordpress-proxy fetches content from a real WordPress site", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/wordpress-proxy`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ url: "https://wordpress.org/news/2024/04/wordpress-6-5/" }),
  });
  const data = await response.json();
  if (response.status !== 200) {
    throw new Error(`Expected 200, got ${response.status}: ${JSON.stringify(data)}`);
  }
  if (!data.title || !data.content) {
    throw new Error("Expected title and content in response");
  }
  if (data.content.length < 50) {
    throw new Error("Content seems too short");
  }
});
