'use client';

import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}

export default function Toast({ message, type = 'success', onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: { bg: '#e8f5e9', border: '#2e7d32', text: '#2e7d32' },
    error: { bg: '#ffebee', border: '#c62828', text: '#c62828' },
    info: { bg: '#e3f2fd', border: '#1976d2', text: '#1976d2' },
  };

  const style = colors[type];

  return (
    <div
      style={{
        position: 'fixed',
        top: '24px',
        right: '24px',
        zIndex: 9999,
        padding: '16px 24px',
        background: style.bg,
        border: `1px solid ${style.border}`,
        borderRadius: '8px',
        color: style.text,
        fontSize: '14px',
        fontWeight: 500,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        transform: isVisible ? 'translateX(0)' : 'translateX(400px)',
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        maxWidth: '400px',
      }}
    >
      <span>{type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
      <span>{message}</span>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        style={{
          background: 'none',
          border: 'none',
          color: style.text,
          cursor: 'pointer',
          fontSize: '18px',
          padding: '0 0 0 8px',
          opacity: 0.6,
        }}
      >
        ×
      </button>
    </div>
  );
}