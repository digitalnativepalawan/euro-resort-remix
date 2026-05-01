import { Component, ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-navy-texture flex flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="font-display text-xl text-foreground tracking-wider">Something went wrong</p>
          <p className="font-body text-sm text-muted-foreground max-w-sm">{this.state.message}</p>
          <button
            className="mt-2 px-6 py-2 rounded border border-accent text-accent font-display text-sm tracking-wider hover:bg-accent/10 transition-colors"
            onClick={() => window.location.reload()}
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
