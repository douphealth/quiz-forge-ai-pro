import "https://deno.land/std@0.224.0/dotenv/load.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

Deno.test("save-quiz returns 401 when no auth provided and no created_by/org_id", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/save-quiz`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      title: "Test Quiz",
      questions: [{ question_text: "Q1?", options: ["A", "B"], correct_answer: "0" }],
    }),
  });
  const data = await response.json();
  await response.text().catch(() => {});
  // Should be 401 since no user is authenticated and no created_by/org_id
  if (response.status !== 401) {
    throw new Error(`Expected 401, got ${response.status}: ${JSON.stringify(data)}`);
  }
});

Deno.test("save-quiz returns 400 when title/questions missing", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/save-quiz`, {
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
});
