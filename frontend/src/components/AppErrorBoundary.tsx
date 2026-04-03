import { Component, ErrorInfo, ReactNode } from 'react';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false,
    errorMessage: '',
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'Unexpected application error.',
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Keep details in console for debugging while showing a friendly fallback in UI.
    console.error('Application runtime error', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="mx-auto mt-16 max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900 shadow">
        <h1 className="text-xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-sm">{this.state.errorMessage}</p>
        <button
          type="button"
          onClick={this.handleReload}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          Reload page
        </button>
      </div>
    );
  }
}
