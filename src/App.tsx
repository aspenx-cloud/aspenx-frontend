import React from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import BuilderPage from './pages/BuilderPage';
import AccountPage from './pages/AccountPage';
import CheckoutPage from './pages/CheckoutPage';
import CheckoutSuccessPage from './pages/CheckoutSuccessPage';
import CheckoutCancelPage from './pages/CheckoutCancelPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import RefundPolicyPage from './pages/RefundPolicyPage';
import SupportPage from './pages/SupportPage';

function NotFoundPage() {
  const location = useLocation();
  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace', background: '#0f172a', color: '#f1f5f9', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '3rem', color: '#f87171', marginBottom: '1rem' }}>ROUTE NOT FOUND</h1>
      <pre style={{ fontSize: '1rem', background: '#1e293b', padding: '1.5rem', borderRadius: '8px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
        href:     {typeof window !== 'undefined' ? window.location.href : ''}
        pathname: {location.pathname}
        hash:     {typeof window !== 'undefined' ? window.location.hash : ''}
        search:   {location.search}
      </pre>
    </div>
  );
}

// Catches render errors so the app shows a message instead of a blank page.
// React 18 unmounts the entire tree on uncaught render errors with no
// ErrorBoundary, leaving only the body background visible.
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4">
          <div className="max-w-md text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-red-500 mb-3">
              Something went wrong
            </p>
            <h1 className="text-2xl font-bold mb-4">Page failed to load</h1>
            <p className="text-slate-400 text-sm mb-6">
              {this.state.error.message || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={() => { this.setState({ error: null }); window.location.hash = '/'; }}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold hover:from-cyan-400 hover:to-blue-500 transition-all"
            >
              Return Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/builder" element={<BuilderPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
            <Route path="/checkout/cancel" element={<CheckoutCancelPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsOfServicePage />} />
            <Route path="/refund-policy" element={<RefundPolicyPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </HashRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
