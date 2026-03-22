import React from 'react';
import { Link } from 'react-router-dom';
import { PolicyFooter } from './PrivacyPolicyPage';

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Top nav */}
      <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/favicon.svg" alt="AspenX" className="w-7 h-7" />
            <span className="font-bold text-white tracking-tight">AspenX.cloud</span>
          </Link>
          <Link to="/" className="text-sm text-slate-400 hover:text-white transition-colors">
            ← Back to Home
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <p className="text-xs font-semibold uppercase tracking-widest text-cyan-500 mb-2">Help</p>
        <h1 className="text-4xl font-extrabold text-white mb-4">Contact &amp; Support</h1>
        <p className="text-slate-400 text-base mb-12">
          We're here to help with orders, billing, technical questions, and anything else related to your AspenX service.
        </p>

        <div className="space-y-8 text-slate-300">

          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-7">
            <h2 className="text-lg font-bold text-white mb-1">General support &amp; orders</h2>
            <p className="text-sm text-slate-400 mb-4">
              For order status, provisioning updates, account questions, or any general inquiries:
            </p>
            <a
              href="mailto:support@aspenx.cloud"
              className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-semibold text-base transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              support@aspenx.cloud
            </a>
            <p className="text-xs text-slate-500 mt-3">We aim to respond within 1–2 business days.</p>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-7">
            <h2 className="text-lg font-bold text-white mb-1">Billing &amp; refund requests</h2>
            <p className="text-sm text-slate-400 mb-4">
              For billing questions, invoice requests, or refund/cancellation requests, email us with your
              order ID and registered email address. See our{' '}
              <Link to="/refund-policy" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">
                Refund &amp; Cancellation Policy
              </Link>{' '}
              for details.
            </p>
            <a
              href="mailto:support@aspenx.cloud"
              className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-semibold text-base transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              support@aspenx.cloud
            </a>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-7">
            <h2 className="text-lg font-bold text-white mb-1">Pre-sales &amp; scoping questions</h2>
            <p className="text-sm text-slate-400 mb-4">
              Not sure which tier is right for your stack? Have a custom requirement? Use our contact form
              or email us directly.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600
                hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-semibold transition-all"
            >
              Open contact form
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-7">
            <h2 className="text-lg font-bold text-white mb-3">Privacy &amp; legal</h2>
            <ul className="text-sm space-y-2">
              <li>
                Privacy inquiries:{' '}
                <a href="mailto:privacy@aspenx.cloud" className="text-cyan-400 hover:text-cyan-300">
                  privacy@aspenx.cloud
                </a>
              </li>
              <li>
                Legal questions:{' '}
                <a href="mailto:legal@aspenx.cloud" className="text-cyan-400 hover:text-cyan-300">
                  legal@aspenx.cloud
                </a>
              </li>
            </ul>
          </section>

        </div>
      </main>

      <PolicyFooter />
    </div>
  );
}
