import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Eye, Edit, Share2, RotateCcw, PartyPopper } from "lucide-react";
import { useQuizGenerationStore } from "@/stores/quizGenerationStore";

export function StepResults() {
  const store = useQuizGenerationStore();
  const navigate = useNavigate();
  const quiz = store.generatedQuiz;

  if (!quiz) return null;

  const questions = quiz.questions || [];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center space-y-3"
      >
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
          <PartyPopper className="h-8 w-8 text-emerald-500" />
        </div>
        <h2 className="font-display text-2xl font-bold">Quiz Generated!</h2>
        <p className="text-muted-foreground">
          <strong>{quiz.title}</strong> — {quiz.questionCount || questions.length} questions created
        </p>
      </motion.div>

      {/* Question preview */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
        {questions.map((q: any, i: number) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="border-border/50">
              <CardContent className="py-3 flex items-start gap-3">
                <span className="shrink-0 h-7 w-7 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-sm font-medium">{q.question_text || q.question}</p>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-xs">{q.difficulty || "medium"}</Badge>
                    <Badge variant="outline" className="text-xs">{q.question_type || "multiple_choice"}</Badge>
                  </div>
                </div>
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-1" />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 justify-center pt-2">
        <Button onClick={() => navigate(`/quiz/${quiz.id}`)} className="gap-2">
          <Eye className="h-4 w-4" /> Preview Quiz
        </Button>
        <Button variant="outline" onClick={() => navigate(`/dashboard/quizzes`)} className="gap-2">
          <Edit className="h-4 w-4" /> View All Quizzes
        </Button>
        <Button variant="outline" onClick={() => store.reset()} className="gap-2">
          <RotateCcw className="h-4 w-4" /> Generate Another
        </Button>
      </div>
    </div>
  );
}
