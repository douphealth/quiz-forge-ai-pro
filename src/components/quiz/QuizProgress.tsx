import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface QuizProgressProps {
  total: number;
  current: number;
  answers: (number | string | null)[];
  onGoTo: (index: number) => void;
}

export function QuizProgress({ total, current, answers, onGoTo }: QuizProgressProps) {
  const progressPercent = ((answers.filter((a) => a !== null).length) / total) * 100;

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      {/* Dot navigation */}
      <div className="flex gap-1.5 flex-wrap justify-center">
        {Array.from({ length: total }).map((_, i) => {
          const isAnswered = answers[i] !== null;
          const isCurrent = i === current;

          return (
            <button
              key={i}
              onClick={() => onGoTo(i)}
              className={cn(
                "h-3 w-3 rounded-full transition-all duration-200 hover:scale-125",
                isCurrent && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                isAnswered
                  ? "bg-primary"
                  : isCurrent
                    ? "bg-primary/40"
                    : "bg-muted-foreground/20"
              )}
              title={`Question ${i + 1}`}
            />
          );
        })}
      </div>
    </div>
  );
}
