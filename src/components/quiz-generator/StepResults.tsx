import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2, Eye, Edit, RotateCcw, PartyPopper, Code, Download, Copy, Check, FileCode2, Loader2,
} from "lucide-react";
import { useQuizGenerationStore } from "@/stores/quizGenerationStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export function StepResults() {
  const store = useQuizGenerationStore();
  const navigate = useNavigate();
  const quiz = store.generatedQuiz;
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [embedHtml, setEmbedHtml] = useState<string | null>(null);
  const [showEmbed, setShowEmbed] = useState(false);

  if (!quiz) return null;

  const questions = quiz.questions || [];

  const handleExport = async (action: "copy" | "download") => {
    setExporting(true);
    try {
      // Build quiz_data from store if it's a preview, or use quiz_id
      const body = quiz.id?.startsWith("preview-")
        ? {
            quiz_data: {
              title: quiz.title,
              description: quiz.description || "",
              questions: questions.map((q: any) => ({
                question_text: q.question_text || q.question,
                question_type: q.question_type || "multiple_choice",
                options: q.options || [],
                correct_answer: String(q.correct_answer ?? q.correctAnswer ?? 0),
                explanation: q.explanation || "",
                difficulty: q.difficulty || "medium",
                points: q.points || 1,
                bloom_taxonomy_level: q.bloom_level || q.bloom_taxonomy_level || "",
              })),
            },
          }
        : { quiz_id: quiz.id };

      const { data, error } = await supabase.functions.invoke("export-quiz-html", { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const html = data.html;

      if (action === "copy") {
        await navigator.clipboard.writeText(html);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
        toast({ title: "HTML copied!", description: "Paste it into your WordPress page or any website." });
      } else {
        const blob = new Blob([html], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${(quiz.title || "quiz").replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}.html`;
        a.click();
        URL.revokeObjectURL(url);
        toast({ title: "Downloaded!", description: "Open the HTML file in any browser or upload to your website." });
      }

      setEmbedHtml(html);
    } catch (err: any) {
      toast({ title: "Export failed", description: err.message, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center space-y-3"
      >
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
          <PartyPopper className="h-8 w-8 text-emerald-500" />
        </div>
        <h2 className="font-display text-2xl font-bold">Quiz Generated!</h2>
        <p className="text-muted-foreground">
          <strong>{quiz.title}</strong> — {questions.length} questions created
        </p>
      </motion.div>

      {/* Export actions - prominent */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl border-2 border-primary/20 bg-primary/5 p-5 space-y-3"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <FileCode2 className="h-4 w-4" />
          Export as Embeddable HTML
        </div>
        <p className="text-xs text-muted-foreground">
          Get a standalone HTML file you can paste directly into WordPress, Wix, Squarespace, or any website. Works with dark mode, mobile, and all browsers.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => handleExport("copy")}
            disabled={exporting}
            variant="default"
            size="sm"
            className="gap-2"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy HTML"}
          </Button>
          <Button
            onClick={() => handleExport("download")}
            disabled={exporting}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Download .html
          </Button>
          {embedHtml && (
            <Button
              onClick={() => setShowEmbed(!showEmbed)}
              variant="ghost"
              size="sm"
              className="gap-2"
            >
              <Code className="h-4 w-4" />
              {showEmbed ? "Hide Code" : "View Code"}
            </Button>
          )}
        </div>
        {showEmbed && embedHtml && (
          <div className="mt-3 max-h-48 overflow-auto rounded-lg bg-background border border-border p-3">
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-all font-mono">
              {embedHtml.slice(0, 2000)}...
            </pre>
          </div>
        )}
      </motion.div>

      {/* Question preview */}
      <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
        {questions.map((q: any, i: number) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <Card className="border-border/50">
              <CardContent className="py-3 flex items-start gap-3">
                <span className="shrink-0 h-7 w-7 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-sm font-medium">{q.question_text || q.question}</p>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-xs">{q.difficulty || "medium"}</Badge>
                    <Badge variant="outline" className="text-xs">{q.question_type || "multiple_choice"}</Badge>
                    {q.bloom_level && <Badge variant="outline" className="text-xs">{q.bloom_level}</Badge>}
                    <Badge variant="outline" className="text-xs">{q.points || 1} pts</Badge>
                  </div>
                </div>
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-1" />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Navigation actions */}
      <div className="flex flex-wrap gap-3 justify-center pt-2">
        <Button onClick={() => navigate(`/quiz/${quiz.id}`)} className="gap-2">
          <Eye className="h-4 w-4" /> Preview Quiz
        </Button>
        <Button variant="outline" onClick={() => navigate(`/dashboard/quizzes`)} className="gap-2">
          <Edit className="h-4 w-4" /> View All Quizzes
        </Button>
        <Button variant="outline" onClick={() => store.reset()} className="gap-2">
          <RotateCcw className="h-4 w-4" /> Generate Another
        </Button>
      </div>
    </div>
  );
}
