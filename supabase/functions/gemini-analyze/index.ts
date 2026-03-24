import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_ALLOWED_MODELS = new Set([
  "google/gemini-2.5-pro",
  "google/gemini-2.5-flash",
  "google/gemini-2.5-flash-lite",
  "google/gemini-2.5-flash-image",
  "google/gemini-3-flash-preview",
  "google/gemini-3-pro-image-preview",
  "google/gemini-3.1-pro-preview",
  "google/gemini-3.1-flash-image-preview",
  "openai/gpt-5",
  "openai/gpt-5-mini",
  "openai/gpt-5-nano",
  "openai/gpt-5.2",
]);

function resolveProviderAndModel(
  requestedProvider: string | undefined,
  requestedModel: string | undefined,
  userApiKey: string | undefined,
): { provider: "lovable" | "openrouter"; model: string; warning: string | null } {
  const model = typeof requestedModel === "string" ? requestedModel.trim() : "";

  if (requestedProvider === "openrouter") {
    return { provider: "openrouter", model: model || "anthropic/claude-sonnet-4", warning: null };
  }

  if (model && LOVABLE_ALLOWED_MODELS.has(model)) {
    return { provider: "lovable", model, warning: null };
  }

  if (model && !LOVABLE_ALLOWED_MODELS.has(model)) {
    const orKey = userApiKey || Deno.env.get("OPENROUTER_API_KEY");
    if (orKey) {
      return { provider: "openrouter", model, warning: `Model "${model}" routed to OpenRouter.` };
    }
    return { provider: "lovable", model: "google/gemini-3-flash-preview", warning: `No OpenRouter key — using Gemini 3 Flash.` };
  }

  return { provider: "lovable", model: "google/gemini-3-flash-preview", warning: null };
}

function getProviderConfig(provider: "lovable" | "openrouter", userApiKey?: string) {
  if (provider === "openrouter") {
    const key = userApiKey || Deno.env.get("OPENROUTER_API_KEY");
    if (!key) throw new Error("No OpenRouter API key. Enter your key in the Configure step.");
    return {
      url: "https://openrouter.ai/api/v1/chat/completions",
      apiKey: key,
      headers: { "HTTP-Referer": "https://quizforge-ai.lovable.app", "X-Title": "QuizForge AI" },
    };
  }

  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("LOVABLE_API_KEY is not configured.");
  return { url: "https://ai.gateway.lovable.dev/v1/chat/completions", apiKey: key, headers: {} };
}

function buildPrompt(title: string, content: string, count: number, diff: string, types: string, lang: string, topics: string): string {
  return `You are an elite educational content designer and assessment specialist. Your quizzes are used by Fortune 500 companies, top universities, and leading e-learning platforms worldwide.

TASK: Create a premium, enterprise-grade quiz from the article titled "${title}".

QUIZ SPECIFICATIONS:
- Total questions: exactly ${count}
- Difficulty: ${diff}
- Question types: ${types}
- Language: ${lang}
${topics}

QUALITY STANDARDS (MANDATORY):
1. QUESTION DESIGN:
   - Each question must test genuine understanding, NOT surface-level recall
   - Use Bloom's Taxonomy: mix Remember, Understand, Apply, Analyze levels
   - Questions should be scenario-based where possible ("Given that X, what would happen if...")
   - Avoid trivial "What is..." questions — reframe as applied knowledge
   - Each question must have a clear, unambiguous single correct answer

2. ANSWER OPTIONS:
   - All distractors (wrong answers) must be PLAUSIBLE — they should represent common misconceptions
   - Options should be similar in length and style
   - Avoid "All of the above" / "None of the above"
   - Randomize correct answer position (don't always put it first)

3. EXPLANATIONS (CRITICAL):
   - Every question MUST have a rich, educational explanation (3-5 sentences minimum)
   - Explain WHY the correct answer is right
   - Explain WHY at least one distractor is wrong and what misconception it represents
   - Include a relevant insight or "Did you know?" fact when possible
   - Reference the source material when relevant

4. METADATA:
   - Assign accurate difficulty per question: "easy", "medium", or "hard"
   - Assign points: easy=1, medium=2, hard=3
   - Assign a Bloom's taxonomy level: "remember", "understand", "apply", "analyze"

Return ONLY valid JSON in this exact format:
{
  "title": "Quiz: ${title}",
  "description": "A compelling 2-sentence description of what this quiz covers and tests",
  "questions": [
    {
      "question_text": "A well-crafted question that tests understanding",
      "question_type": "multiple_choice",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "2",
      "explanation": "Detailed educational explanation with reasoning...",
      "difficulty": "medium",
      "points": 2,
      "bloom_level": "apply"
    }
  ]
}

RULES:
- correct_answer = 0-based index as a string
- For true_false: options = ["True", "False"], correct_answer = "0" or "1"
- Vary difficulty across questions (don't make them all the same)
- Order questions from easier to harder for good pedagogical flow
- Make the quiz ENGAGING — learners should feel challenged but not overwhelmed

ARTICLE CONTENT:
${content.slice(0, 15000)}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      content, title, model, provider, openrouter_api_key,
      numQuestions, difficulty, questionTypes, language, focusTopics,
    } = await req.json();

    if (!content) {
      return new Response(JSON.stringify({ error: "Content is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userKey = typeof openrouter_api_key === "string" ? openrouter_api_key.trim() : undefined;
    const resolved = resolveProviderAndModel(provider, model, userKey);

    const count = numQuestions || 10;
    const diff = difficulty || "mixed";
    const lang = language || "English";
    const types = questionTypes?.length ? questionTypes.join(", ") : "multiple_choice";
    const topics = focusTopics?.length ? `Focus on these topics: ${focusTopics.join(", ")}.` : "";

    const prompt = buildPrompt(title || "Untitled", content, count, diff, types, lang, topics);
    const config = getProviderConfig(resolved.provider, userKey);

    console.log(`[gemini-analyze] provider=${resolved.provider} model=${resolved.model}`);
    if (resolved.warning) console.warn(`[gemini-analyze] ${resolved.warning}`);

    const payload: any = {
      model: resolved.model,
      messages: [
        { role: "system", content: "You are a world-class quiz generation engine. You produce pedagogically excellent, beautifully structured quizzes. Return only valid JSON, no markdown fences, no extra text." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 8192,
    };

    const response = await fetch(config.url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        ...config.headers,
      },
      body: JSON.stringify(payload),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Wait a moment and try again." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "Credits exhausted. Top up your account." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[gemini-analyze] ${resolved.provider} error ${response.status}:`, errText);

      let userMessage = `AI provider error (${response.status})`;
      try {
        const errJson = JSON.parse(errText);
        const msg = errJson?.error?.message || errJson?.error || errJson?.message;
        if (msg) userMessage = String(msg);
      } catch { /* use default message */ }

      return new Response(JSON.stringify({ error: userMessage, warning: resolved.warning }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error("No response from AI model");

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not parse quiz JSON from AI response");

    const quizData = JSON.parse(jsonMatch[0]);
    const usage = data.usage || {};

    return new Response(JSON.stringify({
      ...quizData,
      usage,
      provider: resolved.provider,
      model: resolved.model,
      warning: resolved.warning,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[gemini-analyze] error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
