import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function generateEmbedHTML(quiz: any, questions: any[]): string {
  const quizJSON = JSON.stringify({
    title: quiz.title,
    description: quiz.description || "",
    questions: questions.map((q: any, i: number) => ({
      id: i,
      text: q.question_text,
      type: q.question_type || "multiple_choice",
      options: Array.isArray(q.options) ? q.options : [],
      correct: typeof q.correct_answer === "string" ? parseInt(q.correct_answer, 10) : 0,
      explanation: q.explanation || "",
      difficulty: q.difficulty || "medium",
      points: q.points || 1,
      bloom: q.bloom_taxonomy_level || "",
    })),
  }).replace(/</g, "\\u003c");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${quiz.title || "Quiz"}</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --qf-primary:#7c3aed;--qf-primary-light:#a78bfa;--qf-primary-bg:rgba(124,58,237,0.08);
  --qf-success:#10b981;--qf-success-bg:rgba(16,185,129,0.08);
  --qf-error:#ef4444;--qf-error-bg:rgba(239,68,68,0.08);
  --qf-bg:#ffffff;--qf-surface:#f8fafc;--qf-border:#e2e8f0;
  --qf-text:#0f172a;--qf-text-muted:#64748b;--qf-text-light:#94a3b8;
  --qf-radius:12px;--qf-shadow:0 1px 3px rgba(0,0,0,0.06),0 1px 2px rgba(0,0,0,0.04);
  --qf-shadow-lg:0 10px 15px -3px rgba(0,0,0,0.08),0 4px 6px -4px rgba(0,0,0,0.04);
  --qf-font:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
}
@media(prefers-color-scheme:dark){
  :root{--qf-bg:#0f172a;--qf-surface:#1e293b;--qf-border:#334155;--qf-text:#f1f5f9;--qf-text-muted:#94a3b8;--qf-text-light:#64748b;
    --qf-primary-bg:rgba(124,58,237,0.15);--qf-success-bg:rgba(16,185,129,0.15);--qf-error-bg:rgba(239,68,68,0.15);
    --qf-shadow:0 1px 3px rgba(0,0,0,0.2);--qf-shadow-lg:0 10px 15px -3px rgba(0,0,0,0.3);
  }
}
.qf-root{font-family:var(--qf-font);color:var(--qf-text);background:var(--qf-bg);max-width:720px;margin:0 auto;padding:24px 16px}
.qf-header{text-align:center;margin-bottom:32px}
.qf-title{font-size:28px;font-weight:800;letter-spacing:-0.02em;margin-bottom:8px;background:linear-gradient(135deg,var(--qf-primary),var(--qf-primary-light));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.qf-desc{font-size:15px;color:var(--qf-text-muted);line-height:1.5}
.qf-progress-wrap{background:var(--qf-surface);border-radius:99px;height:8px;overflow:hidden;margin-bottom:8px;border:1px solid var(--qf-border)}
.qf-progress-bar{height:100%;background:linear-gradient(90deg,var(--qf-primary),var(--qf-primary-light));border-radius:99px;transition:width 0.5s cubic-bezier(0.4,0,0.2,1)}
.qf-progress-text{display:flex;justify-content:space-between;font-size:13px;color:var(--qf-text-muted);margin-bottom:24px}
.qf-question-card{background:var(--qf-surface);border:1px solid var(--qf-border);border-radius:var(--qf-radius);padding:28px;box-shadow:var(--qf-shadow);animation:qf-slideIn 0.4s ease}
@keyframes qf-slideIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
.qf-q-meta{display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap}
.qf-badge{display:inline-flex;align-items:center;padding:4px 10px;border-radius:99px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em}
.qf-badge-diff{background:var(--qf-primary-bg);color:var(--qf-primary)}
.qf-badge-pts{background:var(--qf-surface);color:var(--qf-text-muted);border:1px solid var(--qf-border)}
.qf-badge-bloom{background:var(--qf-surface);color:var(--qf-text-light);border:1px solid var(--qf-border)}
.qf-q-text{font-size:19px;font-weight:700;line-height:1.4;margin-bottom:24px;color:var(--qf-text)}
.qf-options{display:flex;flex-direction:column;gap:10px}
.qf-option{display:flex;align-items:center;gap:14px;padding:14px 18px;border-radius:var(--qf-radius);border:2px solid var(--qf-border);background:var(--qf-bg);cursor:pointer;transition:all 0.2s;font-size:15px;line-height:1.4;text-align:left;width:100%}
.qf-option:hover:not(.qf-disabled){border-color:var(--qf-primary);background:var(--qf-primary-bg);transform:translateY(-1px);box-shadow:var(--qf-shadow)}
.qf-option.qf-selected{border-color:var(--qf-primary);background:var(--qf-primary-bg)}
.qf-option.qf-correct{border-color:var(--qf-success);background:var(--qf-success-bg)}
.qf-option.qf-wrong{border-color:var(--qf-error);background:var(--qf-error-bg)}
.qf-option.qf-disabled{cursor:default;opacity:0.6}
.qf-option.qf-correct,.qf-option.qf-wrong{opacity:1!important}
.qf-opt-letter{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;flex-shrink:0;background:var(--qf-surface);border:2px solid var(--qf-border);transition:all 0.2s}
.qf-selected .qf-opt-letter{background:var(--qf-primary);color:#fff;border-color:var(--qf-primary)}
.qf-correct .qf-opt-letter{background:var(--qf-success);color:#fff;border-color:var(--qf-success)}
.qf-wrong .qf-opt-letter{background:var(--qf-error);color:#fff;border-color:var(--qf-error)}
.qf-opt-text{flex:1}
.qf-opt-icon{width:20px;height:20px;flex-shrink:0}
.qf-explanation{margin-top:16px;padding:16px 20px;border-radius:var(--qf-radius);background:var(--qf-primary-bg);border-left:4px solid var(--qf-primary);font-size:14px;line-height:1.6;color:var(--qf-text);animation:qf-slideIn 0.3s ease}
.qf-explanation strong{color:var(--qf-primary)}
.qf-actions{display:flex;gap:12px;margin-top:24px;justify-content:flex-end}
.qf-btn{padding:12px 28px;border-radius:var(--qf-radius);font-size:15px;font-weight:600;cursor:pointer;border:none;transition:all 0.2s;display:inline-flex;align-items:center;gap:8px}
.qf-btn:active{transform:scale(0.97)}
.qf-btn-primary{background:var(--qf-primary);color:#fff}
.qf-btn-primary:hover{filter:brightness(1.1);box-shadow:0 4px 12px rgba(124,58,237,0.3)}
.qf-btn-primary:disabled{opacity:0.4;cursor:not-allowed;filter:none;box-shadow:none}
.qf-btn-outline{background:transparent;color:var(--qf-text);border:2px solid var(--qf-border)}
.qf-btn-outline:hover{border-color:var(--qf-primary);color:var(--qf-primary)}
.qf-results{text-align:center;animation:qf-slideIn 0.5s ease}
.qf-score-ring{width:160px;height:160px;margin:0 auto 24px}
.qf-score-ring svg{width:100%;height:100%}
.qf-score-circle{fill:none;stroke:var(--qf-border);stroke-width:10}
.qf-score-value{fill:none;stroke:var(--qf-primary);stroke-width:10;stroke-linecap:round;transition:stroke-dashoffset 1.5s cubic-bezier(0.4,0,0.2,1)}
.qf-score-text{font-size:42px;font-weight:800;fill:var(--qf-text)}
.qf-score-label{font-size:13px;fill:var(--qf-text-muted);text-transform:uppercase;letter-spacing:0.1em}
.qf-result-msg{font-size:24px;font-weight:700;margin-bottom:8px}
.qf-result-detail{color:var(--qf-text-muted);font-size:15px;margin-bottom:32px}
.qf-review-item{text-align:left;padding:20px;border-radius:var(--qf-radius);background:var(--qf-surface);border:1px solid var(--qf-border);margin-bottom:12px}
.qf-review-q{font-weight:600;margin-bottom:8px;font-size:15px}
.qf-review-answer{font-size:13px;margin-bottom:4px}
.qf-review-correct{color:var(--qf-success)}
.qf-review-wrong{color:var(--qf-error)}
.qf-review-exp{font-size:13px;color:var(--qf-text-muted);margin-top:8px;line-height:1.5}
.qf-branding{text-align:center;margin-top:32px;padding-top:16px;border-top:1px solid var(--qf-border);font-size:12px;color:var(--qf-text-light)}
.qf-branding a{color:var(--qf-primary);text-decoration:none;font-weight:600}
.qf-screen{display:none}.qf-screen.qf-active{display:block}
.qf-start-screen{text-align:center;padding:40px 20px}
.qf-start-stats{display:flex;gap:24px;justify-content:center;margin:24px 0}
.qf-start-stat{text-align:center}
.qf-start-stat-value{font-size:28px;font-weight:800;color:var(--qf-primary)}
.qf-start-stat-label{font-size:12px;color:var(--qf-text-muted);text-transform:uppercase;letter-spacing:0.05em}
</style>
</head>
<body>
<div class="qf-root" id="qf-app"></div>
<script>
(function(){
  const DATA = ${quizJSON};
  const app = document.getElementById("qf-app");
  let currentQ = 0, selected = null, confirmed = false, answers = [];

  function render() {
    if (currentQ === -1) { renderStart(); return; }
    if (currentQ >= DATA.questions.length) { renderResults(); return; }
    renderQuestion();
  }

  function renderStart() {
    const totalPts = DATA.questions.reduce((s,q) => s + (q.points||1), 0);
    app.innerHTML = \`
      <div class="qf-header">
        <div class="qf-title">\${esc(DATA.title)}</div>
        <div class="qf-desc">\${esc(DATA.description)}</div>
      </div>
      <div class="qf-start-screen">
        <div class="qf-start-stats">
          <div class="qf-start-stat"><div class="qf-start-stat-value">\${DATA.questions.length}</div><div class="qf-start-stat-label">Questions</div></div>
          <div class="qf-start-stat"><div class="qf-start-stat-value">\${totalPts}</div><div class="qf-start-stat-label">Points</div></div>
          <div class="qf-start-stat"><div class="qf-start-stat-value">\${Math.ceil(DATA.questions.length * 1.5)}m</div><div class="qf-start-stat-label">Est. Time</div></div>
        </div>
        <button class="qf-btn qf-btn-primary" onclick="window.__qfStart()">Start Quiz →</button>
      </div>
      <div class="qf-branding">Powered by <a href="https://quiz-forge-ai-pro.lovable.app" target="_blank">QuizForge AI</a></div>
    \`;
  }
  window.__qfStart = function() { currentQ = 0; selected = null; confirmed = false; render(); };

  function renderQuestion() {
    const q = DATA.questions[currentQ];
    const pct = ((currentQ + (confirmed ? 1 : 0)) / DATA.questions.length * 100).toFixed(0);
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    let optionsHTML = q.options.map((opt, i) => {
      let cls = "qf-option";
      if (confirmed) cls += " qf-disabled";
      if (!confirmed && selected === i) cls += " qf-selected";
      if (confirmed && i === q.correct) cls += " qf-correct";
      if (confirmed && selected === i && i !== q.correct) cls += " qf-wrong";

      let icon = "";
      if (confirmed && i === q.correct) icon = '<svg class="qf-opt-icon" viewBox="0 0 20 20" fill="currentColor" style="color:var(--qf-success)"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>';
      if (confirmed && selected === i && i !== q.correct) icon = '<svg class="qf-opt-icon" viewBox="0 0 20 20" fill="currentColor" style="color:var(--qf-error)"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>';

      return \`<button class="\${cls}" onclick="window.__qfSelect(\${i})"><span class="qf-opt-letter">\${letters[i]}</span><span class="qf-opt-text">\${esc(opt)}</span>\${icon}</button>\`;
    }).join("");

    let explanationHTML = "";
    if (confirmed && q.explanation) {
      explanationHTML = \`<div class="qf-explanation"><strong>💡 Explanation:</strong> \${esc(q.explanation)}</div>\`;
    }

    app.innerHTML = \`
      <div class="qf-header">
        <div class="qf-title">\${esc(DATA.title)}</div>
      </div>
      <div class="qf-progress-wrap"><div class="qf-progress-bar" style="width:\${pct}%"></div></div>
      <div class="qf-progress-text"><span>Question \${currentQ + 1} of \${DATA.questions.length}</span><span>\${pct}% complete</span></div>
      <div class="qf-question-card">
        <div class="qf-q-meta">
          <span class="qf-badge qf-badge-diff">\${esc(q.difficulty)}</span>
          <span class="qf-badge qf-badge-pts">\${q.points || 1} pt\${(q.points||1)>1?"s":""}</span>
          \${q.bloom ? \`<span class="qf-badge qf-badge-bloom">\${esc(q.bloom)}</span>\` : ""}
        </div>
        <div class="qf-q-text">\${esc(q.text)}</div>
        <div class="qf-options">\${optionsHTML}</div>
        \${explanationHTML}
        <div class="qf-actions">
          \${!confirmed
            ? \`<button class="qf-btn qf-btn-primary" \${selected===null?"disabled":""} onclick="window.__qfConfirm()">Check Answer</button>\`
            : \`<button class="qf-btn qf-btn-primary" onclick="window.__qfNext()">\${currentQ+1>=DATA.questions.length?"See Results":"Next Question →"}</button>\`}
        </div>
      </div>
      <div class="qf-branding">Powered by <a href="https://quiz-forge-ai-pro.lovable.app" target="_blank">QuizForge AI</a></div>
    \`;
  }

  window.__qfSelect = function(i) { if (!confirmed) { selected = i; render(); } };
  window.__qfConfirm = function() { if (selected !== null) { confirmed = true; answers.push(selected); render(); } };
  window.__qfNext = function() { currentQ++; selected = null; confirmed = false; render(); };

  function renderResults() {
    const total = DATA.questions.length;
    const correct = answers.filter((a,i) => a === DATA.questions[i].correct).length;
    const pct = Math.round(correct / total * 100);
    const totalPts = DATA.questions.reduce((s,q) => s + (q.points||1), 0);
    const earnedPts = answers.reduce((s,a,i) => a === DATA.questions[i].correct ? s + (DATA.questions[i].points||1) : s, 0);
    const circumference = 2 * Math.PI * 65;
    const offset = circumference - (pct / 100) * circumference;

    let msg = pct >= 90 ? "🏆 Outstanding!" : pct >= 70 ? "🎉 Great Job!" : pct >= 50 ? "👍 Good Effort!" : "📚 Keep Learning!";

    let reviewHTML = DATA.questions.map((q, i) => {
      const isCorrect = answers[i] === q.correct;
      const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      return \`
        <div class="qf-review-item">
          <div class="qf-review-q">\${i+1}. \${esc(q.text)}</div>
          <div class="qf-review-answer \${isCorrect?"qf-review-correct":"qf-review-wrong"}">
            Your answer: \${letters[answers[i]]}. \${esc(q.options[answers[i]])} \${isCorrect?"✓":"✗"}
          </div>
          \${!isCorrect ? \`<div class="qf-review-answer qf-review-correct">Correct: \${letters[q.correct]}. \${esc(q.options[q.correct])}</div>\` : ""}
          \${q.explanation ? \`<div class="qf-review-exp">\${esc(q.explanation)}</div>\` : ""}
        </div>\`;
    }).join("");

    app.innerHTML = \`
      <div class="qf-results">
        <div class="qf-score-ring">
          <svg viewBox="0 0 150 150">
            <circle class="qf-score-circle" cx="75" cy="75" r="65"/>
            <circle class="qf-score-value" cx="75" cy="75" r="65" 
              stroke-dasharray="\${circumference}" stroke-dashoffset="\${circumference}"
              transform="rotate(-90 75 75)" style="transition:stroke-dashoffset 1.5s"/>
            <text class="qf-score-text" x="75" y="72" text-anchor="middle">\${pct}%</text>
            <text class="qf-score-label" x="75" y="92" text-anchor="middle">SCORE</text>
          </svg>
        </div>
        <div class="qf-result-msg">\${msg}</div>
        <div class="qf-result-detail">\${correct} of \${total} correct · \${earnedPts} of \${totalPts} points</div>
        <div style="margin-bottom:24px">
          <button class="qf-btn qf-btn-primary" onclick="window.__qfRetry()">🔄 Try Again</button>
        </div>
        <div style="text-align:left">\${reviewHTML}</div>
      </div>
      <div class="qf-branding">Powered by <a href="https://quiz-forge-ai-pro.lovable.app" target="_blank">QuizForge AI</a></div>
    \`;

    setTimeout(() => {
      const ring = document.querySelector(".qf-score-value");
      if (ring) ring.style.strokeDashoffset = \`\${offset}\`;
    }, 100);
  }

  window.__qfRetry = function() { currentQ = -1; selected = null; confirmed = false; answers = []; render(); };

  function esc(s) { if (!s) return ""; const d = document.createElement("div"); d.textContent = s; return d.innerHTML; }

  currentQ = -1;
  render();
})();
</script>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { quiz_id, quiz_data } = await req.json();

    if (quiz_data) {
      const html = generateEmbedHTML(
        { title: quiz_data.title, description: quiz_data.description },
        quiz_data.questions || []
      );
      return new Response(JSON.stringify({ html }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!quiz_id) {
      return new Response(JSON.stringify({ error: "quiz_id or quiz_data is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey);

    const { data: quiz, error: quizErr } = await sb
      .from("quizzes")
      .select("id, title, description")
      .eq("id", quiz_id)
      .single();
    if (quizErr || !quiz) throw new Error("Quiz not found");

    const { data: questions } = await sb
      .from("questions")
      .select("*")
      .eq("quiz_id", quiz_id)
      .order("order_index");

    const html = generateEmbedHTML(quiz, questions || []);

    return new Response(JSON.stringify({ html }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[export-quiz-html] error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
