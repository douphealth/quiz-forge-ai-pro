import { useEffect, useState, useCallback, memo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useQuizSessionStore } from "@/stores/quizSessionStore";
import { QuizTimer } from "@/components/quiz/QuizTimer";
import { QuizProgress } from "@/components/quiz/QuizProgress";
import { QuestionRenderer } from "@/components/quiz/QuestionRenderer";
import { QuizResults } from "@/components/quiz/QuizResults";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { ArrowLeft, ArrowRight, Target, Send } from "lucide-react";
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
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const store = useQuizSessionStore();

  useEffect(() => {
    if (!slug) return;
    const fetchQuiz = async () => {
      // Try slug first, then id
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
        setError("This quiz is not available");
        setLoading(false);
        return;
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

      const quizData: QuizData = {
        id: data.id,
        title: data.title,
        description: data.description,
        config: data.config,
        questions: parsedQuestions,
      };

      setQuiz(quizData);
      const timeLimitMinutes = (data.config as any)?.time_limit_minutes;
      store.initSession(
        parsedQuestions.length,
        timeLimitMinutes ? timeLimitMinutes * 60 : null
      );
      setLoading(false);
    };
    fetchQuiz();
  }, [slug]);

  const handleSubmit = useCallback(async () => {
    if (!quiz) return;
    store.submitQuiz();

    // Calculate score
    let earned = 0;
    let total = 0;
    quiz.questions.forEach((q, i) => {
      const pts = q.points || 1;
      total += pts;
      const userAnswer = store.answers[i];
      const correctAnswer = q.correct_answer;
      if (userAnswer !== null && String(userAnswer) === String(correctAnswer)) {
        earned += pts;
      }
    });

    const scorePercent = total > 0 ? Math.round((earned / total) * 100) : 0;
    const timeSpent = Math.round((Date.now() - store.startTime) / 1000);

    // Save session
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
  }, [quiz, store]);

  const handleTimerEnd = useCallback(() => {
    handleSubmit();
  }, [handleSubmit]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <LoadingSkeleton variant="text-block" />
        </div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <Target className="h-12 w-12 text-muted-foreground mx-auto" />
          <h2 className="font-display text-2xl font-bold">{error || "Quiz not found"}</h2>
          <Button onClick={() => navigate("/")}>Go Home</Button>
        </div>
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
      <header className="border-b border-border px-6 py-3 bg-background/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <h1
            className="font-display text-lg font-bold tracking-tight text-foreground cursor-pointer"
            onClick={() => navigate("/")}
          >
            QuizForge<span className="text-primary">AI</span>
          </h1>
          <div className="flex items-center gap-4">
            {store.timeRemaining !== null && (
              <QuizTimer timeRemaining={store.timeRemaining} onTimerEnd={handleTimerEnd} />
            )}
            <span className="text-sm text-muted-foreground">
              {store.currentQuestionIndex + 1} / {totalQuestions}
            </span>
          </div>
        </div>
      </header>

      {/* Progress */}
      <div className="max-w-3xl mx-auto w-full px-6 pt-4">
        <QuizProgress
          total={totalQuestions}
          current={store.currentQuestionIndex}
          answers={store.answers}
          onGoTo={(i) => store.goToQuestion(i)}
        />
      </div>

      {/* Question */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={store.currentQuestionIndex}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
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
      <footer className="border-t border-border px-6 py-4 bg-background/80 backdrop-blur-sm sticky bottom-0">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => store.prevQuestion()}
            disabled={store.currentQuestionIndex === 0}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Previous
          </Button>

          <span className="text-xs text-muted-foreground">
            {answeredCount} of {totalQuestions} answered
          </span>

          {isLastQuestion ? (
            <ConfirmDialog
              trigger={
                <Button className="gap-2">
                  <Send className="h-4 w-4" /> Submit Quiz
                </Button>
              }
              title="Submit Quiz?"
              description={`You've answered ${answeredCount} of ${totalQuestions} questions. ${
                answeredCount < totalQuestions ? "Some questions are unanswered." : ""
              } Are you sure you want to submit?`}
              confirmText="Submit"
              onConfirm={handleSubmit}
            />
          ) : (
            <Button onClick={() => store.nextQuestion(totalQuestions)} className="gap-2">
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}
