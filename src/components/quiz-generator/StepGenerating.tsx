import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Brain, Lightbulb, CheckCircle2, Zap } from "lucide-react";
import { useQuizGenerationStore } from "@/stores/quizGenerationStore";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

const STATUS_STEPS = [
  { msg: "Analyzing content structure...", icon: Brain, duration: 4000 },
  { msg: "Identifying key concepts & themes...", icon: Lightbulb, duration: 5000 },
  { msg: "Crafting scenario-based questions...", icon: Sparkles, duration: 6000 },
  { msg: "Generating plausible answer options...", icon: Zap, duration: 5000 },
  { msg: "Writing detailed explanations...", icon: Lightbulb, duration: 5000 },
  { msg: "Polishing & quality-checking...", icon: CheckCircle2, duration: 4000 },
];

export function StepGenerating() {
  const store = useQuizGenerationStore();
  const { user } = useAuth();
  const started = useRef(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [progress, setProgress] = useState(5);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    let idx = 0;
    const statusInterval = setInterval(() => {
      idx = Math.min(idx + 1, STATUS_STEPS.length - 1);
      setStepIdx(idx);
    }, 4500);
    store.setField("generationStatus", STATUS_STEPS[0].msg);
    store.setField("generating", true);

    // Smooth progress animation
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 1.2, 88));
    }, 1000);

    const generate = async () => {
      try {
        const resolvedApiKey = store.provider === "openrouter"
          ? (store.openrouterApiKey || localStorage.getItem("quizforge_openrouter_api_key") || undefined)
          : undefined;

        const abortController = new AbortController();
        const clientTimeout = setTimeout(() => abortController.abort(), 100_000);

        let quizData: any;
        let quizError: any;
        try {
          const result = await supabase.functions.invoke("gemini-analyze", {
            body: {
              content: store.contentBody,
              title: store.contentTitle,
              provider: store.provider,
              model: store.model,
              openrouter_api_key: resolvedApiKey,
              numQuestions: store.numQuestions,
              difficulty: store.difficulty,
              questionTypes: store.questionTypes,
              language: store.language,
              focusTopics: store.focusTopics,
            },
          });
          quizData = result.data;
          quizError = result.error;
        } catch (fetchErr: any) {
          clearTimeout(clientTimeout);
          if (fetchErr.name === "AbortError") {
            throw new Error("Request timed out. Try a faster model like google/gemini-2.5-flash.");
          }
          throw fetchErr;
        }
        clearTimeout(clientTimeout);

        // Handle edge function errors
        if (quizError) {
          let errorMsg = "Quiz generation failed";
          try {
            if (typeof quizError === "object" && quizError.message) errorMsg = quizError.message;
            if (typeof (quizError as any)?.context?.json === "function") {
              const b = await (quizError as any).context.json();
              if (b?.error) errorMsg = b.error;
            }
          } catch {}
          if (errorMsg.includes("non-2xx")) {
            errorMsg = "Generation failed. The AI model may be unavailable. Try google/gemini-2.5-flash (Lovable AI).";
          }
          throw new Error(errorMsg);
        }
        if (quizData?.error) throw new Error(quizData.error);
        if (quizData?.warning) {
          toast({ title: "Note", description: quizData.warning });
        }

        setProgress(92);
        store.setField("generationStatus", "Saving quiz...");

        // Get user's org_id
        const { data: profile } = await supabase
          .from("profiles")
          .select("org_id")
          .eq("id", user!.id)
          .single();

        if (!profile?.org_id) throw new Error("No organization found. Please set up your org first.");

        setProgress(96);

        // Save quiz + questions
        const { data: savedQuiz, error: saveError } = await supabase.functions.invoke("save-quiz", {
          body: {
            title: quizData.title,
            description: quizData.description,
            questions: quizData.questions,
            source_urls: store.sourceUrl ? [store.sourceUrl] : [],
            created_by: user!.id,
            org_id: profile.org_id,
            model: store.model,
          },
        });
        if (saveError) throw saveError;
        if (savedQuiz?.error) throw new Error(savedQuiz.error);

        setProgress(100);
        store.setField("generatedQuiz", { ...savedQuiz, questions: quizData.questions });
        store.setField("generating", false);
        store.nextStep();
      } catch (err: any) {
        store.setField("generating", false);
        store.setField("error", err.message || "Generation failed");
        toast({ title: "Generation failed", description: err.message, variant: "destructive" });
      } finally {
        clearInterval(statusInterval);
        clearInterval(progressInterval);
      }
    };

    generate();
    return () => { clearInterval(statusInterval); clearInterval(progressInterval); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (store.error) {
    return (
      <div className="text-center py-16 space-y-6">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 mx-auto">
          <Sparkles className="h-8 w-8 text-destructive" />
        </div>
        <div className="space-y-2">
          <h3 className="font-display text-lg font-bold text-destructive">Generation Failed</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">{store.error}</p>
        </div>
        <button
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          onClick={() => { store.setField("error", null); store.prevStep(); }}
        >
          ← Go back and try again
        </button>
      </div>
    );
  }

  const CurrentIcon = STATUS_STEPS[stepIdx].icon;

  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-8">
      {/* Animated icon */}
      <div className="relative">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center"
        >
          <CurrentIcon className="h-10 w-10 text-primary" />
        </motion.div>
        {/* Orbiting dot */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0"
        >
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-3 w-3 rounded-full bg-primary shadow-lg shadow-primary/50" />
        </motion.div>
      </div>

      <div className="space-y-2 text-center max-w-sm">
        <h2 className="font-display text-2xl font-bold">Generating Your Quiz</h2>
        <AnimatePresence mode="wait">
          <motion.p
            key={stepIdx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="text-sm text-muted-foreground"
          >
            {STATUS_STEPS[stepIdx].msg}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Progress bar */}
      <div className="w-72 space-y-2">
        <div className="h-2.5 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>Analyzing</span>
          <span>{Math.round(progress)}%</span>
          <span>Complete</span>
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex gap-1.5">
        {STATUS_STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i <= stepIdx ? "w-6 bg-primary" : "w-1.5 bg-muted"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
