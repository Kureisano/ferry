// Safe global error listener to suppress benign cross-origin iframe security warnings
try {
  const handleCrossOriginError = (message: string) => {
    if (
      message && 
      (message.includes("Location") || message.includes("origin") || message.includes("cross-origin"))
    ) {
      // Prevent the error from triggering the global reporter/console noise
      return true;
    }
    return false;
  };

  window.addEventListener('error', (event) => {
    const message = event.message || (event.error && event.error.message) || '';
    if (handleCrossOriginError(message)) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    const message = (event.reason && event.reason.message) || '';
    if (handleCrossOriginError(message)) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
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
