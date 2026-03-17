import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function CheckoutSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#f1f5f9', padding: '2rem', fontFamily: 'sans-serif' }}>
      <p style={{ color: '#4ade80', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '1rem' }}>
        SUCCESS PAGE RENDERED
      </p>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Payment Confirmed</h1>
      <p style={{ marginBottom: '0.5rem', color: '#94a3b8' }}>
        Your order is confirmed. We received your payment.
      </p>
      <p style={{ marginBottom: '1.5rem', fontSize: '0.85rem', color: '#64748b', wordBreak: 'break-all' }}>
        session_id: {sessionId ?? '(none)'}
      </p>
      <pre style={{ fontSize: '0.8rem', color: '#94a3b8', background: '#1e293b', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
        href: {typeof window !== 'undefined' ? window.location.href : ''}
        pathname: {typeof window !== 'undefined' ? window.location.pathname : ''}
        hash: {typeof window !== 'undefined' ? window.location.hash : ''}
        search: {typeof window !== 'undefined' ? window.location.search : ''}
      </pre>
      <button
        onClick={() => navigate('/')}
        style={{ padding: '0.6rem 1.4rem', background: '#0891b2', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', marginRight: '0.75rem' }}
      >
        Back to Home
      </button>
      <button
        onClick={() => navigate('/builder')}
        style={{ padding: '0.6rem 1.4rem', background: 'transparent', color: '#94a3b8', border: '1px solid #334155', borderRadius: '8px', cursor: 'pointer' }}
      >
        Build Another Stack
      </button>
    </div>
  );
}
