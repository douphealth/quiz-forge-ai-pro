import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const GOOGLE_LOGO = (
  <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

export function GoogleSignInButton() {
  const [loading, setLoading] = useState(false);

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        // Provider not enabled or misconfigured
        if (error.message?.toLowerCase().includes("provider")) {
          toast({
            title: "Google sign-in unavailable",
            description: "Google authentication is not configured. Please use email and password instead.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Google sign-in failed",
            description: error.message || "Something went wrong. Please try email and password instead.",
            variant: "destructive",
          });
        }
        setLoading(false);
      }
      // If no error, the browser will redirect to Google — don't setLoading(false)
    } catch (err: any) {
      toast({
        title: "Connection error",
        description: "Could not connect to authentication service. Check your internet connection and try again, or use email and password.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full gap-3 bg-white hover:bg-gray-50 text-gray-700 border-gray-300 hover:border-gray-400 font-medium shadow-sm transition-colors"
      onClick={handleGoogleAuth}
      disabled={loading}
    >
      {loading ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : GOOGLE_LOGO}
      Continue with Google
    </Button>
  );
}
