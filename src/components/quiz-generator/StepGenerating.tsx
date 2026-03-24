import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useQuizGenerationStore } from "@/stores/quizGenerationStore";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

const STATUS_MESSAGES = [
  "Analyzing content structure...",
  "Identifying key concepts...",
  "Crafting questions...",
  "Generating answer options...",
  "Writing explanations...",
  "Polishing your quiz...",
];

export function StepGenerating() {
  const store = useQuizGenerationStore();
  const { user } = useAuth();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    let statusIdx = 0;
    const statusInterval = setInterval(() => {
      statusIdx = (statusIdx + 1) % STATUS_MESSAGES.length;
      store.setField("generationStatus", STATUS_MESSAGES[statusIdx]);
    }, 3000);
    store.setField("generationStatus", STATUS_MESSAGES[0]);
    store.setField("generating", true);

    const generate = async () => {
      try {
        // 1. Generate quiz via AI
        const { data: quizData, error: quizError } = await supabase.functions.invoke("gemini-analyze", {
          body: {
            content: store.contentBody,
            title: store.contentTitle,
            provider: store.provider,
            model: store.model,
            numQuestions: store.numQuestions,
            difficulty: store.difficulty,
            questionTypes: store.questionTypes,
            language: store.language,
            focusTopics: store.focusTopics,
          },
        });
        if (quizError) {
          const message = quizError.message || "Quiz generation failed";
          const details = typeof quizError.context === "string" ? quizError.context : "";
          throw new Error(details || message);
        }
        if (quizData?.error) throw new Error(quizData.error);
        if (quizData?.warning) {
          toast({ title: "Model adjusted", description: quizData.warning });
        }

        store.setField("generationStatus", "Saving quiz...");

        // 2. Get user's org_id
        const { data: profile } = await supabase
          .from("profiles")
          .select("org_id")
          .eq("id", user!.id)
          .single();

        if (!profile?.org_id) throw new Error("No organization found. Please set up your org first.");

        // 3. Save quiz + questions
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

        store.setField("generatedQuiz", { ...savedQuiz, questions: quizData.questions });
        store.setField("generating", false);
        store.nextStep();
      } catch (err: any) {
        store.setField("generating", false);
        store.setField("error", err.message || "Generation failed");
        toast({ title: "Generation failed", description: err.message, variant: "destructive" });
      } finally {
        clearInterval(statusInterval);
      }
    };

    generate();
    return () => clearInterval(statusInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (store.error) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-destructive font-medium">{store.error}</p>
        <button className="text-primary hover:underline text-sm" onClick={() => { store.setField("error", null); store.prevStep(); }}>
          Go back and try again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-8">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center"
      >
        <Sparkles className="h-10 w-10 text-primary" />
      </motion.div>

      <div className="space-y-2 text-center">
        <h2 className="font-display text-2xl font-bold">Generating Your Quiz</h2>
        <AnimatePresence mode="wait">
          <motion.p
            key={store.generationStatus}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="text-muted-foreground"
          >
            {store.generationStatus}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="w-64">
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: "5%" }}
            animate={{ width: "90%" }}
            transition={{ duration: 25, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
}
