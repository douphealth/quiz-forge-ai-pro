import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import type { Quiz, QuizQuestion } from "@/types/quiz";

const HistoryPage = () => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuizzes = async () => {
      const { data } = await supabase
        .from("quizzes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (data) {
        setQuizzes(data.map(q => ({
          ...q,
          questions: q.questions as unknown as QuizQuestion[],
        })));
      }
      setLoading(false);
    };
    fetchQuizzes();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border px-6 py-4">
        <div className="container flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="font-display text-xl font-bold tracking-tight text-foreground">
            Quiz History
          </h1>
        </div>
      </header>

      <main className="container max-w-3xl py-8 px-6 space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-1/2 mt-2" /></CardContent></Card>
          ))
        ) : quizzes.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <p className="text-muted-foreground text-lg">No quizzes yet</p>
            <Button onClick={() => navigate("/")}>Create your first quiz</Button>
          </div>
        ) : (
          quizzes.map((quiz, i) => (
            <motion.div
              key={quiz.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card
                className="cursor-pointer hover:border-primary/30 transition-colors"
                onClick={() => navigate(`/quiz/${quiz.id}`)}
              >
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-display font-semibold text-foreground">{quiz.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {quiz.questions.length} questions · {new Date(quiz.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </main>
    </div>
  );
};

export default HistoryPage;
