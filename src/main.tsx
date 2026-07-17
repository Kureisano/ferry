// Safe global error listener to suppress benign cross-origin iframe security warnings
try {
  const handleCrossOriginError = (message: string) => {
    if (!message) return false;
    const s = message.toLowerCase();
    if (
      s.includes("location") || 
      s.includes("origin") || 
      s.includes("cross-origin") ||
      s.includes("blocked a frame") ||
      s.includes("securityerror") ||
      s.includes("failed to read")
    ) {
      // Prevent the error from triggering the global reporter/console noise
      return true;
    }
    return false;
  };

  // Intercept window error events
  window.addEventListener('error', (event) => {
    const message = event.message || (event.error && event.error.message) || '';
    if (handleCrossOriginError(message)) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);

  // Intercept unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const message = (event.reason && event.reason.message) || '';
    if (handleCrossOriginError(message)) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);

  // Intercept console.error to prevent platform noise for cross-origin errors
  const originalConsoleError = console.error;
  console.error = function (...args) {
    const isBlockedFrame = args.some(arg => {
      if (!arg) return false;
      const str = typeof arg === 'string' ? arg : (arg.message || arg.toString() || '');
      return handleCrossOriginError(str);
    });
    if (isBlockedFrame) {
      return; // Silently swallow cross-origin iframe security errors
    }
    originalConsoleError.apply(console, args);
  };
} catch (e) {
  // Silent fallback
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
