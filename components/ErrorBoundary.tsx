'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Home, Copy } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      // Could integrate with Sentry, LogRocket, etc.
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    // Clear any error in localStorage/sessionStorage
    try {
      localStorage.removeItem('app_error');
      sessionStorage.removeItem('app_error');
    } catch {
      // Storage not available
    }
  };

  private handleCopyError = () => {
    if (this.state.error) {
      navigator.clipboard.writeText(this.state.error.stack || this.state.error.message);
    }
  };

  public override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isDev = process.env.NODE_ENV === 'development';

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-red-50 dark:bg-red-950/20 rounded-lg">
          <div className="w-20 h-20 mx-auto mb-6 text-destructive">
            <AlertCircle className="w-full h-full" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            {this.state.error?.message || 'An unexpected error occurred. Please try again.'}
          </p>
          {isDev && this.state.error?.stack && (
            <details className="mb-4 text-left w-full max-w-md p-3 bg-muted/30 rounded text-xs">
              <summary className="cursor-pointer font-medium mb-2">Error details</summary>
              <pre className="whitespace-pre-wrap">{this.state.error.stack}</pre>
            </details>
          )}
          <div className="flex gap-3 flex-wrap">
            <Button onClick={this.handleReset} variant="default">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button onClick={() => window.location.href = '/'} variant="outline">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
            <Button onClick={this.handleCopyError} variant="ghost" size="sm">
              <Copy className="h-4 w-4 mr-2" />
              Copy Error
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}