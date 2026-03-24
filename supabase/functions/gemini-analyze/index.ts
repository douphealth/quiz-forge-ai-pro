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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const { content, title, model, numQuestions, difficulty, questionTypes, language, focusTopics } = await req.json();
    if (!content) {
      return new Response(JSON.stringify({ error: "Content is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const selectedModel = model || "google/gemini-3-flash-preview";
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

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
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

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in your Lovable workspace settings." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error(`AI gateway error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error("No response from AI model");

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not parse quiz from AI response");

    const quizData = JSON.parse(jsonMatch[0]);
    const usage = data.usage || {};

    return new Response(JSON.stringify({ ...quizData, usage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
