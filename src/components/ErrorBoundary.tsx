import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif', color: '#333' }}>
          <h1>Algo deu errado.</h1>
          <p>Por favor, tire um print desta tela e envie para o suporte.</p>
          <details style={{ whiteSpace: 'pre-wrap', marginTop: '10px', padding: '10px', background: '#f5f5f5', borderRadius: '5px' }}>
            <summary>Detalhes do erro</summary>
            <p style={{ color: 'red', fontWeight: 'bold' }}>{this.state.error && this.state.error.toString()}</p>
            <p style={{ fontSize: '0.8em' }}>{this.state.errorInfo && this.state.errorInfo.componentStack}</p>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
