'use client';

import { useRouter } from 'next/navigation';

export default function BackButton({ fallback = '/catalog' }: { fallback?: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) {
          router.back();
        } else {
          router.push(fallback);
        }
      }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: '0.9rem',
        fontWeight: 500,
        color: 'var(--text-secondary)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        marginBottom: 16,
        transition: 'color 0.2s',
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M15 18l-6-6 6-6" />
      </svg>
      <span>Назад</span>
    </button>
  );
}