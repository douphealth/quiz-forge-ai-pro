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
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>${quiz.title || "Quiz"}</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --qf-primary:#7c3aed;--qf-primary-light:#a78bfa;--qf-primary-dark:#6d28d9;--qf-primary-bg:rgba(124,58,237,0.06);
  --qf-accent:#14b8a6;--qf-accent-bg:rgba(20,184,166,0.06);
  --qf-success:#10b981;--qf-success-bg:rgba(16,185,129,0.06);
  --qf-error:#ef4444;--qf-error-bg:rgba(239,68,68,0.06);
  --qf-warning:#f59e0b;
  --qf-bg:#ffffff;--qf-surface:#f8fafc;--qf-surface-hover:#f1f5f9;--qf-border:#e2e8f0;
  --qf-text:#0f172a;--qf-text-secondary:#475569;--qf-text-muted:#94a3b8;
  --qf-radius:14px;--qf-radius-sm:10px;
  --qf-shadow:0 1px 3px rgba(0,0,0,0.04),0 1px 2px rgba(0,0,0,0.03);
  --qf-shadow-md:0 4px 6px -1px rgba(0,0,0,0.05),0 2px 4px -2px rgba(0,0,0,0.03);
  --qf-shadow-lg:0 10px 25px -5px rgba(0,0,0,0.06),0 8px 10px -6px rgba(0,0,0,0.03);
  --qf-font:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
  --qf-font-display:"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
}
@media(prefers-color-scheme:dark){
  :root{
    --qf-bg:#0f172a;--qf-surface:#1e293b;--qf-surface-hover:#334155;--qf-border:#334155;
    --qf-text:#f1f5f9;--qf-text-secondary:#94a3b8;--qf-text-muted:#64748b;
    --qf-primary-bg:rgba(124,58,237,0.12);--qf-accent-bg:rgba(20,184,166,0.12);
    --qf-success-bg:rgba(16,185,129,0.12);--qf-error-bg:rgba(239,68,68,0.12);
    --qf-shadow:none;--qf-shadow-md:0 4px 6px rgba(0,0,0,0.15);--qf-shadow-lg:0 10px 25px rgba(0,0,0,0.2);
  }
}
body{font-family:var(--qf-font);color:var(--qf-text);background:var(--qf-bg);-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
.qf{max-width:680px;margin:0 auto;padding:20px 16px 32px}
@media(min-width:640px){.qf{padding:32px 24px 48px}}

/* Typography */
.qf-title{font-family:var(--qf-font-display);font-size:clamp(22px,5vw,32px);font-weight:800;letter-spacing:-0.03em;line-height:1.15;background:linear-gradient(135deg,var(--qf-primary),var(--qf-accent));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.qf-subtitle{font-size:clamp(14px,3vw,16px);color:var(--qf-text-secondary);line-height:1.6;margin-top:8px}

/* Progress */
.qf-progress{margin-bottom:6px}
.qf-progress-track{background:var(--qf-surface);border-radius:99px;height:6px;overflow:hidden;border:1px solid var(--qf-border)}
.qf-progress-fill{height:100%;background:linear-gradient(90deg,var(--qf-primary),var(--qf-accent));border-radius:99px;transition:width 0.6s cubic-bezier(0.25,1,0.5,1)}
.qf-progress-info{display:flex;justify-content:space-between;font-size:12px;color:var(--qf-text-muted);margin-top:6px;font-weight:500}

/* Question Card */
.qf-card{background:var(--qf-surface);border:1px solid var(--qf-border);border-radius:var(--qf-radius);padding:clamp(18px,4vw,28px);box-shadow:var(--qf-shadow-md);animation:qf-fadeUp 0.35s ease}
@keyframes qf-fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}

/* Meta badges */
.qf-meta{display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap}
.qf-badge{display:inline-flex;align-items:center;padding:3px 10px;border-radius:99px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em}
.qf-badge-easy{background:var(--qf-success-bg);color:var(--qf-success)}
.qf-badge-medium{background:rgba(245,158,11,0.08);color:var(--qf-warning)}
.qf-badge-hard{background:var(--qf-error-bg);color:var(--qf-error)}
.qf-badge-expert{background:var(--qf-primary-bg);color:var(--qf-primary)}
.qf-badge-pts{background:var(--qf-surface);color:var(--qf-text-muted);border:1px solid var(--qf-border)}
.qf-badge-bloom{background:var(--qf-accent-bg);color:var(--qf-accent)}

/* Question text */
.qf-q{font-family:var(--qf-font-display);font-size:clamp(17px,4vw,20px);font-weight:700;line-height:1.4;margin-bottom:20px;color:var(--qf-text)}

/* Options */
.qf-opts{display:flex;flex-direction:column;gap:8px}
.qf-opt{display:flex;align-items:center;gap:clamp(10px,3vw,14px);padding:clamp(12px,3vw,16px);border-radius:var(--qf-radius-sm);border:2px solid var(--qf-border);background:var(--qf-bg);cursor:pointer;transition:all 0.2s;font-size:clamp(14px,3.5vw,15px);line-height:1.45;text-align:left;width:100%;-webkit-tap-highlight-color:transparent}
.qf-opt:hover:not(.qf-locked){border-color:var(--qf-primary);background:var(--qf-primary-bg);transform:translateY(-1px);box-shadow:var(--qf-shadow)}
.qf-opt:active:not(.qf-locked){transform:scale(0.99)}
.qf-opt.qf-sel{border-color:var(--qf-primary);background:var(--qf-primary-bg);box-shadow:0 0 0 3px rgba(124,58,237,0.1)}
.qf-opt.qf-ok{border-color:var(--qf-success);background:var(--qf-success-bg)}
.qf-opt.qf-no{border-color:var(--qf-error);background:var(--qf-error-bg)}
.qf-opt.qf-locked{cursor:default}
.qf-opt.qf-ok,.qf-opt.qf-no{opacity:1!important}
.qf-opt.qf-locked:not(.qf-ok):not(.qf-no){opacity:0.5}

/* Option letter circle */
.qf-letter{width:clamp(28px,7vw,34px);height:clamp(28px,7vw,34px);border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:clamp(12px,3vw,14px);flex-shrink:0;background:var(--qf-surface);border:2px solid var(--qf-border);transition:all 0.2s}
.qf-sel .qf-letter{background:var(--qf-primary);color:#fff;border-color:var(--qf-primary)}
.qf-ok .qf-letter{background:var(--qf-success);color:#fff;border-color:var(--qf-success)}
.qf-no .qf-letter{background:var(--qf-error);color:#fff;border-color:var(--qf-error)}
.qf-opt-text{flex:1}
.qf-opt-icon{width:20px;height:20px;flex-shrink:0}

/* Explanation */
.qf-explain{margin-top:16px;padding:clamp(14px,3vw,18px);border-radius:var(--qf-radius-sm);background:var(--qf-primary-bg);border-left:4px solid var(--qf-primary);font-size:clamp(13px,3vw,14px);line-height:1.65;color:var(--qf-text);animation:qf-fadeUp 0.25s ease}
.qf-explain b{color:var(--qf-primary)}

/* Actions */
.qf-actions{display:flex;gap:10px;margin-top:20px;justify-content:flex-end;flex-wrap:wrap}
.qf-btn{padding:clamp(10px,3vw,14px) clamp(20px,5vw,28px);border-radius:var(--qf-radius-sm);font-size:clamp(14px,3.5vw,15px);font-weight:600;cursor:pointer;border:none;transition:all 0.2s;display:inline-flex;align-items:center;gap:8px;-webkit-tap-highlight-color:transparent}
.qf-btn:active{transform:scale(0.97)}
.qf-btn-primary{background:linear-gradient(135deg,var(--qf-primary),var(--qf-primary-dark));color:#fff;box-shadow:0 2px 8px rgba(124,58,237,0.25)}
.qf-btn-primary:hover{filter:brightness(1.08);box-shadow:0 4px 16px rgba(124,58,237,0.3)}
.qf-btn-primary:disabled{opacity:0.35;cursor:not-allowed;filter:none;box-shadow:none}
.qf-btn-ghost{background:transparent;color:var(--qf-text-secondary);border:2px solid var(--qf-border)}
.qf-btn-ghost:hover{border-color:var(--qf-primary);color:var(--qf-primary)}

/* Results */
.qf-results{text-align:center;animation:qf-fadeUp 0.5s ease}
.qf-score-wrap{width:clamp(130px,35vw,170px);height:clamp(130px,35vw,170px);margin:0 auto 20px}
.qf-score-wrap svg{width:100%;height:100%}
.qf-score-bg{fill:none;stroke:var(--qf-border);stroke-width:8}
.qf-score-fill{fill:none;stroke:var(--qf-primary);stroke-width:8;stroke-linecap:round;transition:stroke-dashoffset 1.8s cubic-bezier(0.25,1,0.5,1)}
.qf-score-num{font-size:clamp(32px,9vw,44px);font-weight:800;fill:var(--qf-text)}
.qf-score-label{font-size:11px;fill:var(--qf-text-muted);text-transform:uppercase;letter-spacing:0.12em}
.qf-result-title{font-family:var(--qf-font-display);font-size:clamp(22px,5vw,28px);font-weight:800;margin-bottom:6px}
.qf-result-stats{color:var(--qf-text-secondary);font-size:clamp(13px,3vw,15px);margin-bottom:24px}

/* Review items */
.qf-review{text-align:left;margin-top:28px}
.qf-review-title{font-family:var(--qf-font-display);font-size:16px;font-weight:700;margin-bottom:12px;color:var(--qf-text)}
.qf-review-item{padding:clamp(14px,3vw,18px);border-radius:var(--qf-radius-sm);background:var(--qf-surface);border:1px solid var(--qf-border);margin-bottom:8px;border-left:4px solid var(--qf-border)}
.qf-review-item.qf-review-ok{border-left-color:var(--qf-success)}
.qf-review-item.qf-review-wrong{border-left-color:var(--qf-error)}
.qf-review-q{font-weight:600;margin-bottom:8px;font-size:clamp(13px,3vw,15px);line-height:1.4}
.qf-review-ans{font-size:clamp(12px,3vw,13px);margin-bottom:3px}
.qf-review-ok-text{color:var(--qf-success)}
.qf-review-wrong-text{color:var(--qf-error)}
.qf-review-exp{font-size:clamp(12px,2.5vw,13px);color:var(--qf-text-secondary);margin-top:10px;line-height:1.6;padding:10px 14px;background:var(--qf-primary-bg);border-radius:8px}

/* Start screen */
.qf-start{text-align:center;padding:clamp(24px,6vw,48px) clamp(12px,3vw,20px)}
.qf-start-icon{width:56px;height:56px;border-radius:16px;background:var(--qf-primary-bg);display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px}
.qf-start-icon svg{width:28px;height:28px;color:var(--qf-primary)}
.qf-stats-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:24px 0}
.qf-stat-card{background:var(--qf-surface);border:1px solid var(--qf-border);border-radius:var(--qf-radius-sm);padding:clamp(12px,3vw,18px)}
.qf-stat-val{font-size:clamp(22px,6vw,30px);font-weight:800;color:var(--qf-primary);font-family:var(--qf-font-display)}
.qf-stat-lbl{font-size:10px;color:var(--qf-text-muted);text-transform:uppercase;letter-spacing:0.06em;margin-top:2px}

/* Branding */
.qf-brand{text-align:center;margin-top:28px;padding-top:14px;border-top:1px solid var(--qf-border);font-size:11px;color:var(--qf-text-muted)}
.qf-brand a{color:var(--qf-primary);text-decoration:none;font-weight:600}

/* Confetti */
.qf-confetti{position:relative;height:0}
.qf-confetti-dot{position:absolute;width:8px;height:8px;border-radius:50%;animation:qf-confettiBurst 1.2s ease-out forwards}
@keyframes qf-confettiBurst{0%{transform:translate(0,0) scale(0);opacity:1}60%{opacity:1;transform:translate(var(--tx),var(--ty)) scale(1.2)}100%{opacity:0;transform:translate(var(--tx),var(--ty)) scale(0)}}
</style>
</head>
<body>
<div class="qf" id="qf-app"></div>
<script>
(function(){
  const D = ${quizJSON};
  const app = document.getElementById("qf-app");
  let cq = -1, sel = null, locked = false, ans = [];
  const L = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const diffCls = {easy:"qf-badge-easy",medium:"qf-badge-medium",hard:"qf-badge-hard",expert:"qf-badge-expert"};

  function esc(s){if(!s)return"";const d=document.createElement("div");d.textContent=s;return d.innerHTML}

  function render(){
    if(cq===-1){renderStart();return}
    if(cq>=D.questions.length){renderResults();return}
    renderQuestion();
  }

  function renderStart(){
    const tp=D.questions.reduce((s,q)=>s+(q.points||1),0);
    const et=Math.ceil(D.questions.length*1.5);
    app.innerHTML=\`
      <div class="qf-start">
        <div class="qf-start-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg></div>
        <div class="qf-title">\${esc(D.title)}</div>
        <div class="qf-subtitle">\${esc(D.description)}</div>
        <div class="qf-stats-grid">
          <div class="qf-stat-card"><div class="qf-stat-val">\${D.questions.length}</div><div class="qf-stat-lbl">Questions</div></div>
          <div class="qf-stat-card"><div class="qf-stat-val">\${tp}</div><div class="qf-stat-lbl">Points</div></div>
          <div class="qf-stat-card"><div class="qf-stat-val">\${et}m</div><div class="qf-stat-lbl">Est. Time</div></div>
        </div>
        <button class="qf-btn qf-btn-primary" onclick="window.__qfGo()">Start Quiz →</button>
      </div>
      <div class="qf-brand">Powered by <a href="https://quiz-forge-ai-pro.lovable.app" target="_blank">QuizForge AI</a></div>
    \`;
  }
  window.__qfGo=function(){cq=0;sel=null;locked=false;render()};

  function renderQuestion(){
    const q=D.questions[cq];
    const pct=((cq+(locked?1:0))/D.questions.length*100).toFixed(0);
    const dc=diffCls[q.difficulty]||"qf-badge-medium";

    let optsHTML=q.options.map((o,i)=>{
      let c="qf-opt";
      if(locked)c+=" qf-locked";
      if(!locked&&sel===i)c+=" qf-sel";
      if(locked&&i===q.correct)c+=" qf-ok";
      if(locked&&sel===i&&i!==q.correct)c+=" qf-no";
      let icon="";
      if(locked&&i===q.correct)icon='<svg class="qf-opt-icon" viewBox="0 0 20 20" fill="currentColor" style="color:var(--qf-success)"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>';
      if(locked&&sel===i&&i!==q.correct)icon='<svg class="qf-opt-icon" viewBox="0 0 20 20" fill="currentColor" style="color:var(--qf-error)"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>';
      return \`<button class="\${c}" onclick="window.__qfSel(\${i})"><span class="qf-letter">\${L[i]}</span><span class="qf-opt-text">\${esc(o)}</span>\${icon}</button>\`;
    }).join("");

    let expHTML="";
    if(locked&&q.explanation)expHTML=\`<div class="qf-explain"><b>💡 Explanation:</b> \${esc(q.explanation)}</div>\`;

    app.innerHTML=\`
      <div style="text-align:center;margin-bottom:16px"><span class="qf-title" style="font-size:clamp(16px,4vw,20px)">\${esc(D.title)}</span></div>
      <div class="qf-progress">
        <div class="qf-progress-track"><div class="qf-progress-fill" style="width:\${pct}%"></div></div>
        <div class="qf-progress-info"><span>Question \${cq+1} of \${D.questions.length}</span><span>\${pct}%</span></div>
      </div>
      <div class="qf-card">
        <div class="qf-meta">
          <span class="qf-badge \${dc}">\${esc(q.difficulty)}</span>
          <span class="qf-badge qf-badge-pts">\${q.points||1} pt\${(q.points||1)>1?"s":""}</span>
          \${q.bloom?\`<span class="qf-badge qf-badge-bloom">\${esc(q.bloom)}</span>\`:""}
        </div>
        <div class="qf-q">\${esc(q.text)}</div>
        <div class="qf-opts">\${optsHTML}</div>
        \${expHTML}
        <div class="qf-actions">
          \${!locked
            ?\`<button class="qf-btn qf-btn-primary" \${sel===null?"disabled":""} onclick="window.__qfCheck()">Check Answer</button>\`
            :\`<button class="qf-btn qf-btn-primary" onclick="window.__qfNext()">\${cq+1>=D.questions.length?"See Results":"Next →"}</button>\`}
        </div>
      </div>
      <div class="qf-brand">Powered by <a href="https://quiz-forge-ai-pro.lovable.app" target="_blank">QuizForge AI</a></div>
    \`;
  }

  window.__qfSel=function(i){if(!locked){sel=i;render()}};
  window.__qfCheck=function(){if(sel!==null){locked=true;ans.push(sel);render()}};
  window.__qfNext=function(){cq++;sel=null;locked=false;render()};

  function renderResults(){
    const total=D.questions.length;
    const correct=ans.filter((a,i)=>a===D.questions[i].correct).length;
    const pct=Math.round(correct/total*100);
    const tp=D.questions.reduce((s,q)=>s+(q.points||1),0);
    const ep=ans.reduce((s,a,i)=>a===D.questions[i].correct?s+(D.questions[i].points||1):s,0);
    const circ=2*Math.PI*60;
    const off=circ-(pct/100)*circ;
    const msg=pct>=90?"🏆 Outstanding!":pct>=70?"🎉 Great Job!":pct>=50?"👍 Good Effort!":"📚 Keep Learning!";
    const colors=["#7c3aed","#14b8a6","#f59e0b","#10b981","#ef4444","#a78bfa"];

    let confettiHTML="";
    if(pct>=70){
      confettiHTML='<div class="qf-confetti">';
      for(let i=0;i<20;i++){
        const angle=(i/20)*360;
        const dist=50+Math.random()*50;
        const tx=Math.cos(angle*Math.PI/180)*dist;
        const ty=Math.sin(angle*Math.PI/180)*dist;
        const color=colors[i%colors.length];
        const delay=(i*0.03).toFixed(2);
        confettiHTML+=\`<div class="qf-confetti-dot" style="left:50%;top:0;background:\${color};--tx:\${tx}px;--ty:\${ty}px;animation-delay:\${delay}s"></div>\`;
      }
      confettiHTML+='</div>';
    }

    let reviewHTML=D.questions.map((q,i)=>{
      const ok=ans[i]===q.correct;
      return \`
        <div class="qf-review-item \${ok?"qf-review-ok":"qf-review-wrong"}">
          <div class="qf-review-q">\${i+1}. \${esc(q.text)}</div>
          <div class="qf-review-ans \${ok?"qf-review-ok-text":"qf-review-wrong-text"}">
            Your answer: \${L[ans[i]]}. \${esc(q.options[ans[i]])} \${ok?"✓":"✗"}
          </div>
          \${!ok?\`<div class="qf-review-ans qf-review-ok-text">Correct: \${L[q.correct]}. \${esc(q.options[q.correct])}</div>\`:""}
          \${q.explanation?\`<div class="qf-review-exp">💡 \${esc(q.explanation)}</div>\`:""}
        </div>\`;
    }).join("");

    app.innerHTML=\`
      <div class="qf-results">
        \${confettiHTML}
        <div class="qf-score-wrap">
          <svg viewBox="0 0 140 140">
            <circle class="qf-score-bg" cx="70" cy="70" r="60"/>
            <circle class="qf-score-fill" cx="70" cy="70" r="60"
              stroke-dasharray="\${circ}" stroke-dashoffset="\${circ}"
              transform="rotate(-90 70 70)"/>
            <text class="qf-score-num" x="70" y="66" text-anchor="middle">\${pct}%</text>
            <text class="qf-score-label" x="70" y="84" text-anchor="middle">SCORE</text>
          </svg>
        </div>
        <div class="qf-result-title">\${msg}</div>
        <div class="qf-result-stats">\${correct}/\${total} correct · \${ep}/\${tp} points</div>
        <button class="qf-btn qf-btn-primary" onclick="window.__qfRetry()">🔄 Try Again</button>
        <div class="qf-review">
          <div class="qf-review-title">Answer Review</div>
          \${reviewHTML}
        </div>
      </div>
      <div class="qf-brand">Powered by <a href="https://quiz-forge-ai-pro.lovable.app" target="_blank">QuizForge AI</a></div>
    \`;

    setTimeout(()=>{const r=document.querySelector(".qf-score-fill");if(r)r.style.strokeDashoffset=\`\${off}\`},100);
  }

  window.__qfRetry=function(){cq=-1;sel=null;locked=false;ans=[];render()};

  cq=-1;render();
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
