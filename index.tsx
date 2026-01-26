
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log('Zippy App Starting...');

// Register Service Worker for PWA and Notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('SW registered: ', registration);
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("CRITICAL: Could not find root element to mount to");
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log('Zippy App Mounted Successfully');
} catch (error) {
  console.error("CRITICAL: React Mount Error", error);
  rootElement.innerHTML = `<div style="padding: 20px; color: red; font-family: sans-serif;">
    <h1>Error de Inicio</h1>
    <p>La aplicación no pudo iniciarse correctamente.</p>
    <pre>${error instanceof Error ? error.message : JSON.stringify(error)}</pre>
  </div>`;
}
