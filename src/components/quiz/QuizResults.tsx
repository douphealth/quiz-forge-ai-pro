import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuizSessionStore } from "@/stores/quizSessionStore";
import { cn } from "@/lib/utils";
import {
  RotateCcw, Home, Trophy, CheckCircle2, XCircle,
  ChevronDown, ChevronUp, Share2, Copy, Download, Loader2, Check,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface QuizResultsProps {
  quiz: {
    id: string;
    title: string;
    description?: string | null;
    config?: any;
    questions: Array<{
      id: string;
      question_text: string;
      question_type: string;
      options: string[];
      correct_answer: string | null;
      explanation: string | null;
      difficulty: string | null;
      points: number | null;
    }>;
  };
}

export function QuizResults({ quiz }: QuizResultsProps) {
  const navigate = useNavigate();
  const store = useQuizSessionStore();
  const [expandedQ, setExpandedQ] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  const config = quiz.config || {};
  const showCorrect = config.show_correct_answers !== false;
  const showExplanations = config.show_explanations !== false;
  const passingScore = config.passing_score_percent || 70;

  const results = useMemo(() => {
    let earned = 0;
    let total = 0;
    let correct = 0;

    quiz.questions.forEach((q, i) => {
      const pts = q.points || 1;
      total += pts;
      const userAnswer = store.answers[i];
      if (userAnswer !== null && String(userAnswer) === String(q.correct_answer)) {
        earned += pts;
        correct++;
      }
    });

    const scorePercent = total > 0 ? Math.round((earned / total) * 100) : 0;
    const passed = scorePercent >= passingScore;
    const timeSpent = Math.round((Date.now() - store.startTime) / 1000);
    const unanswered = store.answers.filter((a) => a === null).length;

    return { earned, total, correct, scorePercent, passed, timeSpent, unanswered };
  }, [quiz, store]);

  const handleExport = async (action: "copy" | "download") => {
    setExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("export-quiz-html", {
        body: { quiz_id: quiz.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (action === "copy") {
        await navigator.clipboard.writeText(data.html);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
        toast({ title: "HTML copied!" });
      } else {
        const blob = new Blob([data.html], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${quiz.title.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}.html`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      toast({ title: "Export failed", description: err.message, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const handleRetake = () => {
    store.initSession(quiz.questions.length);
  };

  const minutes = Math.floor(results.timeSpent / 60);
  const seconds = results.timeSpent % 60;

  const resultEmoji = results.scorePercent >= 90
    ? "🏆"
    : results.scorePercent >= 70
      ? "🎉"
      : results.scorePercent >= 50
        ? "👍"
        : "📚";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border px-6 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <h1
            className="font-display text-lg font-bold cursor-pointer"
            onClick={() => navigate("/")}
          >
            QuizForge<span className="text-primary">AI</span>
          </h1>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-8 space-y-8">
        {/* Score section */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="text-center space-y-6"
        >
          {/* Confetti-style dots for passing */}
          {results.passed && (
            <div className="relative">
              {Array.from({ length: 12 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    left: "50%",
                    top: "50%",
                    backgroundColor: ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--warning))", "hsl(var(--success))"][i % 4],
                  }}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                  animate={{
                    x: Math.cos((i * 30 * Math.PI) / 180) * (80 + Math.random() * 40),
                    y: Math.sin((i * 30 * Math.PI) / 180) * (80 + Math.random() * 40),
                    opacity: [1, 1, 0],
                    scale: [0, 1.5, 0],
                  }}
                  transition={{ duration: 1.2, delay: i * 0.05, ease: "easeOut" }}
                />
              ))}
            </div>
          )}

          {/* Score circle */}
          <div className="relative w-44 h-44 mx-auto">
            <svg viewBox="0 0 150 150" className="w-full h-full">
              <circle cx="75" cy="75" r="65" fill="none" className="stroke-muted" strokeWidth="8" />
              <motion.circle
                cx="75" cy="75" r="65" fill="none"
                className="stroke-primary"
                strokeWidth="8" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 65}
                initial={{ strokeDashoffset: 2 * Math.PI * 65 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 65 * (1 - results.scorePercent / 100) }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
                transform="rotate(-90 75 75)"
              />
              <text x="75" y="68" textAnchor="middle" className="fill-foreground" style={{ fontSize: 36, fontWeight: 800 }}>
                {results.scorePercent}%
              </text>
              <text x="75" y="90" textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em" }}>
                Score
              </text>
            </svg>
          </div>

          <div>
            <h2 className="font-display text-3xl font-bold">
              {resultEmoji} {results.passed ? "You Passed!" : "Keep Learning!"}
            </h2>
            <p className="text-muted-foreground mt-1">
              {results.correct} of {quiz.questions.length} correct · {results.earned} of {results.total} pts · {minutes}m {seconds}s
            </p>
            <Badge variant={results.passed ? "default" : "destructive"} className="mt-2">
              {results.passed ? "PASSED" : "BELOW PASSING"} ({passingScore}% needed)
            </Badge>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 justify-center">
            <Button onClick={handleRetake} className="gap-2">
              <RotateCcw className="h-4 w-4" /> Retake
            </Button>
            <Button onClick={() => handleExport("copy")} variant="outline" disabled={exporting} className="gap-2">
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied!" : "Copy HTML"}
            </Button>
            <Button onClick={() => handleExport("download")} variant="outline" disabled={exporting} className="gap-2">
              <Download className="h-4 w-4" /> Download
            </Button>
            <Button variant="ghost" onClick={() => navigate("/")} className="gap-2">
              <Home className="h-4 w-4" /> Home
            </Button>
          </div>
        </motion.div>

        {/* Review section */}
        <div className="space-y-3">
          <h3 className="font-display text-lg font-semibold">Review Answers</h3>
          {quiz.questions.map((q, i) => {
            const userAnswer = store.answers[i];
            const isCorrect = userAnswer !== null && String(userAnswer) === String(q.correct_answer);
            const isExpanded = expandedQ === i;

            return (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card
                  className={cn(
                    "border-l-4 cursor-pointer transition-colors hover:bg-muted/30",
                    isCorrect ? "border-l-success" : "border-l-destructive"
                  )}
                  onClick={() => setExpandedQ(isExpanded ? null : i)}
                >
                  <CardContent className="py-3 space-y-2">
                    <div className="flex items-start gap-2">
                      {isCorrect ? (
                        <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{q.question_text}</p>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                    </div>

                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="pl-7 space-y-2 pt-2"
                      >
                        <p className="text-sm">
                          <span className="text-muted-foreground">Your answer: </span>
                          <span className={cn("font-medium", isCorrect ? "text-success" : "text-destructive")}>
                            {userAnswer === null
                              ? "Unanswered"
                              : typeof userAnswer === "number" && q.options[userAnswer]
                                ? `${String.fromCharCode(65 + userAnswer)}. ${q.options[userAnswer]}`
                                : String(userAnswer)}
                          </span>
                        </p>
                        {showCorrect && !isCorrect && (
                          <p className="text-sm">
                            <span className="text-muted-foreground">Correct: </span>
                            <span className="text-success font-medium">
                              {q.correct_answer !== null && q.options[Number(q.correct_answer)]
                                ? `${String.fromCharCode(65 + Number(q.correct_answer))}. ${q.options[Number(q.correct_answer)]}`
                                : q.correct_answer}
                            </span>
                          </p>
                        )}
                        {showExplanations && q.explanation && (
                          <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 leading-relaxed">
                            💡 {q.explanation}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
