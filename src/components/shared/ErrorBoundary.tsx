import React from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center gap-4 p-12 text-center">
            <AlertTriangle className="h-10 w-10 text-destructive" />
            <h3 className="font-display text-lg font-semibold">Something went wrong</h3>
            <p className="text-sm text-muted-foreground max-w-md">{this.state.error?.message}</p>
            <Button variant="outline" onClick={() => this.setState({ hasError: false })}>
              Try again
            </Button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
