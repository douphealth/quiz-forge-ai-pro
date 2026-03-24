import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { title, description, questions, source_urls, created_by, org_id, model, connection_id } = await req.json();

    if (!title || !questions || !created_by || !org_id) {
      return new Response(JSON.stringify({ error: "title, questions, created_by, and org_id are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Create the quiz
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .insert({
        title,
        description: description || null,
        source_urls: source_urls || [],
        created_by,
        org_id,
        ai_model: model || null,
        connection_id: connection_id || null,
        status: "draft",
        visibility: "private",
      })
      .select()
      .single();

    if (quizError) throw quizError;

    // 2. Insert questions
    const questionRows = questions.map((q: any, i: number) => ({
      quiz_id: quiz.id,
      question_text: q.question_text || q.question,
      question_type: q.question_type || "multiple_choice",
      options: q.options || [],
      correct_answer: String(q.correct_answer ?? q.correctAnswer ?? "0"),
      explanation: q.explanation || null,
      difficulty: q.difficulty || "medium",
      points: q.points || 1,
      order_index: i,
    }));

    const { error: qError } = await supabase.from("questions").insert(questionRows);
    if (qError) throw qError;

    return new Response(JSON.stringify({ id: quiz.id, title: quiz.title, questionCount: questionRows.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
