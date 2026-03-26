import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_MODELS = new Set([
  "google/gemini-2.5-pro",
  "google/gemini-2.5-flash",
  "google/gemini-2.5-flash-lite",
  "google/gemini-3-flash-preview",
  "google/gemini-3-pro-image-preview",
  "google/gemini-3.1-pro-preview",
  "google/gemini-3.1-flash-image-preview",
  "openai/gpt-5",
  "openai/gpt-5-mini",
  "openai/gpt-5-nano",
  "openai/gpt-5.2",
]);

function resolveProvider(
  requestedProvider: string | undefined,
  requestedModel: string | undefined,
  userApiKey: string | undefined,
): { provider: "lovable" | "openrouter"; model: string; warning: string | null } {
  const model = typeof requestedModel === "string" ? requestedModel.trim() : "";

  // Explicit openrouter with user key
  if (requestedProvider === "openrouter" && userApiKey) {
    return { provider: "openrouter", model: model || "google/gemini-2.5-flash", warning: null };
  }

  // If the model is in Lovable's set, always use Lovable (fastest)
  if (model && LOVABLE_MODELS.has(model)) {
    return { provider: "lovable", model, warning: null };
  }

  // Non-Lovable model with OpenRouter key
  if (model && !LOVABLE_MODELS.has(model)) {
    const orKey = userApiKey || Deno.env.get("OPENROUTER_API_KEY");
    if (orKey) {
      return { provider: "openrouter", model, warning: null };
    }
    return { provider: "lovable", model: "google/gemini-2.5-flash", warning: `Model "${model}" unavailable without OpenRouter key. Using Gemini 2.5 Flash instead.` };
  }

  // Default: fastest reliable model via Lovable
  return { provider: "lovable", model: "google/gemini-2.5-flash", warning: null };
}

function getConfig(provider: "lovable" | "openrouter", userApiKey?: string) {
  if (provider === "openrouter") {
    const key = userApiKey || Deno.env.get("OPENROUTER_API_KEY");
    if (!key) throw new Error("No OpenRouter API key configured.");
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

function buildSystemPrompt(): string {
  return `You are QuizForge AI — the world's most advanced educational quiz engine trusted by Fortune 500 companies, top universities, and leading e-learning platforms.

Your quizzes are LEGENDARY for their quality. You produce quiz questions that:
- Test DEEP understanding, not surface recall
- Use real-world scenarios and applied knowledge
- Have plausible, educational distractors
- Include rich explanations that teach even when answered correctly

You ALWAYS return valid JSON. Never add markdown fences or extra text.`;
}

function buildUserPrompt(title: string, content: string, count: number, diff: string, types: string, lang: string, topics: string): string {
  return `Create an exceptional quiz from: "${title}"

SPECS: ${count} questions | Difficulty: ${diff} | Types: ${types} | Language: ${lang}
${topics}

QUESTION DESIGN RULES:
- Use Bloom's Taxonomy: mix Remember, Understand, Apply, and Analyze levels
- Frame questions as scenarios: "Given X, what would happen if..."
- Each question MUST have exactly ONE unambiguous correct answer
- Vary difficulty: include easy warm-ups, challenging mid-section, and hard finishers
- Order from easier → harder for pedagogical flow

ANSWER OPTION RULES:
- All wrong answers must be PLAUSIBLE (common misconceptions)
- Options should be similar length and grammatical structure
- Never use "All of the above" or "None of the above"
- Randomize correct answer position across questions

EXPLANATION RULES (CRITICAL — this is what makes our quizzes premium):
- Every explanation MUST be 3-5 sentences minimum
- Explain WHY the correct answer is right with evidence from the article
- Explain WHY the most tempting wrong answer is wrong
- Include a "💡 Pro Tip" or interesting fact when possible
- Make explanations feel like mini-lessons

Return this exact JSON structure:
{
  "title": "Quiz: ${title}",
  "description": "A compelling 2-sentence description",
  "questions": [
    {
      "question_text": "Well-crafted scenario question",
      "question_type": "multiple_choice",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "2",
      "explanation": "Detailed educational explanation with 💡 Pro Tip...",
      "difficulty": "medium",
      "points": 2,
      "bloom_level": "apply"
    }
  ]
}

RULES:
- correct_answer = 0-based index as STRING
- true_false: options = ["True", "False"], correct_answer = "0" or "1"
- Points: easy=1, medium=2, hard=3
- fill_blank: options = [], correct_answer = the answer text

ARTICLE:
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
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userKey = typeof openrouter_api_key === "string" ? openrouter_api_key.trim() : undefined;
    const resolved = resolveProvider(provider, model, userKey);
    const config = getConfig(resolved.provider, userKey);

    const count = numQuestions || 10;
    const diff = difficulty || "mixed";
    const lang = language || "English";
    const types = questionTypes?.length ? questionTypes.join(", ") : "multiple_choice";
    const topics = focusTopics?.length ? `Focus on: ${focusTopics.join(", ")}.` : "";

    console.log(`[gemini-analyze] provider=${resolved.provider} model=${resolved.model}`);
    if (resolved.warning) console.warn(`[gemini-analyze] ${resolved.warning}`);

    const payload = {
      model: resolved.model,
      messages: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: buildUserPrompt(title || "Untitled", content, count, diff, types, lang, topics) },
      ],
      temperature: 0.7,
      max_tokens: 8192,
    };

    // Retry logic: try up to 2 times
    let lastError = "";
    for (let attempt = 0; attempt < 2; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90_000);

      let response: Response;
      try {
        response = await fetch(config.url, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${config.apiKey}`,
            "Content-Type": "application/json",
            ...config.headers,
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
      } catch (fetchErr: any) {
        clearTimeout(timeoutId);
        if (fetchErr.name === "AbortError") {
          lastError = "AI model timed out (>90s). Try a faster model like google/gemini-2.5-flash.";
          if (attempt === 0) { console.warn("[gemini-analyze] timeout, retrying..."); continue; }
          return new Response(JSON.stringify({ error: lastError }), {
            status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw fetchErr;
      }
      clearTimeout(timeoutId);

      if (response.status === 429) {
        if (attempt === 0) { await new Promise(r => setTimeout(r, 3000)); continue; }
        return new Response(JSON.stringify({ error: "Rate limited. Wait a moment and try again." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[gemini-analyze] ${resolved.provider} error ${response.status}:`, errText);
        let msg = `AI error (${response.status})`;
        try {
          const j = JSON.parse(errText);
          msg = j?.error?.message || j?.error || j?.message || msg;
        } catch {}
        if (attempt === 0) { lastError = String(msg); continue; }
        return new Response(JSON.stringify({ error: String(msg), warning: resolved.warning }), {
          status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Success
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content;
      if (!text) throw new Error("No response from AI model");

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("AI returned invalid format. Please try again.");

      const quizData = JSON.parse(jsonMatch[0]);

      // Validate quiz structure
      if (!quizData.questions || !Array.isArray(quizData.questions) || quizData.questions.length === 0) {
        throw new Error("AI returned empty quiz. Please try again.");
      }

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
    }

    return new Response(JSON.stringify({ error: lastError || "Generation failed after retries" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[gemini-analyze] error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
