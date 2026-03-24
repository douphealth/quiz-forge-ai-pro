import { useState, useCallback, memo, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useDebounce } from "@/hooks/useDebounce";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Trash2, GripVertical } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface QuestionEditorProps {
  question: any;
  index: number;
  quizId: string;
}

const difficultyOptions = [
  { value: "easy", label: "Easy", color: "bg-success/10 text-success" },
  { value: "medium", label: "Medium", color: "bg-warning/10 text-warning" },
  { value: "hard", label: "Hard", color: "bg-destructive/10 text-destructive" },
  { value: "expert", label: "Expert", color: "bg-primary/10 text-primary" },
];

export const QuestionEditor = memo(function QuestionEditor({
  question,
  index,
  quizId,
}: QuestionEditorProps) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState(question.question_text);
  const [explanation, setExplanation] = useState(question.explanation || "");
  const [difficulty, setDifficulty] = useState(question.difficulty || "medium");
  const [points, setPoints] = useState(question.points || 1);
  const [options, setOptions] = useState<string[]>(
    Array.isArray(question.options) ? (question.options as string[]) : []
  );
  const [correctAnswer, setCorrectAnswer] = useState(question.correct_answer || "0");

  const debouncedText = useDebounce(text, 1000);
  const debouncedExplanation = useDebounce(explanation, 1000);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      return;
    }

    const update = async () => {
      await supabase
        .from("questions")
        .update({
          question_text: debouncedText,
          explanation: debouncedExplanation || null,
          difficulty,
          points,
          options: options as any,
          correct_answer: correctAnswer,
        })
        .eq("id", question.id);
    };
    update();
  }, [debouncedText, debouncedExplanation, difficulty, points, correctAnswer]);

  const handleOptionChange = (i: number, value: string) => {
    const newOpts = [...options];
    newOpts[i] = value;
    setOptions(newOpts);
  };

  const handleAddOption = () => setOptions([...options, ""]);

  const handleRemoveOption = (i: number) => {
    if (options.length <= 2) return;
    const newOpts = options.filter((_, idx) => idx !== i);
    setOptions(newOpts);
    if (Number(correctAnswer) >= newOpts.length) {
      setCorrectAnswer(String(newOpts.length - 1));
    }
  };

  const handleDelete = async () => {
    await supabase.from("questions").delete().eq("id", question.id);
    queryClient.invalidateQueries({ queryKey: ["quiz", quizId] });
    toast({ title: "Question deleted" });
  };

  const truncated = text.length > 80 ? text.slice(0, 80) + "..." : text;

  return (
    <Card className="border-border/60 hover:border-border transition-colors">
      <CardContent className="py-3">
        {/* Collapsed view */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-3 text-left"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
          <span className="text-xs font-semibold text-muted-foreground shrink-0 w-6">{index + 1}</span>
          <span className="flex-1 text-sm font-medium truncate">{truncated}</span>
          <Badge variant="secondary" className="text-xs shrink-0">{question.question_type}</Badge>
          <Badge variant="outline" className={cn("text-xs shrink-0", difficultyOptions.find(d => d.value === difficulty)?.color)}>
            {difficulty}
          </Badge>
          <span className="text-xs text-muted-foreground shrink-0">{points} pts</span>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>

        {/* Expanded view */}
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-4 space-y-4 pl-10"
          >
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Question Text</label>
              <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} className="text-sm" />
            </div>

            {/* Options (for multiple choice) */}
            {(question.question_type === "multiple_choice" || question.question_type === "multiple-choice") && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Options</label>
                {options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${question.id}`}
                      checked={String(i) === correctAnswer}
                      onChange={() => setCorrectAnswer(String(i))}
                      className="accent-primary"
                    />
                    <Input
                      value={opt}
                      onChange={(e) => handleOptionChange(i, e.target.value)}
                      className="text-sm flex-1"
                      placeholder={`Option ${String.fromCharCode(65 + i)}`}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveOption(i)}
                      disabled={options.length <= 2}
                    >
                      ×
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={handleAddOption}>
                  + Add Option
                </Button>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Explanation</label>
              <Textarea value={explanation} onChange={(e) => setExplanation(e.target.value)} rows={2} className="text-sm" placeholder="Why is this the correct answer?" />
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Difficulty</label>
                <div className="flex gap-1">
                  {difficultyOptions.map((d) => (
                    <Button
                      key={d.value}
                      variant={difficulty === d.value ? "default" : "outline"}
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => setDifficulty(d.value)}
                    >
                      {d.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Points</label>
                <Input
                  type="number"
                  value={points}
                  onChange={(e) => setPoints(Number(e.target.value) || 1)}
                  className="w-20 h-7 text-sm"
                  min={1}
                  max={10}
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <ConfirmDialog
                trigger={
                  <Button variant="ghost" size="sm" className="text-destructive gap-2">
                    <Trash2 className="h-4 w-4" /> Delete Question
                  </Button>
                }
                title="Delete this question?"
                description="This action cannot be undone."
                confirmText="Delete"
                onConfirm={handleDelete}
                variant="destructive"
              />
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
});
