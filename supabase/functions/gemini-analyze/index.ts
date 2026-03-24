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

    const count = numQuestions || 5;
    const diff = difficulty || "medium";
    const lang = language || "English";
    const types = questionTypes?.length ? questionTypes.join(", ") : "multiple_choice";
    const topics = focusTopics?.length ? `Focus on these topics: ${focusTopics.join(", ")}.` : "";

    const prompt = `You are an expert quiz generator. Based on the following article titled "${title}", create a quiz with exactly ${count} questions.

Requirements:
- Difficulty: ${diff}
- Question types: ${types}
- Language: ${lang}
${topics}

Return ONLY valid JSON in this exact format:
{
  "title": "Quiz: ${title}",
  "description": "A brief quiz description",
  "questions": [
    {
      "question_text": "The question text",
      "question_type": "multiple_choice",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "0",
      "explanation": "Brief explanation of why this is correct",
      "difficulty": "${diff}",
      "points": 1
    }
  ]
}

For correct_answer, use the index (0-based) of the correct option as a string.
For true_false questions, use options: ["True", "False"] and correct_answer: "0" or "1".

Article content:
${content.slice(0, 12000)}`;

    const config = getProviderConfig(resolved.provider, userKey);

    console.log(`[gemini-analyze] provider=${resolved.provider} model=${resolved.model}`);
    if (resolved.warning) console.warn(`[gemini-analyze] ${resolved.warning}`);

    const payload = {
      model: resolved.model,
      messages: [
        { role: "system", content: "You are a quiz generator. Return only valid JSON, no markdown fences." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 4096,
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
          if (msg) {
          userMessage = String(msg);

          if (userMessage.includes("No allowed providers")) {
            const available = errJson?.error?.metadata?.available_providers;
              userMessage = `Your OpenRouter key was used, but model "${resolved.model}" is only available on provider "${available?.join(", ") || "unknown"}" and that provider is not allowed in your OpenRouter account settings. Enable that provider in OpenRouter or choose a different model.`;
          }
        }
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
