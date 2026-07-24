'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      textAlign: 'center',
      padding: '40px',
      fontFamily: 'Inter, sans-serif',
    }}>
      <h1 style={{ fontSize: '32px', margin: 0, color: '#c62828' }}>Ошибка</h1>
      <p style={{ fontSize: '16px', color: '#666', marginTop: '12px', maxWidth: '500px' }}>
        Что-то пошло не так. Попробуйте обновить страницу.
      </p>
      <button
        onClick={() => reset()}
        style={{
          marginTop: '24px',
          padding: '12px 24px',
          background: '#111',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
        }}
      >
        Попробовать снова
      </button>
    </div>
  );
}
