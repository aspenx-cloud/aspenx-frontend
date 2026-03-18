import React from 'react';
import { useNavigate } from 'react-router-dom';
import { loadBuilderState } from '../lib/storage';

export default function CheckoutCancelPage() {
  const navigate = useNavigate();
  const saved = loadBuilderState();
  const savedTier = saved?.tier;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4 py-16 font-sans">
      {/* Ambient glow orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-amber-500/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-slate-700/10 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Status badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Checkout not completed
          </div>
        </div>

        {/* Main card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm p-8 shadow-xl">
          {/* Icon */}
          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-center mb-2">
            Payment not completed
          </h1>
          <p className="text-slate-400 text-center text-sm mb-8 leading-relaxed">
            Your checkout was canceled. No charge was made to your account.
            You can return and try again whenever you're ready.
          </p>

          {/* Reassurance block */}
          <div className="rounded-xl border border-slate-800 bg-slate-800/30 px-5 py-4 mb-8">
            <ul className="space-y-2 text-sm text-slate-400">
              {[
                'No payment was processed',
                'Your session has expired safely',
                'You can restart checkout at any time',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-amber-500/70 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() =>
                savedTier
                  ? navigate(`/builder?tier=${savedTier}`)
                  : navigate('/builder')
              }
              className="flex-1 px-5 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-cyan-500 to-blue-600
                hover:from-cyan-400 hover:to-blue-500 text-white transition-all duration-200
                shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30
                focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              Back to Builder
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 px-5 py-3 rounded-xl font-semibold text-sm border border-slate-700
                text-slate-300 hover:text-white hover:border-slate-500 hover:bg-slate-800/40
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
