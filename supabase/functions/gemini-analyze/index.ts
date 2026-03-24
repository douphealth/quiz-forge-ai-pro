import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ProviderConfig {
  url: string;
  apiKey: string;
  headers: Record<string, string>;
}

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

function getProviderConfig(provider: string): ProviderConfig {
  switch (provider) {
    case "openrouter": {
      const key = Deno.env.get("OPENROUTER_API_KEY");
      if (!key) throw new Error("OPENROUTER_API_KEY is not configured. Add it in Supabase Edge Function secrets.");
      return {
        url: "https://openrouter.ai/api/v1/chat/completions",
        apiKey: key,
        headers: {
          "HTTP-Referer": "https://quizforge-ai.lovable.app",
          "X-Title": "QuizForge AI",
        },
      };
    }
    case "lovable":
    default: {
      const key = Deno.env.get("LOVABLE_API_KEY");
      if (!key) throw new Error("LOVABLE_API_KEY is not configured.");
      return {
        url: "https://ai.gateway.lovable.dev/v1/chat/completions",
        apiKey: key,
        headers: {},
      };
    }
  }
}

function normalizeProvider(provider: unknown): "lovable" | "openrouter" {
  return provider === "openrouter" ? "openrouter" : "lovable";
}

function normalizeModel(provider: "lovable" | "openrouter", model: unknown) {
  const requestedModel = typeof model === "string" ? model.trim() : "";

  if (provider === "openrouter") {
    return {
      model: requestedModel || "anthropic/claude-sonnet-4",
      warning: requestedModel ? null : "No OpenRouter model was provided, so Claude Sonnet 4 was selected automatically.",
    };
  }

  if (requestedModel && LOVABLE_ALLOWED_MODELS.has(requestedModel)) {
    return { model: requestedModel, warning: null };
  }

  return {
    model: "google/gemini-3-flash-preview",
    warning: requestedModel
      ? `Model \"${requestedModel}\" is not supported by Lovable AI. Automatically switched to google/gemini-3-flash-preview.`
      : null,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      content, title, model, provider,
      numQuestions, difficulty, questionTypes, language, focusTopics,
    } = await req.json();

    if (!content) {
      return new Response(JSON.stringify({ error: "Content is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const selectedProvider = normalizeProvider(provider);
    const { model: selectedModel, warning } = normalizeModel(selectedProvider, model);
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

    const config = getProviderConfig(selectedProvider);

    console.log(`[gemini-analyze] provider=${selectedProvider} model=${selectedModel}`);

    const response = await fetch(config.url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        ...config.headers,
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: "system", content: "You are a quiz generator. Return only valid JSON, no markdown fences." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    // Handle rate limits and payment errors
    if (response.status === 429) {
      const msg = selectedProvider === "lovable"
        ? "Rate limit exceeded. Please wait a moment and try again."
        : "OpenRouter rate limit exceeded. Check your plan limits.";
      return new Response(JSON.stringify({ error: msg }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (response.status === 402) {
      const msg = selectedProvider === "lovable"
        ? "AI credits exhausted. Add credits in Lovable workspace Settings → Usage."
        : "OpenRouter credits exhausted. Top up your OpenRouter account.";
      return new Response(JSON.stringify({ error: msg }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[gemini-analyze] ${selectedProvider} error ${response.status}:`, errText);

      // Provide actionable error for model not found
      if (response.status === 404) {
        return new Response(JSON.stringify({
          error: `Model "${selectedModel}" is not available on ${selectedProvider === "lovable" ? "Lovable AI" : "OpenRouter"}. Please select a different model.`,
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      throw new Error(`AI provider error (${response.status})`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error("No response from AI model");

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not parse quiz JSON from AI response");

    const quizData = JSON.parse(jsonMatch[0]);
    const usage = data.usage || {};

    return new Response(JSON.stringify({ ...quizData, usage, provider: selectedProvider, model: selectedModel }), {
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
