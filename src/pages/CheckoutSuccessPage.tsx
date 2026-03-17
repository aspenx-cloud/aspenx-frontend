import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function CheckoutSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4 py-16 font-sans">
      {/* Ambient glow orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-cyan-600/5 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-xl">
        {/* Status badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Payment confirmed
          </div>
        </div>

        {/* Main card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm p-8 shadow-xl">
          {/* Icon */}
          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-center mb-2">
            Your AspenX order is confirmed
          </h1>
          <p className="text-slate-400 text-center text-sm mb-8 leading-relaxed">
            We received your payment and your environment is queued for provisioning.
            You'll receive a confirmation email shortly.
          </p>

          {/* What happens next */}
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">
              What happens next
            </p>
            <ol className="space-y-4">
              {[
                {
                  step: '01',
                  title: 'Order received',
                  desc: 'Your payment has been processed and your order details are recorded.',
                },
                {
                  step: '02',
                  title: 'Infrastructure provisioning',
                  desc: 'Our team begins setting up your tailored AWS environment based on your selected plan.',
                },
                {
                  step: '03',
                  title: 'Handoff & access',
                  desc: "You'll receive credentials and documentation to access your new environment.",
                },
              ].map(({ step, title, desc }) => (
                <li key={step} className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center">
                    {step}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{title}</p>
                    <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex-1 px-5 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-cyan-500 to-blue-600
                hover:from-cyan-400 hover:to-blue-500 text-white transition-all duration-200
                shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30
                focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              Back to Home
            </button>
            <button
              onClick={() => navigate('/builder')}
              className="flex-1 px-5 py-3 rounded-xl font-semibold text-sm border border-slate-700
                text-slate-300 hover:text-white hover:border-slate-500 hover:bg-slate-800/40
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              Build Another Stack
            </button>
          </div>
        </div>

        {/* Technical details */}
        {sessionId && (
          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/40 px-5 py-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-600 mb-1">
              Technical details
            </p>
            <p className="text-xs text-slate-500 font-mono break-all">
              session_id: {sessionId}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
