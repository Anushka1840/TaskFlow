'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

// Error boundaries must be class components — React doesn't support
// functional error boundaries yet. This catches any unhandled JS errors
// that occur inside any child component and shows a friendly fallback UI
// instead of a blank white screen.

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  // Called when a child component throws an error
  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message || 'An unexpected error occurred.',
    };
  }

  // Log the error for debugging
  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Component stack:', info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' });
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="card w-full max-w-md text-center">
            <div className="text-5xl mb-4">😕</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-500 text-sm mb-2">
              An unexpected error occurred in the application.
            </p>
            {/* Show error detail in development only */}
            {process.env.NODE_ENV === 'development' && (
              <p className="text-xs text-red-400 bg-red-50 rounded p-2 mb-4 text-left font-mono break-all">
                {this.state.errorMessage}
              </p>
            )}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => window.location.reload()}
                className="btn-secondary flex-1"
              >
                Reload Page
              </button>
              <button
                onClick={this.handleReset}
                className="btn-primary flex-1"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
