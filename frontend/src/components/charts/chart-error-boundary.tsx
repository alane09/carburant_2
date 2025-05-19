"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onRetry?: () => void;
  className?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

/**
 * ChartErrorBoundary component to catch and handle errors in chart components
 * This prevents individual chart errors from crashing the entire dashboard
 */
class ChartErrorBoundary extends Component<Props, State> {
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000; // 1 second

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      retryCount: 0
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error("Chart Error:", error, errorInfo);
    }
    
    // You can log the error to an error reporting service here
    // Example: Sentry.captureException(error);
  }

  private handleRetry = () => {
    if (this.state.retryCount < ChartErrorBoundary.MAX_RETRIES) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        retryCount: prevState.retryCount + 1
      }));

      // Call onRetry callback if provided
      if (this.props.onRetry) {
        setTimeout(() => {
          this.props.onRetry?.();
        }, ChartErrorBoundary.RETRY_DELAY);
      }
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI with retry button
      return this.props.fallback || (
        <div className={`flex h-[200px] w-full flex-col items-center justify-center gap-3 rounded-md border border-dashed p-4 ${this.props.className || ''}`}>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10">
            <AlertTriangle className="h-5 w-5 text-warning" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">Erreur d&apos;affichage du graphique</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {this.state.error?.message || "Une erreur est survenue lors du chargement du graphique"}
            </p>
            {this.state.retryCount < ChartErrorBoundary.MAX_RETRIES && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={this.handleRetry}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Réessayer
              </Button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ChartErrorBoundary;
