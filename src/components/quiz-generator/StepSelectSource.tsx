import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Globe, FileText, ClipboardPaste, Loader2, CheckCircle2 } from "lucide-react";
import { useQuizGenerationStore } from "@/stores/quizGenerationStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export function StepSelectSource() {
  const { sourceType, sourceUrl, pastedContent, contentTitle, contentBody, setField, nextStep } = useQuizGenerationStore();
  const [fetching, setFetching] = useState(false);

  const handleFetchUrl = async () => {
    if (!sourceUrl.trim()) return;
    setFetching(true);
    try {
      const { data, error } = await supabase.functions.invoke("wordpress-proxy", {
        body: { url: sourceUrl.trim() },
      });
      if (error) throw error;
      setField("contentTitle", data.title);
      setField("contentBody", data.content);
      toast({ title: "Content fetched!", description: `"${data.title}" loaded successfully.` });
    } catch (err: any) {
      toast({ title: "Failed to fetch content", description: err.message, variant: "destructive" });
    } finally {
      setFetching(false);
    }
  };

  const canProceed = contentBody.trim().length > 50;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold">Select Content Source</h2>
        <p className="text-sm text-muted-foreground mt-1">Choose where to get the content for your quiz.</p>
      </div>

      <Tabs value={sourceType} onValueChange={(v) => setField("sourceType", v as any)}>
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="url" className="gap-2"><Globe className="h-4 w-4" /> URL</TabsTrigger>
          <TabsTrigger value="paste" className="gap-2"><ClipboardPaste className="h-4 w-4" /> Paste</TabsTrigger>
        </TabsList>

        <TabsContent value="url" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>WordPress Article URL</Label>
            <div className="flex gap-2">
              <Input
                placeholder="https://example.com/my-article"
                value={sourceUrl}
                onChange={(e) => setField("sourceUrl", e.target.value)}
              />
              <Button onClick={handleFetchUrl} disabled={fetching || !sourceUrl.trim()} variant="secondary" className="gap-2 shrink-0">
                {fetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                Fetch
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="paste" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Content Title</Label>
            <Input
              placeholder="Article title"
              value={contentTitle}
              onChange={(e) => setField("contentTitle", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Content</Label>
            <Textarea
              placeholder="Paste your article content here..."
              value={sourceType === "paste" ? pastedContent : contentBody}
              onChange={(e) => {
                setField("pastedContent", e.target.value);
                setField("contentBody", e.target.value);
              }}
              className="min-h-[200px]"
            />
          </div>
        </TabsContent>
      </Tabs>

      {contentBody && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted text-sm">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
          <span>
            <strong>{contentTitle || "Untitled"}</strong> — {contentBody.length.toLocaleString()} characters loaded
          </span>
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={nextStep} disabled={!canProceed}>
          Continue
        </Button>
      </div>
    </div>
  );
}
