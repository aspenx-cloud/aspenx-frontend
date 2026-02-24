import React, { useState, useCallback, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import Navbar from '../components/Navbar';
import BuilderTopic from '../components/BuilderTopic';
import DropCanvas, { CANVAS_ID } from '../components/DropCanvas';
import SummaryPanel from '../components/SummaryPanel';
import DragCard from '../components/DragCard';
import Modal from '../components/Modal';
import { TOPICS } from '../lib/mappings';
import { REGIONS, DEFAULT_REGION } from '../lib/types';
import type { Tier, Region, RecipeItem, Addon } from '../lib/types';
import { calculateEstimate } from '../lib/pricing';
import { loadBuilderState, saveBuilderState, clearBuilderState } from '../lib/storage';
import { useAuth } from '../contexts/AuthContext';

const VALID_TIERS: Tier[] = [1, 2, 3];

type MobileTab = 'items' | 'canvas' | 'summary';

const STEP_LABELS = ['Build recipe', 'Review estimate', 'Checkout'];

export default function BuilderPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // ── Tier from URL param ──────────────────────────────────────────────────
  const tierParam = Number(searchParams.get('tier')) as Tier;
  const tier: Tier | null = VALID_TIERS.includes(tierParam) ? tierParam : null;

  // ── Builder state (persisted to localStorage) ───────────────────────────
  const [region, setRegion] = useState<Region>(() => {
    const saved = loadBuilderState();
    if (saved && saved.tier === tier && saved.region) return saved.region;
    return DEFAULT_REGION;
  });

  const [selections, setSelections] = useState<RecipeItem[]>(() => {
    const saved = loadBuilderState();
    if (saved && saved.tier === tier) return saved.selections;
    return [];
  });

  const [addons, setAddons] = useState<Addon>(() => {
    const saved = loadBuilderState();
    if (saved && saved.tier === tier) return saved.addons;
    return { cicd: false, support: false };
  });

  // Tier 1 specific state
  const [awsAccountId, setAwsAccountId] = useState<string>(() => {
    const saved = loadBuilderState();
    if (saved && saved.tier === tier) return saved.awsAccountId ?? '';
    return '';
  });
  const [awsConfirmed, setAwsConfirmed] = useState(false);

  // Tier 3 optional field
  const [existingAccountOptional, setExistingAccountOptional] = useState('');

  // Persist to localStorage whenever relevant state changes
  useEffect(() => {
    saveBuilderState({ tier, region, selections, addons, awsAccountId });
  }, [tier, region, selections, addons, awsAccountId]);

  // ── DnD state ────────────────────────────────────────────────────────────
  const [activeItem, setActiveItem] = useState<RecipeItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  // ── Item management ──────────────────────────────────────────────────────
  const addItem = useCallback((item: RecipeItem) => {
    setSelections((prev) => {
      if (item.category === 'traffic') {
        if (prev.some((s) => s.id === item.id)) return prev;
        return [...prev.filter((s) => s.category !== 'traffic'), item];
      }
      if (prev.some((s) => s.id === item.id)) return prev;
      return [...prev, item];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setSelections((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setSelections([]);
    setAddons({ cicd: false, support: false });
    clearBuilderState();
  }, []);

  const toggleAddon = useCallback((key: keyof Addon) => {
    setAddons((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // ── DnD handlers ─────────────────────────────────────────────────────────
  const handleDragStart = (event: DragStartEvent) => {
    const item = event.active.data.current?.item as RecipeItem | undefined;
    if (item) setActiveItem(item);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveItem(null);
    const { active, over } = event;
    if (!over || over.id !== CANVAS_ID) return;
    const item = active.data.current?.item as RecipeItem | undefined;
    if (item) addItem(item);
  };

  // ── Checkout ─────────────────────────────────────────────────────────────
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const handleCheckout = useCallback(async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (!tier || selections.length === 0) return;

    setCheckoutLoading(true);
    setCheckoutError(null);

    try {
      const estimate = calculateEstimate(tier, selections, addons, region);

      const payload: Record<string, unknown> = {
        tier,
        region,
        selections: selections.map((s) => s.id),
        addons,
        aspenxPrice: {
          monthly: estimate.aspenxMonthly,
          oneTime: estimate.aspenxOneTime,
        },
        awsEstimate: estimate.awsMonthlyEstimate,
        userEmail: user.email,
      };

      if (tier === 1) {
        payload.awsAccountId = awsAccountId;
      }

      const res = await fetch('https://api.aspenx.cloud/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const { url } = (await res.json()) as { url: string };
      window.location.href = url;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setCheckoutError(
        `Unable to start checkout (${msg}). Please try again or contact support@aspenx.cloud.`,
      );
    } finally {
      setCheckoutLoading(false);
    }
  }, [user, tier, region, selections, addons, awsAccountId]);

  // ── Mobile tabs ──────────────────────────────────────────────────────────
  const [mobileTab, setMobileTab] = useState<MobileTab>('items');

  // ── Tier picker (if no tier in URL) ─────────────────────────────────────
  if (!tier) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <Navbar />
        <div className="pt-24 pb-16 max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Choose your delivery tier</h1>
          <p className="text-slate-400 mb-10">Select a tier to start building your app recipe.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {([
              { t: 1 as Tier, name: 'Deploy into your AWS account', note: 'One-time payment', sub: 'You own the AWS account' },
              { t: 2 as Tier, name: 'Managed DevOps',               note: 'Monthly subscription', sub: 'AspenX manages the account' },
              { t: 3 as Tier, name: 'Terraform Kit',                note: 'One-time payment', sub: 'You deploy, you own' },
            ]).map(({ t, name, note, sub }) => (
              <button
                key={t}
                onClick={() => setSearchParams({ tier: String(t) })}
                className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-left hover:border-cyan-500/40 transition-all group focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Tier {t}</p>
                <p className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors">{name}</p>
                <p className="text-xs text-slate-500 mt-1">{note}</p>
                <p className="text-xs text-slate-600 mt-0.5">{sub}</p>
              </button>
            ))}
          </div>
          <button
            onClick={() => navigate('/')}
            className="mt-8 text-sm text-slate-500 hover:text-slate-300 transition-colors underline underline-offset-2"
          >
            ← Back to landing page
          </button>
        </div>
      </div>
    );
  }

  const selectedIds = new Set(selections.map((s) => s.id));
  const step = selections.length === 0 ? 1 : checkoutLoading ? 3 : 2;

  const TIER_SHORT: Record<Tier, string> = {
    1: 'Deploy into your AWS account',
    2: 'Managed DevOps',
    3: 'Terraform Kit',
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      {/* Step indicator + region selector */}
      <div className="pt-16 border-b border-slate-800 bg-slate-950/95 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-2">
            {/* Tier badge */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Tier {tier}
              </span>
              <span className="text-xs text-slate-500 hidden sm:block">
                {TIER_SHORT[tier]}
              </span>
            </div>

            {/* Steps */}
            <div className="flex items-center gap-1 sm:gap-2">
              {STEP_LABELS.map((label, i) => {
                const n = i + 1;
                const active = step === n;
                const done = step > n;
                return (
                  <React.Fragment key={n}>
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                          done
                            ? 'bg-cyan-500 text-white'
                            : active
                            ? 'bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500'
                            : 'bg-slate-800 text-slate-600'
                        }`}
                      >
                        {done ? '✓' : n}
                      </div>
                      <span
                        className={`text-xs hidden sm:block transition-colors ${
                          active ? 'text-white font-medium' : done ? 'text-cyan-400' : 'text-slate-600'
                        }`}
                      >
                        {label}
                      </span>
                    </div>
                    {i < STEP_LABELS.length - 1 && (
                      <div className={`w-6 sm:w-10 h-px transition-colors ${done ? 'bg-cyan-500/40' : 'bg-slate-800'}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>

        {/* Region selector bar */}
        <div className="border-t border-slate-800/60 bg-slate-950/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-3">
            <label htmlFor="region-select" className="text-xs text-slate-500 flex-shrink-0">
              AWS Region
            </label>
            <select
              id="region-select"
              value={region}
              onChange={(e) => setRegion(e.target.value as Region)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300
                focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all
                hover:border-slate-600 cursor-pointer"
            >
              {REGIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label} ({r.value})</option>
              ))}
            </select>
            <span className="text-[10px] text-slate-600 hidden sm:block">
              Region affects the AWS usage estimate shown below (estimate only — real costs vary).
            </span>
          </div>
        </div>
      </div>

      {/* Mobile tab bar */}
      <div className="lg:hidden border-b border-slate-800 bg-slate-950">
        <div className="flex">
          {(['items', 'canvas', 'summary'] as MobileTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setMobileTab(tab)}
              className={`flex-1 py-2.5 text-xs font-medium capitalize transition-colors focus:outline-none ${
                mobileTab === tab
                  ? 'text-cyan-400 border-b-2 border-cyan-500'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab === 'items' ? 'Add Items' : tab === 'canvas' ? 'Canvas' : 'Summary'}
              {tab === 'canvas' && selections.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px]">
                  {selections.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main layout */}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <main className="flex-1 lg:overflow-hidden max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <div className="lg:grid lg:grid-cols-[300px_1fr_260px] lg:gap-6 h-full">

            {/* ── Left: Summary ────────────────────────────────────────── */}
            <div className={`${mobileTab !== 'summary' ? 'hidden lg:flex' : 'flex'} flex-col lg:h-full`}>
              <SummaryPanel
                tier={tier}
                region={region}
                selections={selections}
                addons={addons}
                awsAccountId={awsAccountId}
                onAwsAccountIdChange={setAwsAccountId}
                awsConfirmed={awsConfirmed}
                onAwsConfirmedChange={setAwsConfirmed}
                existingAccountOptional={existingAccountOptional}
                onExistingAccountOptionalChange={setExistingAccountOptional}
                onRemoveItem={removeItem}
                onToggleAddon={toggleAddon}
                onClear={clearAll}
                onCheckout={handleCheckout}
                checkoutLoading={checkoutLoading}
                checkoutError={checkoutError}
              />
            </div>

            {/* ── Center: Drop canvas ──────────────────────────────────── */}
            <div className={`${mobileTab !== 'canvas' ? 'hidden lg:flex' : 'flex'} flex-col min-h-[400px] lg:min-h-0 lg:h-full`}>
              <DropCanvas selections={selections} onRemove={removeItem} />
            </div>

            {/* ── Right: Draggable topics ──────────────────────────────── */}
            <div className={`${mobileTab !== 'items' ? 'hidden lg:block' : 'block'} overflow-y-auto lg:h-full pr-1`}>
              <div className="space-y-1">
                <p className="text-xs text-slate-600 px-2 mb-3">
                  Drag to canvas or click/tap to add
                </p>
                {TOPICS.map((topic) => (
                  <BuilderTopic
                    key={topic.id}
                    topic={topic}
                    selectedIds={selectedIds}
                    onAdd={addItem}
                  />
                ))}
              </div>
            </div>
          </div>
        </main>

        {/* DragOverlay */}
        <DragOverlay>
          {activeItem && (
            <DragCard
              item={activeItem}
              isSelected={selectedIds.has(activeItem.id)}
              onAdd={() => undefined}
              overlay
            />
          )}
        </DragOverlay>
      </DndContext>

      {/* Auth prompt modal */}
      <Modal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title="Sign in to continue"
      >
        <p className="text-sm text-slate-400 mb-6">
          Create a free account with Google to save your recipe and proceed to checkout.
        </p>
        <SignInModalContent onClose={() => setShowAuthModal(false)} />
      </Modal>
    </div>
  );
}

function SignInModalContent({ onClose }: { onClose: () => void }) {
  const { signInWithGoogle, firebaseReady } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!firebaseReady) {
    return (
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
        <p className="text-xs text-amber-400">
          Firebase is not configured. Add your <code className="font-mono">VITE_FIREBASE_*</code> environment
          variables to enable Google sign-in. See the README for setup instructions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleSignIn}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-slate-700
          bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm transition-all
          focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        ) : (
          <GoogleIcon />
        )}
        {loading ? 'Signing in…' : 'Continue with Google'}
      </button>
      {error && <p className="text-xs text-red-400 text-center">{error}</p>}
      <p className="text-[10px] text-slate-600 text-center leading-relaxed">
        By signing in you agree to our terms of service. Your recipe is saved locally until checkout.
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}
