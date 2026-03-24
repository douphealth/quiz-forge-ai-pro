import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useQuiz, useUpdateQuiz, useDeleteQuiz, usePublishQuiz } from "@/hooks/useQuizzes";
import { useDebounce } from "@/hooks/useDebounce";
import { QuestionEditor } from "@/components/quiz/QuestionEditor";
import { QuizSettingsPanel } from "@/components/quiz/QuizSettingsPanel";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import {
  Trash2, Globe, GlobeLock, Save, Check, Loader2,
  ArrowLeft, Eye, BarChart3, Settings, Edit,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function QuizDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: quiz, isLoading, error } = useQuiz(id);
  const updateQuiz = useUpdateQuiz();
  const deleteQuiz = useDeleteQuiz();
  const publishQuiz = usePublishQuiz();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const debouncedTitle = useDebounce(title, 1000);
  const debouncedDesc = useDebounce(description, 1000);
  const initialized = useRef(false);

  useEffect(() => {
    if (quiz && !initialized.current) {
      setTitle(quiz.title);
      setDescription(quiz.description || "");
      initialized.current = true;
    }
  }, [quiz]);

  useEffect(() => {
    if (!initialized.current || !id) return;
    if (debouncedTitle === quiz?.title && debouncedDesc === (quiz?.description || "")) return;
    setSaveStatus("saving");
    updateQuiz.mutate(
      { id, title: debouncedTitle, description: debouncedDesc || null },
      { onSuccess: () => setSaveStatus("saved"), onError: () => setSaveStatus("unsaved") }
    );
  }, [debouncedTitle, debouncedDesc]);

  const handleDelete = () => {
    if (!id) return;
    deleteQuiz.mutate(id, { onSuccess: () => navigate("/dashboard/quizzes") });
  };

  const handlePublishToggle = () => {
    if (!id || !quiz) return;
    if (quiz.status === "published") {
      updateQuiz.mutate({ id, status: "draft", visibility: "private", published_at: null });
    } else {
      publishQuiz.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl space-y-6">
        <LoadingSkeleton variant="text-block" />
        <LoadingSkeleton variant="list-item" count={5} />
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="max-w-4xl text-center py-16">
        <p className="text-muted-foreground">Quiz not found</p>
        <Button variant="outline" onClick={() => navigate("/dashboard/quizzes")} className="mt-4">
          Back to Quizzes
        </Button>
      </div>
    );
  }

  const isPublished = quiz.status === "published";

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/quizzes")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <input
              value={title}
              onChange={(e) => { setTitle(e.target.value); setSaveStatus("unsaved"); }}
              className="font-display text-2xl font-bold bg-transparent border-none outline-none flex-1 min-w-0 focus:ring-0"
              placeholder="Quiz title..."
            />
            <Badge variant={isPublished ? "default" : "secondary"}>
              {isPublished ? "Published" : "Draft"}
            </Badge>
          </div>
          <div className="flex items-center gap-2 pl-11">
            <span className="text-xs text-muted-foreground">
              {saveStatus === "saving" && <><Loader2 className="inline h-3 w-3 animate-spin mr-1" />Saving...</>}
              {saveStatus === "saved" && <><Check className="inline h-3 w-3 text-success mr-1" />Saved</>}
              {saveStatus === "unsaved" && "Unsaved changes"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" onClick={handlePublishToggle} className="gap-2" size="sm">
            {isPublished ? <GlobeLock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
            {isPublished ? "Unpublish" : "Publish"}
          </Button>
          <ConfirmDialog
            trigger={<Button variant="outline" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>}
            title="Delete Quiz?"
            description="This will permanently delete the quiz and all its questions."
            confirmText="Delete"
            onConfirm={handleDelete}
            variant="destructive"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="edit">
        <TabsList>
          <TabsTrigger value="edit" className="gap-2"><Edit className="h-4 w-4" /> Edit</TabsTrigger>
          <TabsTrigger value="preview" className="gap-2"><Eye className="h-4 w-4" /> Preview</TabsTrigger>
          <TabsTrigger value="settings" className="gap-2"><Settings className="h-4 w-4" /> Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="space-y-4 mt-4">
          <Textarea
            value={description}
            onChange={(e) => { setDescription(e.target.value); setSaveStatus("unsaved"); }}
            placeholder="Quiz description (optional)..."
            className="resize-none text-sm"
            rows={2}
          />

          <div className="space-y-3">
            {(quiz.questions || []).map((q: any, i: number) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <QuestionEditor
                  question={q}
                  index={i}
                  quizId={quiz.id}
                />
              </motion.div>
            ))}
          </div>

          {(!quiz.questions || quiz.questions.length === 0) && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No questions yet. Generate some or add manually.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="preview" className="mt-4">
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Eye className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
              <p>Preview your quiz by clicking the link below:</p>
              <Button
                variant="outline"
                className="mt-3"
                onClick={() => window.open(`/quiz/${quiz.slug || quiz.id}`, "_blank")}
              >
                Open Quiz Preview
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <QuizSettingsPanel quizId={quiz.id} config={quiz.config} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
