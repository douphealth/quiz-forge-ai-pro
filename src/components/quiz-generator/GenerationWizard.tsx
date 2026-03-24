import { useQuizGenerationStore } from "@/stores/quizGenerationStore";
import { StepSelectSource } from "./StepSelectSource";
import { StepConfigureQuiz } from "./StepConfigureQuiz";
import { StepReviewContent } from "./StepReviewContent";
import { StepGenerating } from "./StepGenerating";
import { StepResults } from "./StepResults";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { label: "Source", component: StepSelectSource },
  { label: "Configure", component: StepConfigureQuiz },
  { label: "Review", component: StepReviewContent },
  { label: "Generate", component: StepGenerating },
  { label: "Results", component: StepResults },
];

export function GenerationWizard() {
  const { currentStep } = useQuizGenerationStore();
  const StepComponent = STEPS[currentStep].component;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Progress indicator */}
      <div className="flex items-center gap-1">
        {STEPS.map((step, i) => (
          <div key={step.label} className="flex items-center flex-1 last:flex-initial">
            <div className="flex items-center gap-2">
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all shrink-0",
                i < currentStep
                  ? "bg-primary text-primary-foreground"
                  : i === currentStep
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                    : "bg-muted text-muted-foreground"
              )}>
                {i < currentStep ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <span className={cn(
                "text-sm hidden sm:inline whitespace-nowrap",
                i <= currentStep ? "text-foreground font-medium" : "text-muted-foreground"
              )}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn(
                "h-0.5 flex-1 mx-3 rounded-full transition-colors",
                i < currentStep ? "bg-primary" : "bg-muted"
              )} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <StepComponent />
    </div>
  );
}
