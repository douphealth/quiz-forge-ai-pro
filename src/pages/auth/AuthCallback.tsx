import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertTriangle, Mail } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type CallbackState = "processing" | "error";

const ERROR_MESSAGES: Record<string, { title: string; description: string }> = {
  access_denied: {
    title: "Sign-in cancelled",
    description: "You cancelled the Google sign-in. No worries — you can try again or use email and password.",
  },
  server_error: {
    title: "Authentication error",
    description: "Google sign-in encountered a server error. This usually means the OAuth provider isn't configured correctly. Please try email and password instead.",
  },
  temporarily_unavailable: {
    title: "Service temporarily unavailable",
    description: "The authentication service is temporarily unavailable. Please try again in a moment.",
  },
  invalid_request: {
    title: "Invalid request",
    description: "The sign-in request was invalid. This can happen if the link expired. Please try signing in again.",
  },
  timeout: {
    title: "Sign-in timed out",
    description: "The authentication took too long to complete. Please check your internet connection and try again.",
  },
  default: {
    title: "Sign-in failed",
    description: "Something went wrong during authentication. Please try again or use email and password.",
  },
};

function getErrorFromParams(searchParams: URLSearchParams, hash: string): string | null {
  // Check URL search params
  const error = searchParams.get("error");
  if (error) return error;

  // Check hash fragment (Supabase sometimes puts errors here)
  if (hash) {
    const hashParams = new URLSearchParams(hash.replace("#", ""));
    const hashError = hashParams.get("error");
    if (hashError) return hashError;
    const errorDescription = hashParams.get("error_description");
    if (errorDescription) return "server_error";
  }

  return null;
}

function getErrorDescription(searchParams: URLSearchParams, hash: string): string | null {
  const desc = searchParams.get("error_description");
  if (desc) return desc;

  if (hash) {
    const hashParams = new URLSearchParams(hash.replace("#", ""));
    return hashParams.get("error_description");
  }
  return null;
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<CallbackState>("processing");
  const [errorInfo, setErrorInfo] = useState(ERROR_MESSAGES.default);
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const hash = window.location.hash;

    // 1. Check for OAuth errors in URL
    const errorCode = getErrorFromParams(searchParams, hash);
    if (errorCode) {
      const customDesc = getErrorDescription(searchParams, hash);
      const mapped = ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.default;
      setErrorInfo({
        title: mapped.title,
        description: customDesc || mapped.description,
      });
      setState("error");
      return;
    }

    // 2. Listen for auth state change + set timeout
    const timeoutId = setTimeout(() => {
      setErrorInfo(ERROR_MESSAGES.timeout);
      setState("error");
    }, 15_000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        clearTimeout(timeoutId);
        navigate("/dashboard", { replace: true });
      }
    });

    // 3. Also check if already signed in (race condition)
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        clearTimeout(timeoutId);
        setErrorInfo({
          title: "Session error",
          description: error.message || ERROR_MESSAGES.default.description,
        });
        setState("error");
        return;
      }
      if (session) {
        clearTimeout(timeoutId);
        navigate("/dashboard", { replace: true });
      }
    });

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [navigate, searchParams]);

  if (state === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-border/50">
          <CardHeader className="text-center space-y-3">
            <div className="mx-auto h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="font-display text-xl">{errorInfo.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center">{errorInfo.description}</p>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button asChild className="w-full gap-2">
              <Link to="/auth/login">
                <Mail className="h-4 w-4" />
                Sign in with email
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <Link to="/auth/login">Try Google again</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Completing sign-in…</p>
    </div>
  );
}
