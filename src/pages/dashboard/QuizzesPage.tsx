import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuizzes } from "@/hooks/useQuizzes";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { FileText, Sparkles, Eye, Edit, Globe, GlobeLock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function QuizzesPage() {
  const { data: quizzes, isLoading } = useQuizzes();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="max-w-4xl space-y-6">
        <h1 className="font-display text-2xl font-bold">Quizzes</h1>
        <LoadingSkeleton variant="list-item" count={4} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Quizzes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {quizzes?.length || 0} quizzes total
          </p>
        </div>
        <Button onClick={() => navigate("/dashboard/generate")} className="gap-2">
          <Sparkles className="h-4 w-4" /> Generate New
        </Button>
      </div>

      {!quizzes || quizzes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No quizzes yet"
          description="Generate your first quiz to see it here."
          actionLabel="Generate Quiz"
          onAction={() => navigate("/dashboard/generate")}
        />
      ) : (
        <div className="space-y-3">
          {quizzes.map((quiz, i) => (
            <motion.div
              key={quiz.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card
                className="border-border/50 hover:border-primary/20 transition-all cursor-pointer group"
                onClick={() => navigate(`/dashboard/quizzes/${quiz.id}`)}
              >
                <CardContent className="py-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-semibold truncate">{quiz.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {quiz.created_at ? formatDistanceToNow(new Date(quiz.created_at), { addSuffix: true }) : ""}
                      {quiz.ai_model && ` · ${quiz.ai_model}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={quiz.status === "published" ? "default" : "secondary"} className="text-xs">
                      {quiz.status === "published" ? (
                        <><Globe className="h-3 w-3 mr-1" /> Published</>
                      ) : (
                        <><GlobeLock className="h-3 w-3 mr-1" /> Draft</>
                      )}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
