import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Button from './Button';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[EcoPlate Shield Caught Error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/analysis';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-zinc-900 border border-red-500/30 rounded-2xl p-8 shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
              <AlertTriangle size={32} />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-white">Interface Render Safeguard</h2>
              <p className="text-sm text-zinc-400">
                EcoPlate intercepted an unexpected UI exception. Your model weights and backend pipelines are secure.
              </p>
            </div>

            {this.state.error && (
              <div className="text-left bg-zinc-950 p-4 rounded-xl border border-zinc-800 font-mono text-xs text-red-400 overflow-x-auto max-h-32">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex gap-3 justify-center pt-2">
              <Button onClick={this.handleReset} className="px-6 py-2.5 text-xs font-mono font-bold flex items-center gap-2">
                <RefreshCw size={14} /> Restart Analysis
              </Button>
              <Button onClick={() => { window.location.href = '/'; }} variant="outline" className="px-6 py-2.5 text-xs font-mono">
                <Home size={14} /> Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
