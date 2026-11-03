import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { failed: boolean };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Urban Life Co. render error', error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main
        role="alert"
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeContent: 'center',
          gap: '16px',
          padding: '32px',
          textAlign: 'center',
          background: '#171a16',
          color: '#f5f3ef',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '1.6rem' }}>
          Something went wrong on our side.
        </h1>
        <p style={{ margin: 0, opacity: 0.8 }}>
          Please reload. If it keeps happening, message us and we will fix it.
        </p>
        <button
          onClick={() =>
            window.location.assign(
              window.location.pathname + window.location.search
            )
          }
          style={{
            justifySelf: 'center',
            padding: '12px 22px',
            border: 0,
            borderRadius: '999px',
            background: '#f5f3ef',
            color: '#171a16',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Reload
        </button>
      </main>
    );
  }
}
