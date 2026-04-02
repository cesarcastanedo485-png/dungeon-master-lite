import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <Card className="max-w-md">
            <CardHeader>
              <h1 className="text-xl font-semibold text-destructive">
                Something went wrong
              </h1>
              <p className="text-sm text-muted-foreground">
                The app encountered an error. Try refreshing the page.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <pre className="max-h-40 overflow-auto rounded bg-muted p-3 text-xs whitespace-pre-wrap break-words">
                {this.state.error.message}
              </pre>
              <Button
                onClick={() => this.setState({ hasError: false, error: null })}
              >
                Try again
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Reload page
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
    return this.props.children;
  }
}
