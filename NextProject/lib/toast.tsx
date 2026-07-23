'use client';

export function showToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
  // Создаем элемент уведомления
  const toast = document.createElement('div');
  
  const colors = {
    success: { bg: '#e8f5e9', border: '#2e7d32', text: '#2e7d32' },
    error: { bg: '#ffebee', border: '#c62828', text: '#c62828' },
    info: { bg: '#e3f2fd', border: '#1976d2', text: '#1976d2' },
  };

  const style = colors[type];

  toast.style.cssText = `
    position: fixed;
    top: 24px;
    right: 24px;
    z-index: 9999;
    padding: 16px 24px;
    background: ${style.bg};
    border: 1px solid ${style.border};
    border-radius: 8px;
    color: ${style.text};
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    max-width: 400px;
    animation: slideIn 0.3s ease;
  `;

  toast.innerHTML = `
    <span>${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
    <span>${message}</span>
    <button onclick="this.parentElement.remove()" style="
      background: none;
      border: none;
      color: ${style.text};
      cursor: pointer;
      font-size: 18px;
      margin-left: 12px;
      opacity: 0.6;
    ">×</button>
  `;

  document.body.appendChild(toast);

  // Автозакрытие через 3 секунды
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}