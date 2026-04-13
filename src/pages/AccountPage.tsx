import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import { loadOrders, deleteOrder, saveBuilderState, type Order } from '../lib/storage';
import { RECIPE_ITEMS_BY_ID } from '../lib/mappings';
import { formatUSD } from '../lib/pricing';
import { fetchBackendOrders, downloadBootstrapTemplate, verifyBootstrap, type BackendOrder, type ProvisioningStatus, API_BASE } from '../lib/api';
import type { Tier, Region } from '../lib/types';

const TIER_NAMES: Record<number, string> = {
  1: 'Deploy & Own',
  2: 'Managed Cloud',
  3: 'IaC Kit',
};

// ─── Status helpers ────────────────────────────────────────────────────────────

const BACKEND_STATUS_STYLES: Record<string, string> = {
  pending_payment: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  paid:            'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  cancelled:       'text-slate-500 bg-slate-500/10 border-slate-500/20',
  refunded:        'text-rose-400 bg-rose-400/10 border-rose-400/20',
};

const BACKEND_STATUS_LABEL: Record<string, string> = {
  pending_payment: 'Pending payment',
  paid:            'Paid',
  cancelled:       'Cancelled',
  refunded:        'Refunded',
};

const PROV_STYLES: Record<ProvisioningStatus, string> = {
  not_started: 'text-slate-500 bg-slate-700/30 border-slate-700',
  queued:      'text-amber-400 bg-amber-400/10 border-amber-400/20',
  in_progress: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  completed:   'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  failed:      'text-rose-400 bg-rose-400/10 border-rose-400/20',
};

const PROV_LABELS: Record<ProvisioningStatus, string> = {
  not_started: 'Not started',
  queued:      'Queued',
  in_progress: 'In progress',
  completed:   'Completed',
  failed:      'Failed',
};

// ─── Reconstruct full RecipeItem objects from stored IDs ─────────────────────

