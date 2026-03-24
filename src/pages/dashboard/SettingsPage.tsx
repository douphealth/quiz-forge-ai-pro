import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Key, Eye, EyeOff, Save, Check } from "lucide-react";
import { toast } from "sonner";

const STORAGE_KEY = "quizforge_openrouter_api_key";

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setApiKey(stored);
  }, []);

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem(STORAGE_KEY, apiKey.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    setSaved(true);
    toast.success(apiKey.trim() ? "API key saved" : "API key removed");
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = () => {
    setApiKey("");
    localStorage.removeItem(STORAGE_KEY);
    toast.success("API key removed");
  };

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-bold mb-6">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Key className="h-5 w-5 text-primary" />
            OpenRouter API Key
          </CardTitle>
          <CardDescription>
            Save your OpenRouter API key here so it's automatically used when generating quizzes with OpenRouter models. Your key is stored locally in your browser and never sent to our servers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <div className="relative">
              <Input
                id="api-key"
                type={showKey ? "text" : "password"}
                placeholder="sk-or-v1-..."
                value={apiKey}
                onChange={(e) => { setApiKey(e.target.value); setSaved(false); }}
                className="pr-10 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Get your key at{" "}
              <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                openrouter.ai/keys
              </a>
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} className="gap-2">
              {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              {saved ? "Saved" : "Save"}
            </Button>
            {apiKey && (
              <Button variant="outline" onClick={handleClear}>Clear</Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
