import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus, CheckCircle2, XCircle, Wifi } from "lucide-react";
import { useConnections } from "@/hooks/useConnections";
import { toast } from "@/hooks/use-toast";

export function ConnectionForm() {
  const [open, setOpen] = useState(false);
  const [siteUrl, setSiteUrl] = useState("");
  const [siteName, setSiteName] = useState("");
  const [authType, setAuthType] = useState("none");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<boolean | null>(null);
  const { createConnection, testConnection } = useConnections();

  const handleTest = async () => {
    if (!siteUrl.trim()) return;
    setTesting(true);
    setTestResult(null);
    const result = await testConnection(siteUrl.trim());
    setTestResult(result);
    setTesting(false);
    if (result) {
      toast({ title: "Connection successful!", description: "WordPress REST API is accessible." });
    } else {
      toast({ title: "Connection failed", description: "Could not reach the WordPress REST API.", variant: "destructive" });
    }
  };

  const handleSubmit = () => {
    if (!siteUrl.trim() || !siteName.trim()) return;
    createConnection.mutate(
      { site_url: siteUrl.trim(), site_name: siteName.trim(), auth_type: authType },
      {
        onSuccess: () => {
          setOpen(false);
          setSiteUrl("");
          setSiteName("");
          setAuthType("none");
          setTestResult(null);
        },
      }
    );
  };

  const handleUrlBlur = () => {
    if (siteUrl && !siteName) {
      try {
        const url = new URL(siteUrl);
        setSiteName(url.hostname.replace("www.", ""));
      } catch {}
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2"><Plus className="h-4 w-4" /> Add Connection</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Add WordPress Connection</DialogTitle>
          <DialogDescription>Connect a WordPress site to browse and generate quizzes from its content.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="site-url">Site URL</Label>
            <div className="flex gap-2">
              <Input
                id="site-url"
                placeholder="https://example.com"
                value={siteUrl}
                onChange={(e) => { setSiteUrl(e.target.value); setTestResult(null); }}
                onBlur={handleUrlBlur}
              />
              <Button type="button" variant="outline" size="icon" onClick={handleTest} disabled={testing || !siteUrl.trim()} title="Test connection">
                {testing ? <Loader2 className="h-4 w-4 animate-spin" /> :
                  testResult === true ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> :
                  testResult === false ? <XCircle className="h-4 w-4 text-destructive" /> :
                  <Wifi className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="site-name">Site Name</Label>
            <Input id="site-name" placeholder="My WordPress Blog" value={siteName} onChange={(e) => setSiteName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Auth Type</Label>
            <Select value={authType} onValueChange={setAuthType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (Public API)</SelectItem>
                <SelectItem value="basic">Basic Auth</SelectItem>
                <SelectItem value="application_password">Application Password</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={createConnection.isPending || !siteUrl.trim() || !siteName.trim()} className="gap-2">
            {createConnection.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Add Connection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
