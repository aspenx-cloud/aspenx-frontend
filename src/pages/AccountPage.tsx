import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import { loadOrders, type Order } from '../lib/storage';
import { formatUSD } from '../lib/pricing';

const TIER_NAMES: Record<number, string> = {
  1: 'Deploy & Own',
  2: 'Managed Cloud',
  3: 'Terraform Kit',
};

const STATUS_STYLES: Record<Order['status'], string> = {
  pending:    'text-amber-400 bg-amber-400/10 border-amber-400/20',
  processing: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  complete:   'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
};

export default function AccountPage() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  // Redirect if not signed in
  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const orders = loadOrders();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

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

        {/* Orders section */}
        <div>
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

          {orders.length === 0 ? (
            <EmptyOrders />
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  const tierName = TIER_NAMES[order.tier] ?? `Tier ${order.tier}`;
  const statusStyle = STATUS_STYLES[order.status] ?? STATUS_STYLES.pending;
  const date = new Date(order.createdAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
            Order #{order.id.slice(-8).toUpperCase()} · {date}
          </p>
          {order.selections.length > 0 && (
            <p className="text-xs text-slate-600 mt-1">
              {order.selections.length} recipe item{order.selections.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 sm:flex-col sm:items-end">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${statusStyle}`}>
          {order.status}
        </span>
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
  );
}

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
