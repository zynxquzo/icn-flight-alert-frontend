import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { initSentry } from './sentry.js';
import App from './App.jsx';

initSentry();

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);