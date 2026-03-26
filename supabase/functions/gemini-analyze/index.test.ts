import "https://deno.land/std@0.224.0/dotenv/load.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

Deno.test("gemini-analyze returns 400 when content is missing", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/gemini-analyze`, {
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
    throw new Error("Expected error field in response");
  }
});

Deno.test("gemini-analyze handles OPTIONS for CORS", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/gemini-analyze`, {
    method: "OPTIONS",
    headers: {
      "Origin": "https://example.com",
      "Access-Control-Request-Method": "POST",
    },
  });
  await response.text();
  if (response.status !== 200) {
    throw new Error(`Expected 200 for OPTIONS, got ${response.status}`);
  }
});
