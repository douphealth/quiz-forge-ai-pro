import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, Home, Trophy, Target, Clock, Copy, Download, Check, Loader2, Code } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import type { QuizQuestion } from "@/types/quiz";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface LoadedQuiz {
  id: string;
  title: string;
  description?: string;
  questions: QuizQuestion[];
}

interface PreviewQuizState {
  previewQuiz?: LoadedQuiz;
}

const QuizPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [quiz, setQuiz] = useState<LoadedQuiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQ, setCurrentQ] = useState(-1); // -1 = start screen
  const [selected, setSelected] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);
  const [startTime] = useState(Date.now());
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const previewQuiz = (location.state as PreviewQuizState | null)?.previewQuiz;
    if (previewQuiz) {
      setQuiz(previewQuiz);
      setLoading(false);
      return;
    }

    const fetchQuiz = async () => {
      const { data, error } = await supabase
        .from("quizzes")
        .select("id, title, description")
        .eq("id", id)
        .single();
      if (error || !data) { navigate("/"); return; }

      const { data: qData } = await supabase
        .from("questions")
        .select("*")
        .eq("quiz_id", data.id)
        .order("order_index");

      const questions: QuizQuestion[] = (qData || []).map((q) => ({
        id: q.id,
        question: q.question_text,
        question_text: q.question_text,
        options: Array.isArray(q.options) ? q.options as string[] : [],
        correctAnswer: typeof q.correct_answer === "string" ? parseInt(q.correct_answer, 10) : 0,
        correct_answer: q.correct_answer,
        explanation: q.explanation || undefined,
        difficulty: q.difficulty,
        points: q.points,
        order_index: q.order_index,
      }));

      setQuiz({ id: data.id, title: data.title, description: data.description || undefined, questions });
      setLoading(false);
    };
    fetchQuiz();
  }, [id, navigate, location.state]);

  if (loading || !quiz) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl border-border/50">
          <CardHeader><Skeleton className="h-8 w-3/4" /></CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (quiz.questions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-lg text-center border-border/50">
          <CardContent className="py-12 space-y-4">
            <p className="text-muted-foreground">This quiz has no questions yet.</p>
            <Button onClick={() => navigate("/")}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const question = currentQ >= 0 ? quiz.questions[currentQ] : null;
  const progress = currentQ < 0 ? 0 : ((currentQ + (confirmed ? 1 : 0)) / quiz.questions.length) * 100;
  const score = answers.filter((a, i) => a === quiz.questions[i].correctAnswer).length;
  const totalPoints = quiz.questions.reduce((s, q) => s + (q.points || 1), 0);
  const earnedPoints = answers.reduce((s, a, i) => a === quiz.questions[i].correctAnswer ? s + (quiz.questions[i].points || 1) : s, 0);

  const handleConfirm = () => {
    if (selected === null) return;
    setConfirmed(true);
    setAnswers([...answers, selected]);
  };

  const handleNext = () => {
    if (currentQ + 1 >= quiz.questions.length) {
      setFinished(true);
      if (!quiz.id.startsWith("preview-")) {
        supabase.from("quiz_results").insert({
          quiz_id: quiz.id,
          score,
          answers: answers as unknown as any,
        });
      }
      return;
    }
    setCurrentQ(currentQ + 1);
    setSelected(null);
    setConfirmed(false);
  };

  const handleExport = async (action: "copy" | "download") => {
    setExporting(true);
    try {
      const body = quiz.id.startsWith("preview-")
        ? {
            quiz_data: {
              title: quiz.title,
              description: quiz.description || "",
              questions: quiz.questions.map((q) => ({
                question_text: q.question_text || q.question,
                question_type: "multiple_choice",
                options: q.options || [],
                correct_answer: String(q.correct_answer ?? q.correctAnswer ?? 0),
                explanation: q.explanation || "",
                difficulty: q.difficulty || "medium",
                points: q.points || 1,
              })),
            },
          }
        : { quiz_id: quiz.id };

      const { data, error } = await supabase.functions.invoke("export-quiz-html", { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (action === "copy") {
        await navigator.clipboard.writeText(data.html);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
        toast({ title: "HTML copied!", description: "Paste into your WordPress page or any site." });
      } else {
        const blob = new Blob([data.html], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${(quiz.title || "quiz").replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}.html`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      toast({ title: "Export failed", description: err.message, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const handleRetry = () => {
    setCurrentQ(-1);
    setSelected(null);
    setConfirmed(false);
    setAnswers([]);
    setFinished(false);
  };

  // START SCREEN
  if (currentQ === -1 && !finished) {
    const estMinutes = Math.ceil(quiz.questions.length * 1.5);
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-border px-6 py-4">
          <div className="container flex items-center justify-between">
            <h1 className="font-display text-xl font-bold tracking-tight text-foreground cursor-pointer" onClick={() => navigate("/")}>
              QuizForge<span className="text-primary">AI</span>
            </h1>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center px-6 py-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg text-center space-y-8">
            <div className="space-y-3">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mx-auto">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <h2 className="font-display text-3xl font-bold text-foreground">{quiz.title}</h2>
              {quiz.description && <p className="text-muted-foreground">{quiz.description}</p>}
            </div>

            <div className="flex justify-center gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{quiz.questions.length}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Questions</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{totalPoints}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Points</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{estMinutes}m</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Est. Time</div>
              </div>
            </div>

            <div className="space-y-3">
              <Button onClick={() => setCurrentQ(0)} size="lg" className="gap-2 px-8">
                Start Quiz <ArrowRight className="h-4 w-4" />
              </Button>
              <div className="flex justify-center gap-2">
                <Button onClick={() => handleExport("copy")} variant="ghost" size="sm" className="gap-1 text-xs">
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? "Copied!" : "Copy HTML"}
                </Button>
                <Button onClick={() => handleExport("download")} variant="ghost" size="sm" className="gap-1 text-xs">
                  <Download className="h-3 w-3" /> Download
                </Button>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  // RESULTS SCREEN
  if (finished) {
    const pct = Math.round((score / quiz.questions.length) * 100);
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    const resultMsg = pct >= 90 ? "🏆 Outstanding!" : pct >= 70 ? "🎉 Great Job!" : pct >= 50 ? "👍 Good Effort!" : "📚 Keep Learning!";

    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-border px-6 py-4">
          <div className="container flex items-center justify-between">
            <h1 className="font-display text-xl font-bold tracking-tight text-foreground cursor-pointer" onClick={() => navigate("/")}>
              QuizForge<span className="text-primary">AI</span>
            </h1>
          </div>
        </header>
        <main className="container max-w-2xl flex-1 py-8 px-6 space-y-8">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-6">
            {/* Score circle */}
            <div className="relative w-40 h-40 mx-auto">
              <svg viewBox="0 0 150 150" className="w-full h-full">
                <circle cx="75" cy="75" r="65" fill="none" className="stroke-muted" strokeWidth="10" />
                <motion.circle
                  cx="75" cy="75" r="65" fill="none"
                  className="stroke-primary"
                  strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 65}
                  initial={{ strokeDashoffset: 2 * Math.PI * 65 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 65 * (1 - pct / 100) }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  transform="rotate(-90 75 75)"
                />
                <text x="75" y="70" textAnchor="middle" className="fill-foreground text-4xl font-bold" style={{ fontSize: 40, fontWeight: 800 }}>{pct}%</text>
                <text x="75" y="92" textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em" }}>Score</text>
              </svg>
            </div>

            <div>
              <h2 className="font-display text-3xl font-bold">{resultMsg}</h2>
              <p className="text-muted-foreground mt-1">
                {score} of {quiz.questions.length} correct · {earnedPoints} of {totalPoints} points · {minutes}m {seconds}s
              </p>
            </div>

            <div className="flex flex-wrap gap-3 justify-center">
              <Button onClick={handleRetry} className="gap-2">
                <RotateCcw className="h-4 w-4" /> Try Again
              </Button>
              <Button onClick={() => handleExport("copy")} variant="outline" size="default" className="gap-2" disabled={exporting}>
                {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied!" : "Copy HTML"}
              </Button>
              <Button onClick={() => handleExport("download")} variant="outline" className="gap-2" disabled={exporting}>
                <Download className="h-4 w-4" /> Download
              </Button>
              <Button variant="ghost" onClick={() => navigate("/")} className="gap-2">
                <Home className="h-4 w-4" /> Home
              </Button>
            </div>
          </motion.div>

          {/* Detailed Review */}
          <div className="space-y-3">
            <h3 className="font-display text-lg font-semibold">Review Answers</h3>
            {quiz.questions.map((q, i) => {
              const isCorrect = answers[i] === q.correctAnswer;
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className={cn("border-l-4", isCorrect ? "border-l-emerald-500" : "border-l-destructive")}>
                    <CardContent className="py-4 space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="text-sm font-semibold text-muted-foreground shrink-0">{i + 1}.</span>
                        <div className="flex-1 space-y-2">
                          <p className="font-medium text-sm">{q.question_text || q.question}</p>
                          <div className="flex items-center gap-2 text-sm">
                            <span className={cn("font-medium", isCorrect ? "text-emerald-500" : "text-destructive")}>
                              Your answer: {String.fromCharCode(65 + answers[i])}. {q.options[answers[i]]}
                              {isCorrect ? " ✓" : " ✗"}
                            </span>
                          </div>
                          {!isCorrect && (
                            <p className="text-sm text-emerald-600 dark:text-emerald-400">
                              Correct: {String.fromCharCode(65 + q.correctAnswer)}. {q.options[q.correctAnswer]}
                            </p>
                          )}
                          {q.explanation && (
                            <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 mt-1 leading-relaxed">
                              💡 {q.explanation}
                            </div>
                          )}
                        </div>
                      </div>
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

  // QUESTION SCREEN
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border px-6 py-4">
        <div className="container flex items-center justify-between">
          <h1 className="font-display text-xl font-bold tracking-tight text-foreground cursor-pointer" onClick={() => navigate("/")}>
            QuizForge<span className="text-primary">AI</span>
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {currentQ + 1} / {quiz.questions.length}
            </span>
          </div>
        </div>
      </header>
      <div className="container max-w-2xl flex-1 flex flex-col py-8 px-6 gap-6">
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Question {currentQ + 1} of {quiz.questions.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {question && (
            <motion.div
              key={currentQ}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Question metadata */}
              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs capitalize">{question.difficulty || "medium"}</Badge>
                <Badge variant="outline" className="text-xs">{question.points || 1} pt{(question.points || 1) > 1 ? "s" : ""}</Badge>
              </div>

              <h2 className="font-display text-2xl font-semibold text-foreground leading-snug">{question.question_text || question.question}</h2>

              <div className="space-y-3">
                {question.options.map((opt, i) => {
                  const isCorrect = confirmed && i === question.correctAnswer;
                  const isWrong = confirmed && i === selected && i !== question.correctAnswer;
                  const isSelected = !confirmed && selected === i;
                  return (
                    <motion.button
                      key={i}
                      onClick={() => !confirmed && setSelected(i)}
                      disabled={confirmed}
                      whileHover={!confirmed ? { scale: 1.01 } : {}}
                      whileTap={!confirmed ? { scale: 0.99 } : {}}
                      className={cn(
                        "w-full text-left p-4 rounded-xl border-2 transition-all",
                        !confirmed && "hover:border-primary/50 hover:bg-primary/5",
                        isSelected && "border-primary bg-primary/10 shadow-sm",
                        isCorrect && "border-emerald-500 bg-emerald-500/10",
                        isWrong && "border-destructive bg-destructive/10",
                        confirmed && !isCorrect && !isWrong && "opacity-40"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <span className={cn(
                          "shrink-0 w-9 h-9 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all",
                          isSelected && "bg-primary text-primary-foreground border-primary",
                          isCorrect && "bg-emerald-500 text-white border-emerald-500",
                          isWrong && "bg-destructive text-white border-destructive",
                          !isSelected && !isCorrect && !isWrong && "border-border"
                        )}>
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="flex-1 text-[15px]">{opt}</span>
                        {isCorrect && <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />}
                        {isWrong && <XCircle className="h-5 w-5 text-destructive shrink-0" />}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {confirmed && question.explanation && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-sm text-foreground leading-relaxed"
                >
                  <span className="font-semibold text-primary">💡 Explanation:</span>{" "}
                  {question.explanation}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-end pt-4 mt-auto">
          {!confirmed ? (
            <Button onClick={handleConfirm} disabled={selected === null} size="lg" className="gap-2">
              Check Answer <CheckCircle2 className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleNext} size="lg" className="gap-2">
              {currentQ + 1 >= quiz.questions.length ? "See Results" : "Next Question"} <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizPage;