function restoreItems(ids: string[]) {
  return ids.map((id) => RECIPE_ITEMS_BY_ID[id]).filter(Boolean);
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AccountPage() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  // Local draft orders (localStorage)
  const [localOrders, setLocalOrders] = useState<Order[]>(() => loadOrders());

  // Real backend orders
  const [backendOrders, setBackendOrders] = useState<BackendOrder[]>([]);
  const [backendLoading, setBackendLoading] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);

  // Retry-checkout loading state keyed by orderId
  const [retrying, setRetrying] = useState<string | null>(null);

  // Bootstrap template download loading state keyed by orderId
  const [downloading, setDownloading] = useState<string | null>(null);

  // Bootstrap verification loading state keyed by orderId
  const [verifying, setVerifying] = useState<string | null>(null);

  // Redirect if not signed in
  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [loading, user, navigate]);

  // Fetch backend orders once user is known
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const load = async () => {
      setBackendLoading(true);
      setBackendError(null);
      try {
        const token = await user.getIdToken();
        const email = user.email ?? '';
        const orders = await fetchBackendOrders(token, email);
        if (!cancelled) setBackendOrders(orders);
      } catch {
        if (!cancelled) setBackendError('Could not load orders from server.');
      } finally {
        if (!cancelled) setBackendLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // IDs of orders that exist in backend — used to filter local drafts
  const backendOrderIds = new Set(backendOrders.map((o) => o.orderId));

  // Local drafts: local orders whose ID does not appear in backend
  const localDrafts = localOrders.filter((o) => !backendOrderIds.has(o.id));

  // ── Actions ─────────────────────────────────────────────────────────────────

  const handleContinueDraft = (order: Order) => {
    saveBuilderState({
      tier: order.tier as Tier,
      region: (order.region as Region) ?? 'us-east-1',
      selections: restoreItems(order.selections),
      addons: order.addons ?? { cicd: false, support: false },
      awsAccountId: order.awsAccountId ?? '',
      customer: order.customer,
    });
    navigate(`/builder?tier=${order.tier}`);
  };

  const handleDeleteDraft = (id: string) => {
    deleteOrder(id);
    setLocalOrders(loadOrders());
  };

  const handleReviewBackendOrder = (order: BackendOrder) => {
    saveBuilderState({
      tier: order.tier as Tier,
      region: (order.region as Region) ?? 'us-east-1',
      selections: restoreItems(order.selections),
      addons: order.addons ?? { cicd: false, support: false },
      awsAccountId: order.awsAccountId ?? '',
      iacFormat: order.iacFormat ?? 'terraform',
      customer: order.customer,
    });
    navigate('/checkout?mode=review');
  };

  const handleDownloadBootstrap = async (order: BackendOrder) => {
    if (!user) return;
    setDownloading(order.orderId);
    try {
      const token = await user.getIdToken();
      await downloadBootstrapTemplate(order.orderId, token);
    } catch (err) {
      alert(`Could not download bootstrap template: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setDownloading(null);
    }
  };

  const handleVerifyBootstrap = async (order: BackendOrder) => {
    if (!user) return;
    setVerifying(order.orderId);
    try {
      const token = await user.getIdToken();
      const { bootstrapVerifiedAt } = await verifyBootstrap(order.orderId, token);
      // Update local state so the card transitions to verified without a full reload.
      setBackendOrders((prev) =>
        prev.map((o) =>
          o.orderId === order.orderId
            ? { ...o, bootstrapStatus: 'verified', bootstrapVerifiedAt }
            : o
        )
      );
    } catch (err) {
      alert(`Setup verification failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setVerifying(null);
    }
  };

  const handleRetryCheckout = async (order: BackendOrder) => {
    if (!user) return;
    setRetrying(order.orderId);
    try {
      const res = await fetch(`${API_BASE}/stripe/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.orderId }),
      });
      const data = await res.json() as { ok: boolean; checkoutUrl?: string; error?: string };
      if (!res.ok || !data.ok || !data.checkoutUrl) {
        throw new Error(data.error ?? 'Failed to create checkout session');
      }
      window.location.href = data.checkoutUrl;
    } catch (err) {
      alert(`Could not restart checkout: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setRetrying(null);
    }
  };

  const hasAnyOrders = backendOrders.length > 0 || localDrafts.length > 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />

      <main className="pt-24 pb-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-cyan-500 mb-1">My Account</p>
            <h1 className="text-3xl font-bold text-white">
              {user.displayName ? `Welcome back, ${user.displayName.split(' ')[0]}` : 'My Account'}
            </h1>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 text-sm text-slate-400
              hover:text-white hover:border-slate-500 transition-all
              focus:outline-none focus:ring-2 focus:ring-slate-500"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </button>
        </div>

        {/* Profile card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 mb-8 flex items-center gap-5">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName ?? 'User'}
              className="w-16 h-16 rounded-full border-2 border-cyan-500/30"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-cyan-600 flex items-center justify-center text-2xl font-bold text-white">
              {(user.displayName ?? user.email ?? 'U')[0].toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-lg font-semibold text-white">{user.displayName ?? 'User'}</p>
            <p className="text-sm text-slate-400">{user.email}</p>
            <p className="text-xs text-slate-600 mt-1">Signed in with Google</p>
          </div>
        </div>

        {/* ── Backend Orders ─────────────────────────────────────────────── */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Orders</h2>
            <Link
              to="/builder"
              className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
            >
              New order
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </Link>
          </div>

          {backendLoading && (
            <div className="flex items-center gap-3 py-8 text-slate-500 text-sm">
              <div className="w-5 h-5 rounded-full border-2 border-cyan-500/50 border-t-cyan-500 animate-spin flex-shrink-0" />
              Loading orders…
            </div>
          )}

          {backendError && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-400 mb-4">
              {backendError}
            </div>
          )}

          {!backendLoading && !backendError && backendOrders.length === 0 && localDrafts.length === 0 && (
            <EmptyOrders />
          )}

          {!backendLoading && backendOrders.length > 0 && (
            <div className="space-y-3">
              {backendOrders.map((order) => (
                <BackendOrderCard
                  key={order.orderId}
                  order={order}
                  retrying={retrying === order.orderId}
                  downloading={downloading === order.orderId}
                  verifying={verifying === order.orderId}
                  onReview={handleReviewBackendOrder}
                  onRetryCheckout={handleRetryCheckout}
                  onDownloadBootstrap={handleDownloadBootstrap}
                  onVerifyBootstrap={handleVerifyBootstrap}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Local Drafts ──────────────────────────────────────────────── */}
        {localDrafts.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-lg font-semibold text-white">Local Drafts</h2>
              <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                Saved locally · not submitted
              </span>
            </div>
            <div className="space-y-3">
              {localDrafts.map((order) => (
                <LocalDraftCard
                  key={order.id}
                  order={order}
                  onContinue={handleContinueDraft}
                  onDelete={handleDeleteDraft}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Backend Order Card ────────────────────────────────────────────────────────

interface BackendOrderCardProps {
  order: BackendOrder;
  retrying: boolean;
  downloading: boolean;
  verifying: boolean;
  onReview: (order: BackendOrder) => void;
  onRetryCheckout: (order: BackendOrder) => void;
  onDownloadBootstrap: (order: BackendOrder) => void;
  onVerifyBootstrap: (order: BackendOrder) => void;
}

function BackendOrderCard({ order, retrying, downloading, verifying, onReview, onRetryCheckout, onDownloadBootstrap, onVerifyBootstrap }: BackendOrderCardProps) {
  const [showInstructions, setShowInstructions] = useState(false);

  const tierName = TIER_NAMES[order.tier] ?? `Tier ${order.tier}`;
  const statusStyle = BACKEND_STATUS_STYLES[order.status] ?? BACKEND_STATUS_STYLES.pending_payment;
  const statusLabel = BACKEND_STATUS_LABEL[order.status] ?? order.status;
  const date = new Date(order.createdAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left: info */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v4m0 0H5m4 0h6m6-4v4m0 0h-6m6 0v10a2 2 0 01-2 2h-4m-6 0H5a2 2 0 01-2-2V7" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              Tier {order.tier} — {tierName}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Order #{order.orderId.slice(-8).toUpperCase()} · {date}
            </p>
            {order.selections.length > 0 && (
              <p className="text-xs text-slate-600 mt-1">
                {order.selections.length} recipe item{order.selections.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        {/* Right: status + price */}
        <div className="flex items-start gap-3 sm:flex-col sm:items-end">
          <div className="flex flex-col items-end gap-1.5">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusStyle}`}>
              {statusLabel}
            </span>
            {order.provisioningStatus && (
              <ProvisioningBadge status={order.provisioningStatus} />
            )}
          </div>
          <div className="text-right">
            {order.estimate.setupFee > 0 && (
              <p className="text-sm font-bold text-cyan-400">{formatUSD(order.estimate.setupFee)} once</p>
            )}
            {order.estimate.monthlyFee > 0 && (
              <p className="text-sm font-bold text-emerald-400">{formatUSD(order.estimate.monthlyFee)}/mo</p>
            )}
          </div>
        </div>
      </div>

      {/* Tier 1 bootstrap panel — shown only for paid Tier 1 orders */}
      {order.tier === 1 && order.status === 'paid' && (
        <>
          {order.bootstrapStatus === 'verified' ? (
            // Verified state
            <div className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 flex items-start gap-3">
              <svg className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-xs font-semibold text-emerald-400">AWS setup verified</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  AspenX has confirmed access to your AWS account. Our team will begin
                  deploying your infrastructure and will be in touch shortly.
                </p>
                {order.bootstrapVerifiedAt && (
                  <p className="text-xs text-slate-600 mt-1">
                    Verified {new Date(order.bootstrapVerifiedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                )}
              </div>
            </div>
          ) : (
            // Not yet verified — show setup instructions
            <div className="mt-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-3">
              <p className="text-xs font-semibold text-cyan-400 mb-1">Action required — AWS account setup</p>
              {order.bootstrapStatus === 'generated' ? (
                <>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Download the CloudFormation bootstrap template and deploy it in your AWS account.
                    It creates a cross-account role AspenX uses to deploy your infrastructure —
                    no root credentials required. Once deployed, click{' '}
                    <span className="text-slate-300 font-medium">Verify My Setup</span>{' '}
                    below. AspenX will not begin deployment until verification is complete.
                  </p>
                  {order.bootstrapGeneratedAt && (
                    <p className="text-xs text-slate-600 mt-1.5">
                      Template ready · generated {new Date(order.bootstrapGeneratedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-xs text-amber-400/70">
                  Template generating — check back shortly or contact support@aspenx.cloud
                </p>
              )}
            </div>
          )}
        </>
      )}

      {/* Action buttons */}
      <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap gap-2">
        {order.status === 'paid' && (
          <button
            onClick={() => onReview(order)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300
              border border-slate-700 bg-slate-800 hover:bg-slate-700 transition-all
              focus:outline-none focus:ring-2 focus:ring-slate-500"
          >
            Review order
          </button>
        )}
        {order.tier === 1 && order.status === 'paid' && order.bootstrapStatus === 'generated' && (
          <>
            <button
              onClick={() => onDownloadBootstrap(order)}
              disabled={downloading}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/10 text-cyan-400
                border border-cyan-500/20 hover:bg-cyan-500/20 transition-all
                disabled:opacity-50 disabled:cursor-not-allowed
                focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {downloading ? 'Downloading…' : 'Download Bootstrap Template'}
            </button>
            <button
              onClick={() => setShowInstructions(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300
                border border-slate-700 bg-slate-800 hover:bg-slate-700 transition-all
                focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              Instructions
            </button>
            <button
              onClick={() => onVerifyBootstrap(order)}
              disabled={verifying}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400
                border border-emerald-500/20 hover:bg-emerald-500/20 transition-all
                disabled:opacity-50 disabled:cursor-not-allowed
                focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {verifying ? 'Verifying…' : 'Verify My Setup'}
            </button>
          </>
        )}
        {showInstructions && <BootstrapInstructionsModal onClose={() => setShowInstructions(false)} />}
        {order.status === 'pending_payment' && (
          <button
            onClick={() => onRetryCheckout(order)}
            disabled={retrying}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-400
              border border-amber-500/20 hover:bg-amber-500/20 transition-all
              disabled:opacity-50 disabled:cursor-not-allowed
              focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {retrying ? 'Redirecting…' : 'Complete payment'}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Bootstrap Instructions Modal ─────────────────────────────────────────────

function BootstrapInstructionsModal({ onClose }: { onClose: () => void }) {
  const steps = [
    'Sign in to the AWS account you entered for this order.',
    'Open CloudFormation in the AWS Console.',
    'Click Create stack.',
    'Keep "Choose an existing template" selected.',
    'Select "Upload a template file".',
    'Upload the bootstrap template you downloaded from AspenX.',
    'Click Next.',
    'Continue through the steps and click Create stack.',
    'Wait until the stack status changes to CREATE_COMPLETE.',
    'Return here and click Verify My Setup.',
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <h2 className="text-sm font-semibold text-white">How to use the bootstrap template</h2>
          <button
            onClick={onClose}
            className="ml-4 text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0
              focus:outline-none focus:ring-2 focus:ring-slate-500 rounded"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Steps */}
        <ol className="space-y-2.5">
          {steps.map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-500/15 border border-cyan-500/30
                text-cyan-400 text-xs font-semibold flex items-center justify-center mt-px">
                {i + 1}
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">{step}</p>
            </li>
          ))}
        </ol>

        {/* Note */}
        <p className="mt-5 text-xs text-slate-500 leading-relaxed border-t border-slate-800 pt-4">
          If stack creation fails, open the <span className="text-slate-400">Events</span> tab
          in CloudFormation for the error details, fix the issue, and try again.
        </p>
      </div>
    </div>
  );
}

// ─── Provisioning Badge ────────────────────────────────────────────────────────

function ProvisioningBadge({ status }: { status: ProvisioningStatus }) {
  const style = PROV_STYLES[status];
  const label = PROV_LABELS[status];
  const showSpinner = status === 'in_progress' || status === 'queued';

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${style}`}>
      {showSpinner ? (
        <span className="w-2 h-2 rounded-full border border-current border-t-transparent animate-spin" />
      ) : (
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
      )}
      {label}
    </span>
  );
}

// ─── Local Draft Card ─────────────────────────────────────────────────────────

interface LocalDraftCardProps {
  order: Order;
  onContinue: (order: Order) => void;
  onDelete: (id: string) => void;
}

function LocalDraftCard({ order, onContinue, onDelete }: LocalDraftCardProps) {
  const tierName = TIER_NAMES[order.tier] ?? `Tier ${order.tier}`;
  const date = new Date(order.createdAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  return (
    <div className="rounded-xl border border-slate-800/60 border-dashed bg-slate-900/20 p-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-700/30 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-300">
              Tier {order.tier} — {tierName}
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              Draft · {date}
            </p>
            {(order.selections ?? []).length > 0 && (
              <p className="text-xs text-slate-600 mt-1">
                {(order.selections ?? []).length} recipe item{(order.selections ?? []).length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center">
          <span className="text-xs font-medium px-2.5 py-1 rounded-full border text-slate-500 bg-slate-700/20 border-slate-700">
            Draft
          </span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-800/60 flex flex-wrap gap-2">
        <button
          onClick={() => onContinue(order)}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/10 text-cyan-400
            border border-cyan-500/20 hover:bg-cyan-500/20 transition-all
            focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          Continue editing
        </button>
        <button
          onClick={() => onDelete(order.id)}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-400
            border border-rose-500/20 hover:bg-rose-500/10 transition-all
            focus:outline-none focus:ring-2 focus:ring-rose-500"
        >
          Delete draft
        </button>
      </div>
    </div>
  );
}

// ─── Empty state ───────────────────────────────────────────────────────────────

function EmptyOrders() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-800 p-10 text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
        <svg className="w-7 h-7 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-slate-400 mb-2">No orders yet</h3>
      <p className="text-sm text-slate-600 mb-6">Build your first app recipe and check out to see your orders here.</p>
      <Link
        to="/builder"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm
          bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500
          text-white transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500"
      >
        Build your environment →
      </Link>
    </div>
  );
}
