import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import Icon from './Icon.jsx';

const ToastContext = createContext(null);
let toastIdCounter = 0;

function normalizeToast(input) {
  if (typeof input === 'string') {
    return { message: input, tone: 'info', duration: 3600 };
  }
  const { message, tone = 'info', duration = 3600, id } = input || {};
  return { message: message || '', tone, duration, id };
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    const handle = timers.current.get(id);
    if (handle) {
      clearTimeout(handle);
      timers.current.delete(id);
    }
  }, []);

  const pushToast = useCallback((input) => {
    const normalized = normalizeToast(input);
    const id = normalized.id || `toast-${Date.now()}-${++toastIdCounter}`;
    const toast = { ...normalized, id };
    setToasts((prev) => [...prev, toast]);
    return id;
  }, []);

  useEffect(() => {
    toasts.forEach((toast) => {
      if (toast.duration === Infinity) return;
      if (timers.current.has(toast.id)) return;
      const handle = setTimeout(() => {
        timers.current.delete(toast.id);
        setToasts((prev) => prev.filter((item) => item.id !== toast.id));
      }, typeof toast.duration === 'number' ? toast.duration : 3600);
      timers.current.set(toast.id, handle);
    });
  }, [toasts]);

  useEffect(() => () => {
    timers.current.forEach((handle) => clearTimeout(handle));
    timers.current.clear();
  }, []);

  const value = useMemo(() => ({
    pushToast,
    dismissToast: dismiss
  }), [dismiss, pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-viewport" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => {
          const role = toast.tone === 'error' ? 'alert' : 'status';
          return (
            <div key={toast.id} className={`toast toast-${toast.tone}`} role={role}>
              <span>{toast.message}</span>
              <button
                type="button"
                className="toast-dismiss"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss notification"
              >
                <Icon name="close" size={12} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
