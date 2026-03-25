import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface QuizProgressProps {
  total: number;
  current: number;
  answers: (number | string | null)[];
  onGoTo: (index: number) => void;
}

export function QuizProgress({ total, current, answers, onGoTo }: QuizProgressProps) {
  const progressPercent = ((answers.filter((a) => a !== null).length) / total) * 100;

  return (
    <div className="space-y-2 sm:space-y-3">
      {/* Progress bar */}
      <div className="h-1.5 sm:h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      {/* Dot navigation - scrollable on mobile */}
      <ScrollArea className="w-full">
        <div className="flex gap-1 sm:gap-1.5 justify-center py-1 min-w-max px-2">
          {Array.from({ length: total }).map((_, i) => {
            const isAnswered = answers[i] !== null;
            const isCurrent = i === current;

            return (
              <button
                key={i}
                onClick={() => onGoTo(i)}
                className={cn(
                  "h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full transition-all duration-200 hover:scale-125 shrink-0",
                  "touch-manipulation",
                  isCurrent && "ring-2 ring-primary ring-offset-1 sm:ring-offset-2 ring-offset-background",
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
        <ScrollBar orientation="horizontal" className="h-1" />
      </ScrollArea>
    </div>
  );
}
