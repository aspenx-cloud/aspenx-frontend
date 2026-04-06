import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { loadRecentOrderId, clearRecentOrderId } from '../lib/storage';
import { fetchBackendOrder, type BackendOrder, type ProvisioningStatus } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

const PROV_LABELS: Record<ProvisioningStatus, string> = {
  not_started: 'Provisioning not started',
  queued:      'Queued for provisioning',
  in_progress: 'Provisioning in progress',
  completed:   'Provisioning completed',
  failed:      'Provisioning failed',
};

const PROV_STYLES: Record<ProvisioningStatus, string> = {
  not_started: 'text-slate-400 bg-slate-700/30 border-slate-700',
  queued:      'text-amber-400 bg-amber-400/10 border-amber-400/20',
  in_progress: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  completed:   'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  failed:      'text-rose-400 bg-rose-400/10 border-rose-400/20',
};

export default function CheckoutSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const sessionId = searchParams.get('session_id');

  const [order, setOrder] = useState<BackendOrder | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);

  useEffect(() => {
    const orderId = loadRecentOrderId();
    if (!orderId) return;

    let cancelled = false;
    setOrderLoading(true);

    const load = async () => {
      try {
        const idToken = user ? await user.getIdToken() : undefined;
        const result = await fetchBackendOrder(orderId, idToken);
        if (!cancelled) {
          setOrder(result);
          // Clear so it doesn't persist across future sessions
          if (result) clearRecentOrderId();
        }
      } catch {
        // Degrade gracefully — success UI still shows
      } finally {
        if (!cancelled) setOrderLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [user]);

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
            A confirmation email has been sent to your registered address.
          </p>

          {/* Real order status (when available) */}
          {(orderLoading || order) && (
            <div className="mb-6 rounded-xl border border-slate-800 bg-slate-800/30 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
                Order status
              </p>
              {orderLoading && (
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <span className="w-4 h-4 rounded-full border-2 border-slate-500 border-t-slate-300 animate-spin flex-shrink-0" />
                  Fetching order details…
                </div>
              )}
              {order && (
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border text-emerald-400 bg-emerald-400/10 border-emerald-400/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {order.status === 'paid' ? 'Paid' : order.status}
                  </span>
                  {order.provisioningStatus && (
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${PROV_STYLES[order.provisioningStatus]}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {PROV_LABELS[order.provisioningStatus]}
                    </span>
                  )}
                  {!order.provisioningStatus && (
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${PROV_STYLES.not_started}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {PROV_LABELS.not_started}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

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
                  desc: 'Your payment has been processed and your order details are recorded. A confirmation email has been sent.',
                },
                {
                  step: '02',
                  title: 'Operator provisioning',
                  desc: 'Our team reviews and sets up your AWS environment. This is a manual, operator-assisted process — typically completed within 24 hours.',
                },
                {
                  step: '03',
                  title: 'Handoff & access',
                  desc: "You'll receive an email when your environment is ready, along with credentials and documentation.",
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
        {(sessionId || order?.orderId) && (
          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/40 px-5 py-3 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-600 mb-1">
              Technical details
            </p>
            {order?.orderId && (
              <p className="text-xs text-slate-500 font-mono break-all">
                order_id: {order.orderId}
              </p>
            )}
            {sessionId && (
              <p className="text-xs text-slate-500 font-mono break-all">
                session_id: {sessionId}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
