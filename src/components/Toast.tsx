'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: {
    success: (msg: string) => void;
    error: (msg: string) => void;
    warning: (msg: string) => void;
    info: (msg: string) => void;
  };
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => {
      if (prev.some((t) => t.message === message)) return prev;
      const updated = [...prev, { id, message, type }];
      if (updated.length > 3) return updated.slice(-3);
      return updated;
    });

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const toast = {
    success: (msg: string) => addToast(msg, 'success'),
    error: (msg: string) => addToast(msg, 'error'),
    warning: (msg: string) => addToast(msg, 'warning'),
    info: (msg: string) => addToast(msg, 'info'),
  };

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'warning': return '!';
      default: return 'i';
    }
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="toast-container" style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 18px', borderRadius: '10px', background: 'rgba(13,13,43,0.95)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', color: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', animation: 'slideIn 0.3s ease' }}>
            <span style={{ fontWeight: 800 }}>{getIcon(t.type)}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      toast: {
        success: (msg: string) => console.log('Success:', msg),
        error: (msg: string) => console.error('Error:', msg),
        warning: (msg: string) => console.warn('Warning:', msg),
        info: (msg: string) => console.info('Info:', msg),
      },
    };
  }
  return context;
}
