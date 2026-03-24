import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import type { Quiz, QuizQuestion } from "@/types/quiz";
import { cn } from "@/lib/utils";

const QuizPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      const { data, error } = await supabase
        .from("quizzes")
        .select("*")
        .eq("id", id)
        .single();
      if (error || !data) {
        navigate("/");
        return;
      }
      setQuiz({
        ...data,
        questions: data.questions as unknown as QuizQuestion[],
      });
      setLoading(false);
    };
    fetchQuiz();
  }, [id, navigate]);

  if (loading || !quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl">
          <CardHeader><Skeleton className="h-8 w-3/4" /></CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const question: QuizQuestion = quiz.questions[currentQ];
  const progress = ((currentQ + (confirmed ? 1 : 0)) / quiz.questions.length) * 100;
  const score = answers.filter((a, i) => a === quiz.questions[i].correctAnswer).length;

  const handleConfirm = () => {
    if (selected === null) return;
    setConfirmed(true);
    const newAnswers = [...answers, selected];
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQ + 1 >= quiz.questions.length) {
      setFinished(true);
      // Save result
      supabase.from("quiz_results").insert({
        quiz_id: quiz.id,
        score,
        answers: answers as unknown as any,
      });
      return;
    }
    setCurrentQ(currentQ + 1);
    setSelected(null);
    setConfirmed(false);
  };

  if (finished) {
    const pct = Math.round((score / quiz.questions.length) * 100);
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <Card className="w-full max-w-lg text-center">
            <CardHeader>
              <CardTitle className="font-display text-3xl">Quiz Complete!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-6xl font-display font-bold text-primary">{pct}%</div>
              <p className="text-muted-foreground">
                You got <span className="font-semibold text-foreground">{score}</span> out of{" "}
                <span className="font-semibold text-foreground">{quiz.questions.length}</span> correct
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => navigate("/")} className="gap-2">
                  <Home className="h-4 w-4" /> Home
                </Button>
                <Button onClick={() => { setCurrentQ(0); setSelected(null); setConfirmed(false); setAnswers([]); setFinished(false); }} className="gap-2">
                  <RotateCcw className="h-4 w-4" /> Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border px-6 py-4">
        <div className="container flex items-center justify-between">
          <h1 className="font-display text-xl font-bold tracking-tight text-foreground cursor-pointer" onClick={() => navigate("/")}>
            QuizForge<span className="text-primary">AI</span>
          </h1>
          <span className="text-sm text-muted-foreground">
            {currentQ + 1} / {quiz.questions.length}
          </span>
        </div>
      </header>

      <div className="container max-w-2xl flex-1 flex flex-col py-8 px-6 gap-6">
        <Progress value={progress} className="h-2" />

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <h2 className="font-display text-2xl font-semibold text-foreground">{question.question}</h2>

            <div className="space-y-3">
              {question.options.map((opt, i) => {
                const isCorrect = confirmed && i === question.correctAnswer;
                const isWrong = confirmed && i === selected && i !== question.correctAnswer;

                return (
                  <button
                    key={i}
                    onClick={() => !confirmed && setSelected(i)}
                    disabled={confirmed}
                    className={cn(
                      "w-full text-left p-4 rounded-lg border transition-all",
                      "hover:border-primary/50 hover:bg-primary/5",
                      selected === i && !confirmed && "border-primary bg-primary/10",
                      isCorrect && "border-success bg-success/10",
                      isWrong && "border-destructive bg-destructive/10",
                      confirmed && i !== selected && i !== question.correctAnswer && "opacity-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="shrink-0 w-8 h-8 rounded-full border flex items-center justify-center text-sm font-medium">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="flex-1">{opt}</span>
                      {isCorrect && <CheckCircle2 className="h-5 w-5 text-success shrink-0" />}
                      {isWrong && <XCircle className="h-5 w-5 text-destructive shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {confirmed && question.explanation && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-lg bg-muted text-sm text-muted-foreground">
                {question.explanation}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-end pt-4">
          {!confirmed ? (
            <Button onClick={handleConfirm} disabled={selected === null} className="gap-2">
              Confirm <CheckCircle2 className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleNext} className="gap-2">
              {currentQ + 1 >= quiz.questions.length ? "See Results" : "Next"} <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizPage;
