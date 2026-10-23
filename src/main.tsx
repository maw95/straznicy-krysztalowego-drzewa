import { Component, StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './ui/App';
import { CardGallery } from './ui/CardGallery';
import { FigureGallery } from './ui/FigureGallery';
import { SvgDefs } from './ui/common';
import './ui/styles.css';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <pre style={{ color: '#f3d27a', padding: 24, whiteSpace: 'pre-wrap' }}>
        Błąd interfejsu: {this.state.error.message}
        {'\n'}
        {this.state.error.stack}
      </pre>
    );
  }
}

// The right button belongs to the game (details under it, as in Heroes): the browser's menu never opens.
// Text fields keep copying and pasting with Ctrl+C / Ctrl+V.
window.addEventListener('contextmenu', (e) => e.preventDefault());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      {new URLSearchParams(window.location.search).has('figury') ? (
        <FigureGallery />
      ) : new URLSearchParams(window.location.search).has('cards') ? (
        <>
          <SvgDefs />
          <CardGallery />
        </>
      ) : (
        <App />
      )}
    </ErrorBoundary>
  </StrictMode>,
);
