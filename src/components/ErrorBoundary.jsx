import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
                    <h1 className="text-2xl font-bold text-red-500 mb-4">Something went wrong</h1>
                    <p className="text-slate-400 mb-6 max-w-md">
                        The application encountered a critical error.
                    </p>
                    <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 text-left overflow-auto max-w-full mb-6">
                        <p className="font-mono text-red-400 text-xs break-all">
                            {this.state.error && this.state.error.toString()}
                        </p>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 bg-blue-600 rounded-lg font-semibold hover:bg-blue-500 transition-colors"
                    >
                        Reload Application
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
