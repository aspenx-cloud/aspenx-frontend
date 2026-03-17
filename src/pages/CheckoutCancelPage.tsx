import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function CheckoutCancelPage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#f1f5f9', padding: '2rem', fontFamily: 'sans-serif' }}>
      <p style={{ color: '#fb923c', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '1rem' }}>
        CANCEL PAGE RENDERED
      </p>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Payment Not Completed</h1>
      <p style={{ marginBottom: '1.5rem', color: '#94a3b8' }}>
        No charge was made. You can return and try again whenever you are ready.
      </p>
      <button
        onClick={() => navigate('/')}
        style={{ padding: '0.6rem 1.4rem', background: '#0891b2', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', marginRight: '0.75rem' }}
      >
        Back to Home
      </button>
    </div>
  );
}
