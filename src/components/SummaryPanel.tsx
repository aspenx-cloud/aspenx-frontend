import React from 'react';
import type { Tier, RecipeItem, Addon, PriceEstimate } from '../lib/types';
import { calculateEstimate } from '../lib/pricing';
import EstimateBox from './EstimateBox';

const TIER_DESCRIPTIONS: Record<Tier, { title: string; desc: string }> = {
  1: {
    title: 'Deploy & Own',
    desc: 'One-time setup — AspenX provisions everything, then transfers full AWS account ownership to you.',
  },
  2: {
    title: 'Managed Cloud',
    desc: 'AspenX manages your infrastructure month-to-month. No DevOps required on your end.',
  },
  3: {
    title: 'Terraform Kit',
    desc: 'Receive production-ready Terraform files and deploy into your own AWS account yourself.',
  },
};

const VALIDATION_RULES = [
  {
    id: 'no-traffic',
    check: (s: RecipeItem[]) => !s.some((i) => i.category === 'traffic'),
    message: 'No traffic scale selected — pick one from "Traffic & scale"',
  },
  {
    id: 'no-app-style',
    check: (s: RecipeItem[]) => !s.some((i) => i.category === 'appStyle'),
    message: 'No app style selected — pick at least one from "App style"',
  },
];

interface SummaryPanelProps {
  tier: Tier | null;
  selections: RecipeItem[];
  addons: Addon;
  onRemoveItem: (id: string) => void;
  onToggleAddon: (key: keyof Addon) => void;
  onClear: () => void;
  onCheckout: () => void;
  checkoutLoading: boolean;
  checkoutError: string | null;
}

export default function SummaryPanel({
  tier,
  selections,
  addons,
  onRemoveItem,
  onToggleAddon,
  onClear,
  onCheckout,
  checkoutLoading,
  checkoutError,
}: SummaryPanelProps) {
  const estimate: PriceEstimate | null =
    tier ? calculateEstimate(tier, selections, addons) : null;

  const warnings = tier
    ? VALIDATION_RULES.filter((r) => r.check(selections))
    : [];

  const tierInfo = tier ? TIER_DESCRIPTIONS[tier] : null;

  return (
    <aside className="flex flex-col gap-4 h-full overflow-y-auto">
      {/* Tier info */}
      {tier && tierInfo && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-cyan-400">
              Tier {tier}
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-400">{tierInfo.title}</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">{tierInfo.desc}</p>
        </div>
      )}

      {!tier && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-center">
          <p className="text-sm text-slate-500">Select a tier to continue</p>
        </div>
      )}

      {/* Validation warnings */}
      {warnings.length > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 space-y-1.5">
          {warnings.map((w) => (
            <div key={w.id} className="flex items-start gap-2 text-xs text-amber-400">
              <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {w.message}
            </div>
          ))}
        </div>
      )}

      {/* Selected items */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Recipe items
          </h3>
          {selections.length > 0 && (
            <button
              onClick={onClear}
              className="text-xs text-slate-600 hover:text-red-400 transition-colors focus:outline-none focus:ring-1 focus:ring-red-500 rounded"
            >
              Clear all
            </button>
          )}
        </div>
        <div className="p-3 space-y-1.5 min-h-[60px]">
          {selections.length === 0 ? (
            <p className="text-xs text-slate-600 text-center py-2 italic">
              No items yet — drag or click cards to add
            </p>
          ) : (
            selections.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2 text-xs rounded-lg px-2.5 py-1.5 bg-slate-800/60 border border-slate-700/50"
              >
                <span className="text-slate-300 truncate">{item.label}</span>
                <button
                  onClick={() => onRemoveItem(item.id)}
                  aria-label={`Remove ${item.label}`}
                  className="text-slate-600 hover:text-red-400 flex-shrink-0 transition-colors focus:outline-none focus:ring-1 focus:ring-red-500 rounded"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add-ons */}
      {tier && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Add-ons
          </h3>

          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative mt-0.5">
              <input
                type="checkbox"
                checked={addons.cicd}
                onChange={() => onToggleAddon('cicd')}
                className="sr-only peer"
              />
              <div className="w-4 h-4 rounded border border-slate-600 bg-slate-800 peer-checked:bg-cyan-500 peer-checked:border-cyan-500 transition-all flex items-center justify-center">
                {addons.cicd && (
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-300 group-hover:text-white transition-colors">
                CI/CD setup
              </p>
              <p className="text-xs text-slate-500">
                {tier === 3 ? 'Pipeline template + instructions (one-time)' : 'Automated deploy pipeline (one-time)'}
              </p>
            </div>
          </label>

          {tier === 2 && (
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative mt-0.5">
                <input
                  type="checkbox"
                  checked={addons.support}
                  onChange={() => onToggleAddon('support')}
                  className="sr-only peer"
                />
                <div className="w-4 h-4 rounded border border-slate-600 bg-slate-800 peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-all flex items-center justify-center">
                  {addons.support && (
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-300 group-hover:text-white transition-colors">
                  Support & infra changes
                </p>
                <p className="text-xs text-slate-500">Monthly changes, updates, and support (monthly)</p>
              </div>
            </label>
          )}
        </div>
      )}

      {/* Price estimate */}
      {tier && estimate && (
        <EstimateBox tier={tier} estimate={estimate} />
      )}

      {/* Checkout error */}
      {checkoutError && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3">
          <p className="text-xs text-red-400">{checkoutError}</p>
        </div>
      )}

      {/* CTA */}
      {tier && (
        <button
          onClick={onCheckout}
          disabled={checkoutLoading || selections.length === 0}
          className="w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200
            bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500
            text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2
            focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center justify-center gap-2"
        >
          {checkoutLoading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Preparing checkout…
            </>
          ) : (
            <>
              Continue to checkout
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </>
          )}
        </button>
      )}
    </aside>
  );
}
