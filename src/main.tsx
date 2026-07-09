import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import UpdatePrompt from './components/UpdatePrompt';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
      <UpdatePrompt />
    </ErrorBoundary>
  </React.StrictMode>
);
