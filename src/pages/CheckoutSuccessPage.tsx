import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function CheckoutSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />

      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-emerald-500/5 blur-3xl" />
      </div>

      <main className="relative pt-32 pb-24 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">

        {/* Icon + heading */}
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-6 glow-emerald">
            <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>

          <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-500 mb-3">
            Payment confirmed
          </p>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Your order is{' '}
            <span className="text-gradient">confirmed.</span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed max-w-md">
            We received your payment. AspenX will now queue your infrastructure order for processing.
          </p>
        </div>

        {/* What happens next */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 mb-6">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-5">
            What happens next
          </p>
          <ol className="space-y-5">
            {[
              {
                step: '1',
                title: 'Payment received',
                body: 'Your payment has been captured and your order has been created in our system.',
                color: 'text-emerald-400',
                bg: 'bg-emerald-400/10 border-emerald-400/20',
              },
              {
                step: '2',
                title: 'Order queued for processing',
                body: 'Our team reviews your selected stack and prepares the deployment configuration.',
                color: 'text-cyan-400',
                bg: 'bg-cyan-400/10 border-cyan-400/20',
              },
              {
                step: '3',
                title: 'Next steps coming your way',
                body: "We'll reach out with a kick-off guide and any follow-up details needed to get started.",
                color: 'text-blue-400',
                bg: 'bg-blue-400/10 border-blue-400/20',
              },
            ].map(({ step, title, body, color, bg }) => (
              <li key={step} className="flex gap-4">
                <span className={`mt-0.5 flex-shrink-0 w-7 h-7 rounded-full border flex items-center justify-center text-xs font-bold ${color} ${bg}`}>
                  {step}
                </span>
                <div>
                  <p className={`font-semibold text-sm mb-0.5 ${color}`}>{title}</p>
                  <p className="text-slate-400 text-sm leading-relaxed">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Technical details */}
        {sessionId && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 px-5 py-4 mb-8">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-2">
              Session reference
            </p>
            <p className="text-slate-500 text-xs font-mono break-all">{sessionId}</p>
          </div>
        )}

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex-1 px-6 py-3 rounded-xl font-semibold text-sm
              bg-gradient-to-r from-cyan-500 to-blue-600
              hover:from-cyan-400 hover:to-blue-500
              text-white transition-all shadow-lg shadow-cyan-500/20
              hover:shadow-cyan-500/30 glow-cyan-sm
              focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            Back to Home
          </button>
          <button
            onClick={() => navigate('/builder')}
            className="flex-1 px-6 py-3 rounded-xl font-semibold text-sm
              border border-slate-700 text-slate-300
              hover:text-white hover:border-slate-500 hover:bg-slate-800/40
              transition-all
              focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            Build Another Stack
          </button>
        </div>
      </main>
    </div>
  );
}
