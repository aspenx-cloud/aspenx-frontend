import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function CheckoutCancelPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />

      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-amber-500/5 blur-3xl" />
      </div>

      <main className="relative pt-32 pb-24 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">

        {/* Icon + heading */}
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>

          <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-500 mb-3">
            Checkout canceled
          </p>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Payment{' '}
            <span className="text-slate-400">not completed.</span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed max-w-md">
            No charge was made. Your cart is still intact — you can go back and try again whenever you're ready.
          </p>
        </div>

        {/* Info card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 mb-8">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-4">
            What you should know
          </p>
          <ul className="space-y-3 text-sm text-slate-400">
            {[
              'No payment was collected — your card was not charged.',
              'Your stack configuration has been preserved in the builder.',
              'You can return to pricing and restart the checkout at any time.',
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full bg-slate-700 flex items-center justify-center">
                  <span className="block w-1.5 h-1.5 rounded-full bg-slate-400" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate('/#pricing')}
            className="flex-1 px-6 py-3 rounded-xl font-semibold text-sm
              bg-gradient-to-r from-cyan-500 to-blue-600
              hover:from-cyan-400 hover:to-blue-500
              text-white transition-all shadow-lg shadow-cyan-500/20
              hover:shadow-cyan-500/30 glow-cyan-sm
              focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            Back to Pricing
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex-1 px-6 py-3 rounded-xl font-semibold text-sm
              border border-slate-700 text-slate-300
              hover:text-white hover:border-slate-500 hover:bg-slate-800/40
              transition-all
              focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            Return Home
          </button>
        </div>
      </main>
    </div>
  );
}
