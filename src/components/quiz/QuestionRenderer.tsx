import { memo } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface QuestionProps {
  question: {
    question_text: string;
    question_type: string;
    options: string[];
    difficulty: string | null;
    points: number | null;
    bloom_taxonomy_level?: string | null;
  };
  questionIndex: number;
  selectedAnswer: number | string | null;
  onSelectAnswer: (answer: number | string) => void;
}

const difficultyColors: Record<string, string> = {
  easy: "bg-success/10 text-success border-success/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  hard: "bg-destructive/10 text-destructive border-destructive/20",
  expert: "bg-primary/10 text-primary border-primary/20",
};

export const QuestionRenderer = memo(function QuestionRenderer({
  question,
  questionIndex,
  selectedAnswer,
  onSelectAnswer,
}: QuestionProps) {
  const { question_text, question_type, options, difficulty, points, bloom_taxonomy_level } = question;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Meta */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
        <Badge variant="outline" className={cn("text-[10px] sm:text-xs", difficultyColors[difficulty || "medium"])}>
          {difficulty || "medium"}
        </Badge>
        <Badge variant="outline" className="text-[10px] sm:text-xs">
          {points || 1} pt{(points || 1) > 1 ? "s" : ""}
        </Badge>
        {bloom_taxonomy_level && (
          <Badge variant="secondary" className="text-[10px] sm:text-xs hidden sm:inline-flex">
            {bloom_taxonomy_level}
          </Badge>
        )}
        <span className="text-[10px] sm:text-xs text-muted-foreground ml-auto font-medium">Q{questionIndex + 1}</span>
      </div>

      {/* Question text */}
      <h2 className="font-display text-lg sm:text-xl md:text-2xl font-semibold text-foreground leading-relaxed">
        {question_text}
      </h2>

      {/* Answer options */}
      {(question_type === "multiple_choice" || question_type === "multiple-choice") && (
        <div className="space-y-2 sm:space-y-3">
          {options.map((opt, i) => {
            const isSelected = selectedAnswer === i;
            return (
              <motion.button
                key={i}
                onClick={() => onSelectAnswer(i)}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "w-full text-left px-3.5 py-3 sm:px-5 sm:py-4 rounded-xl border-2 transition-all duration-200",
                  "hover:border-primary/40 hover:bg-primary/5 active:scale-[0.99]",
                  isSelected
                    ? "border-primary bg-primary/10 shadow-sm"
                    : "border-border bg-card"
                )}
              >
                <div className="flex items-start gap-2.5 sm:gap-3">
                  <span
                    className={cn(
                      "shrink-0 h-6 w-6 sm:h-7 sm:w-7 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold border-2 transition-colors",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/30 text-muted-foreground"
                    )}
                  >
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className={cn(
                    "text-sm sm:text-base leading-relaxed",
                    isSelected ? "text-foreground font-medium" : "text-foreground/80"
                  )}>
                    {opt}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      {(question_type === "true_false" || question_type === "true-false") && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {["True", "False"].map((opt, i) => {
            const isSelected = selectedAnswer === i;
            return (
              <motion.button
                key={opt}
                onClick={() => onSelectAnswer(i)}
                whileTap={{ scale: 0.97 }}
                className={cn(
                  "px-4 py-6 sm:px-6 sm:py-8 rounded-xl border-2 text-center font-display text-base sm:text-lg font-semibold transition-all active:scale-[0.98]",
                  isSelected
                    ? "border-primary bg-primary/10 shadow-sm"
                    : "border-border bg-card hover:border-primary/40"
                )}
              >
                {opt}
              </motion.button>
            );
          })}
        </div>
      )}

      {question_type === "fill_blank" && (
        <input
          type="text"
          value={(selectedAnswer as string) || ""}
          onChange={(e) => onSelectAnswer(e.target.value)}
          placeholder="Type your answer..."
          className="w-full px-3.5 py-3 sm:px-4 sm:py-3 rounded-xl border-2 border-border bg-card focus:border-primary focus:outline-none text-sm sm:text-base transition-colors"
        />
      )}

      {question_type === "short_answer" && (
        <textarea
          value={(selectedAnswer as string) || ""}
          onChange={(e) => onSelectAnswer(e.target.value)}
          placeholder="Write your answer..."
          rows={4}
          className="w-full px-3.5 py-3 sm:px-4 sm:py-3 rounded-xl border-2 border-border bg-card focus:border-primary focus:outline-none text-sm sm:text-base transition-colors resize-none"
        />
      )}
    </div>
  );
});
