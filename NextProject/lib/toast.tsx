'use client';

export function showToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
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
    display: flex;
    align-items: center;
    gap: 8px;
  `;

  const iconSpan = document.createElement('span');
  iconSpan.textContent = type === 'success' ? '\u2713' : type === 'error' ? '\u2715' : '\u2139';

  const messageSpan = document.createElement('span');
  messageSpan.textContent = message;

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '\u00d7';
  closeBtn.addEventListener('click', () => toast.remove());
  closeBtn.style.cssText = `
    background: none;
    border: none;
    color: ${style.text};
    cursor: pointer;
    font-size: 18px;
    margin-left: 12px;
    opacity: 0.6;
  `;

  toast.appendChild(iconSpan);
  toast.appendChild(messageSpan);
  toast.appendChild(closeBtn);

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
