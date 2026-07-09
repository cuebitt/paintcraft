import { Component } from "preact";
import type { ComponentChildren, ComponentChild, ErrorInfo } from "preact";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: ComponentChildren;
  fallback?: ComponentChild;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error("[error-boundary]", error, errorInfo);
    }
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-8">
        <div className="max-w-md rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <h2 className="mb-2 text-lg font-semibold text-destructive">Something went wrong</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            {this.state.error?.message ?? "Unknown error"}
          </p>
          <Button onClick={() => this.setState({ hasError: false, error: null })} variant="default">
            Try again
          </Button>
        </div>
      </div>
    );
  }
}
