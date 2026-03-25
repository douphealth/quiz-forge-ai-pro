import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useQuizSessionStore } from "@/stores/quizSessionStore";
import { Clock } from "lucide-react";

interface QuizTimerProps {
  timeRemaining: number;
  onTimerEnd: () => void;
}

export function QuizTimer({ timeRemaining, onTimerEnd }: QuizTimerProps) {
  const tick = useQuizSessionStore((s) => s.tick);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      const ended = tick();
      if (ended) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        onTimerEnd();
      }
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [tick, onTimerEnd]);

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const isLow = timeRemaining < 60;
  const isCritical = timeRemaining < 30;

  return (
    <div
      className={cn(
        "flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-mono font-semibold px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg transition-colors",
        isCritical
          ? "bg-destructive/10 text-destructive animate-pulse"
          : isLow
            ? "bg-warning/10 text-warning"
            : "bg-muted text-muted-foreground"
      )}
    >
      <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
      {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
    </div>
  );
}
