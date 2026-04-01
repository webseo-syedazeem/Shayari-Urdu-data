import { Component, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

export default class AdminErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Admin page crashed:', error, errorInfo);
    this.setState({
      errorInfo: errorInfo.componentStack || 'No component stack available'
    });
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="flex-shrink-0">
                <AlertCircle className="text-red-600" size={32} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Page Crashed</h1>
                <p className="text-gray-600 mt-1">Something went wrong while loading this page.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-700 mb-2">Error Message:</h2>
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <p className="text-sm text-red-800 font-mono">
                    {this.state.error?.message || 'Unknown error'}
                  </p>
                </div>
              </div>

              {this.state.error?.stack && (
                <div>
                  <h2 className="text-sm font-semibold text-gray-700 mb-2">Stack Trace:</h2>
                  <div className="bg-gray-50 border border-gray-200 rounded p-3 max-h-64 overflow-auto">
                    <pre className="text-xs text-gray-700 font-mono whitespace-pre-wrap">
                      {this.state.error.stack}
                    </pre>
                  </div>
                </div>
              )}

              {this.state.errorInfo && (
                <div>
                  <h2 className="text-sm font-semibold text-gray-700 mb-2">Component Stack:</h2>
                  <div className="bg-gray-50 border border-gray-200 rounded p-3 max-h-64 overflow-auto">
                    <pre className="text-xs text-gray-700 font-mono whitespace-pre-wrap">
                      {this.state.errorInfo}
                    </pre>
                  </div>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={this.handleReload}
                  className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium"
                >
                  Reload Page
                </button>
                <button
                  onClick={() => window.history.back()}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
