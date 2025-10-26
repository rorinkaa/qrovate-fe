import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { ToastProvider } from './components/ui/ToastProvider.jsx';
import './styles.css';
import './mobile-styles.css';
import './styles-glass.css';

createRoot(document.getElementById('root')).render(
  <ToastProvider>
    <App />
  </ToastProvider>
);
