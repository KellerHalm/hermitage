import Link from 'next/link';

export default function NotFound() {
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
      <h1 style={{ fontSize: '72px', margin: 0, color: '#111' }}>404</h1>
      <p style={{ fontSize: '18px', color: '#666', marginTop: '16px' }}>Страница не найдена</p>
      <Link href="/" style={{
        marginTop: '32px',
        padding: '12px 24px',
        background: '#111',
        color: '#fff',
        borderRadius: '8px',
        textDecoration: 'none',
        fontSize: '14px',
      }}>
        На главную
      </Link>
    </div>
  );
}
