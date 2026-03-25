import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuizSessionStore } from "@/stores/quizSessionStore";
import { QuizTimer } from "@/components/quiz/QuizTimer";
import { QuizProgress } from "@/components/quiz/QuizProgress";
import { QuestionRenderer } from "@/components/quiz/QuestionRenderer";
import { QuizResults } from "@/components/quiz/QuizResults";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { ArrowLeft, ArrowRight, Send, Target } from "lucide-react";
import type { Json } from "@/integrations/supabase/types";

interface QuizData {
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
    order_index: number;
    bloom_taxonomy_level?: string | null;
  }>;
}

export default function QuizTakingPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);

  const store = useQuizSessionStore();

  useEffect(() => {
    if (!slug) return;

    // Check for preview quiz in location state
    const previewQuiz = (location.state as any)?.previewQuiz;
    if (previewQuiz) {
      const quizData: QuizData = {
        id: previewQuiz.id,
        title: previewQuiz.title,
        description: previewQuiz.description,
        questions: (previewQuiz.questions || []).map((q: any, i: number) => ({
          id: q.id || `q-${i}`,
          question_text: q.question_text || q.question,
          question_type: q.question_type || "multiple_choice",
          options: q.options || [],
          correct_answer: String(q.correct_answer ?? q.correctAnswer ?? 0),
          explanation: q.explanation || null,
          difficulty: q.difficulty || "medium",
          points: q.points || 1,
          order_index: i,
          bloom_taxonomy_level: q.bloom_taxonomy_level || null,
        })),
      };
      setQuiz(quizData);
      setLoading(false);
      return;
    }

    const fetchQuiz = async () => {
      let { data, error: err } = await supabase
        .from("quizzes")
        .select("id, title, description, config, status, visibility")
        .or(`slug.eq.${slug},id.eq.${slug}`)
        .single();

      if (err || !data) {
        setError("Quiz not found");
        setLoading(false);
        return;
      }

      if (data.status !== "published" && data.visibility !== "public") {
        // Allow draft quizzes to be previewed
      }

      const { data: questions, error: qErr } = await supabase
        .from("questions")
        .select("*")
        .eq("quiz_id", data.id)
        .order("order_index");

      if (qErr) {
        setError("Failed to load questions");
        setLoading(false);
        return;
      }

      const parsedQuestions = (questions || []).map((q) => ({
        ...q,
        options: Array.isArray(q.options) ? (q.options as string[]) : [],
      }));

      setQuiz({
        id: data.id,
        title: data.title,
        description: data.description,
        config: data.config,
        questions: parsedQuestions,
      });
      setLoading(false);
    };
    fetchQuiz();
  }, [slug, location.state]);

  const handleStart = useCallback(() => {
    if (!quiz) return;
    const timeLimitMinutes = quiz.config?.time_limit_minutes;
    store.initSession(
      quiz.questions.length,
      timeLimitMinutes ? timeLimitMinutes * 60 : null
    );
    setStarted(true);
  }, [quiz, store]);

  const handleSubmit = useCallback(async () => {
    if (!quiz) return;
    store.submitQuiz();

    let earned = 0;
    let total = 0;
    quiz.questions.forEach((q, i) => {
      const pts = q.points || 1;
      total += pts;
      const userAnswer = store.answers[i];
      if (userAnswer !== null && String(userAnswer) === String(q.correct_answer)) {
        earned += pts;
      }
    });

    const scorePercent = total > 0 ? Math.round((earned / total) * 100) : 0;
    const timeSpent = Math.round((Date.now() - store.startTime) / 1000);

    if (!quiz.id.startsWith("preview-")) {
      try {
        await supabase.from("quiz_sessions").insert({
          quiz_id: quiz.id,
          score: earned,
          score_percent: scorePercent,
          total_points: total,
          earned_points: earned,
          status: "completed",
          completed_at: new Date().toISOString(),
          time_spent_seconds: timeSpent,
          answers: store.answers as unknown as Json,
        });
      } catch {}
    }
  }, [quiz, store]);

  const handleTimerEnd = useCallback(() => {
    handleSubmit();
  }, [handleSubmit]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-2xl">
          <LoadingSkeleton variant="text-block" />
        </div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6">
        <div className="text-center space-y-4 max-w-sm mx-auto">
          <Target className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto" />
          <h2 className="font-display text-xl sm:text-2xl font-bold">{error || "Quiz not found"}</h2>
          <Button onClick={() => navigate("/")} className="w-full sm:w-auto">Go Home</Button>
        </div>
      </div>
    );
  }

  // START SCREEN
  if (!started) {
    const totalPoints = quiz.questions.reduce((s, q) => s + (q.points || 1), 0);
    const estMinutes = Math.ceil(quiz.questions.length * 1.5);
    const difficulties = quiz.questions.reduce((acc, q) => {
      const d = q.difficulty || "medium";
      acc[d] = (acc[d] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-border px-4 sm:px-6 py-3 bg-background/80 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <h1 className="font-display text-base sm:text-lg font-bold cursor-pointer" onClick={() => navigate("/")}>
              QuizForge<span className="text-primary">AI</span>
            </h1>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md text-center space-y-6 sm:space-y-8"
          >
            <div className="space-y-3">
              <div className="inline-flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-primary/10 mx-auto">
                <Target className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground leading-tight">{quiz.title}</h2>
              {quiz.description && <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{quiz.description}</p>}
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <div className="rounded-xl bg-card border border-border p-3 sm:p-4">
                <div className="text-xl sm:text-2xl font-bold text-primary font-display">{quiz.questions.length}</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mt-0.5">Questions</div>
              </div>
              <div className="rounded-xl bg-card border border-border p-3 sm:p-4">
                <div className="text-xl sm:text-2xl font-bold text-primary font-display">{totalPoints}</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mt-0.5">Points</div>
              </div>
              <div className="rounded-xl bg-card border border-border p-3 sm:p-4">
                <div className="text-xl sm:text-2xl font-bold text-primary font-display">{estMinutes}m</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mt-0.5">Est. Time</div>
              </div>
            </div>

            {/* Difficulty breakdown */}
            {Object.keys(difficulties).length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-2">
                {Object.entries(difficulties).map(([d, count]) => (
                  <span
                    key={d}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground capitalize"
                  >
                    {d}: {count}
                  </span>
                ))}
              </div>
            )}

            <Button onClick={handleStart} size="lg" className="gap-2 px-8 w-full sm:w-auto font-semibold text-base">
              Start Quiz <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        </main>
      </div>
    );
  }

  if (store.isSubmitted) {
    return <QuizResults quiz={quiz} />;
  }

  const question = quiz.questions[store.currentQuestionIndex];
  const totalQuestions = quiz.questions.length;
  const answeredCount = store.answers.filter((a) => a !== null).length;
  const isLastQuestion = store.currentQuestionIndex === totalQuestions - 1;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="border-b border-border px-4 sm:px-6 py-2.5 sm:py-3 bg-background/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <h1
            className="font-display text-sm sm:text-lg font-bold tracking-tight text-foreground cursor-pointer shrink-0"
            onClick={() => navigate("/")}
          >
            QuizForge<span className="text-primary">AI</span>
          </h1>
          <div className="flex items-center gap-2 sm:gap-4">
            {store.timeRemaining !== null && (
              <QuizTimer timeRemaining={store.timeRemaining} onTimerEnd={handleTimerEnd} />
            )}
            <span className="text-xs sm:text-sm text-muted-foreground font-medium whitespace-nowrap">
              {store.currentQuestionIndex + 1}/{totalQuestions}
            </span>
          </div>
        </div>
      </header>

      {/* Progress */}
      <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 pt-3 sm:pt-4">
        <QuizProgress
          total={totalQuestions}
          current={store.currentQuestionIndex}
          answers={store.answers}
          onGoTo={(i) => store.goToQuestion(i)}
        />
      </div>

      {/* Question */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-5 sm:py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={store.currentQuestionIndex}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
          >
            {question && (
              <QuestionRenderer
                question={question}
                questionIndex={store.currentQuestionIndex}
                selectedAnswer={store.answers[store.currentQuestionIndex]}
                onSelectAnswer={(answer) => store.selectAnswer(store.currentQuestionIndex, answer)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom bar */}
      <footer className="border-t border-border px-4 sm:px-6 py-3 sm:py-4 bg-background/80 backdrop-blur-sm sticky bottom-0">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-2">
          <Button
            variant="outline"
            onClick={() => store.prevQuestion()}
            disabled={store.currentQuestionIndex === 0}
            className="gap-1.5 text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4"
            size="sm"
          >
            <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Previous</span>
            <span className="sm:hidden">Prev</span>
          </Button>

          <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
            {answeredCount}/{totalQuestions} answered
          </span>

          {isLastQuestion ? (
            <ConfirmDialog
              trigger={
                <Button className="gap-1.5 text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4" size="sm">
                  <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Submit
                </Button>
              }
              title="Submit Quiz?"
              description={`You've answered ${answeredCount} of ${totalQuestions} questions. ${
                answeredCount < totalQuestions ? "Some questions are unanswered." : ""
              } Submit now?`}
              confirmText="Submit"
              onConfirm={handleSubmit}
            />
          ) : (
            <Button
              onClick={() => store.nextQuestion(totalQuestions)}
              className="gap-1.5 text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4"
              size="sm"
            >
              Next <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}
