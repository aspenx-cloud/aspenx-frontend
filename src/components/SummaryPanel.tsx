import React from 'react';
import type { Tier, RecipeItem, Addon, PriceEstimate, Region } from '../lib/types';
import { calculateEstimate } from '../lib/pricing';
import EstimateBox from './EstimateBox';

const TIER_DESCRIPTIONS: Record<Tier, { title: string; desc: string }> = {
  1: {
    title: 'Deploy into your AWS account',
    desc: 'One-time deployment. You own the AWS account, you pay AWS directly. AspenX deploys via a cross-account IAM role you create with our bootstrap script.',
  },
  2: {
    title: 'Managed DevOps',
    desc: 'AspenX provisions and manages the AWS account under AspenX billing. AWS costs are included in your monthly subscription. You get limited-access IAM roles.',
  },
  3: {
    title: 'Terraform Kit',
    desc: 'You deploy; you pay AWS directly. AspenX delivers production-ready Terraform code + step-by-step instructions for your existing AWS account.',
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

function isValidAwsAccountId(id: string): boolean {
  return /^\d{12}$/.test(id.trim());
}

interface SummaryPanelProps {
  tier: Tier | null;
  region: Region;
  selections: RecipeItem[];
  addons: Addon;
  awsAccountId: string;
  onAwsAccountIdChange: (v: string) => void;
  awsConfirmed: boolean;
  onAwsConfirmedChange: (v: boolean) => void;
  existingAccountOptional: string;
  onExistingAccountOptionalChange: (v: string) => void;
  onRemoveItem: (id: string) => void;
  onToggleAddon: (key: keyof Addon) => void;
  onClear: () => void;
  onCheckout: () => void;
  checkoutLoading: boolean;
  checkoutError: string | null;
}

export default function SummaryPanel({
  tier,
  region,
  selections,
  addons,
  awsAccountId,
  onAwsAccountIdChange,
  awsConfirmed,
  onAwsConfirmedChange,
  existingAccountOptional,
  onExistingAccountOptionalChange,
  onRemoveItem,
  onToggleAddon,
  onClear,
  onCheckout,
  checkoutLoading,
  checkoutError,
}: SummaryPanelProps) {
  const estimate: PriceEstimate | null =
    tier ? calculateEstimate(tier, selections, addons, region) : null;

  const warnings = tier
    ? VALIDATION_RULES.filter((r) => r.check(selections))
    : [];

  const tierInfo = tier ? TIER_DESCRIPTIONS[tier] : null;

  // Tier 1 gating
  const tier1AccountValid = tier !== 1 || isValidAwsAccountId(awsAccountId);
  const tier1Confirmed = tier !== 1 || awsConfirmed;
  const canCheckout =
    selections.length > 0 &&
    warnings.length === 0 &&
    tier1AccountValid &&
    tier1Confirmed;

  // Derive checkout disabled reason
  let checkoutBlockReason: string | null = null;
  if (selections.length === 0) checkoutBlockReason = 'Add at least one item to continue';
  else if (warnings.length > 0) checkoutBlockReason = 'Fix the warnings above first';
  else if (tier === 1 && !tier1AccountValid) checkoutBlockReason = 'Enter a valid 12-digit AWS Account ID';
  else if (tier === 1 && !tier1Confirmed) checkoutBlockReason = 'Confirm you own the AWS account';

  return (
    <aside className="flex flex-col h-full">
      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-0.5 pb-2">

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

      {/* ── Tier 1 requirements ──────────────────────────────────────────── */}
      {tier === 1 && (
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">
            Required — Your AWS account
          </p>

          {/* AWS Account ID */}
          <div>
            <label htmlFor="aws-account-id" className="block text-xs font-medium text-slate-400 mb-1">
              AWS Account ID <span className="text-red-400">*</span>
            </label>
            <input
              id="aws-account-id"
              type="text"
              inputMode="numeric"
              maxLength={12}
              value={awsAccountId}
              onChange={(e) => onAwsAccountIdChange(e.target.value.replace(/\D/g, ''))}
              placeholder="123456789012"
              className={`w-full bg-slate-800 border rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono
                ${awsAccountId && !tier1AccountValid ? 'border-red-500/60' : 'border-slate-700'}`}
            />
            {awsAccountId && !tier1AccountValid && (
              <p className="text-xs text-red-400 mt-1">Must be exactly 12 digits</p>
            )}
            {tier1AccountValid && awsAccountId && (
              <p className="text-xs text-emerald-400 mt-1">✓ Valid account ID</p>
            )}
            <p className="text-[10px] text-slate-500 mt-1">
              Found in the top-right corner of your AWS console.
            </p>
          </div>

          {/* Confirmation checkbox */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative mt-0.5 flex-shrink-0">
              <input
                type="checkbox"
                checked={awsConfirmed}
                onChange={(e) => onAwsConfirmedChange(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-4 h-4 rounded border border-slate-600 bg-slate-800 peer-checked:bg-blue-500 peer-checked:border-blue-500 transition-all flex items-center justify-center">
                {awsConfirmed && (
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed group-hover:text-white transition-colors">
              I confirm I own this AWS account and will pay AWS directly for usage costs. <span className="text-red-400">*</span>
            </p>
          </label>

          {/* Bootstrap instructions */}
          <div className="rounded-lg border border-slate-700 bg-slate-900 p-3">
            <p className="text-xs font-semibold text-slate-300 mb-1.5">Bootstrap instructions</p>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
              Before deployment, you'll need to run a one-time bootstrap script in your AWS account.
              This creates an IAM role that allows AspenX to deploy into your account securely,
              without ever having access to your root credentials.
            </p>
            <div className="rounded border border-slate-700 bg-slate-800/60 px-3 py-2">
              <p className="text-[10px] text-slate-500 mb-1 font-semibold uppercase tracking-wider">
                Bootstrap script — coming next
              </p>
              <code className="text-[11px] text-slate-400 font-mono">
                # Script will be provided after checkout
              </code>
            </div>
          </div>
        </div>
      )}

      {/* ── Tier 2 info panel ────────────────────────────────────────────── */}
      {tier === 2 && (
        <div className="rounded-xl border border-cyan-500/15 bg-cyan-500/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400 mb-2">
            Managed account
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            AspenX will provision and manage the AWS account under AspenX billing.
            Your subscription covers infrastructure and management. No AWS account required from you.
          </p>
        </div>
      )}

      {/* ── Tier 3 optional field ─────────────────────────────────────────── */}
      {tier === 3 && (
        <div className="rounded-xl border border-purple-500/15 bg-purple-500/5 p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-purple-400">
            Your deployment
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            You deploy; you pay AWS directly. AspenX delivers production-ready Terraform code
            and step-by-step instructions.
          </p>
          <div>
            <label htmlFor="existing-account" className="block text-xs font-medium text-slate-400 mb-1">
              Existing AWS Account ID <span className="text-slate-600">(optional)</span>
            </label>
            <input
              id="existing-account"
              type="text"
              inputMode="numeric"
              maxLength={12}
              value={existingAccountOptional}
              onChange={(e) => onExistingAccountOptionalChange(e.target.value.replace(/\D/g, ''))}
              placeholder="123456789012"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600
                focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-mono"
            />
            <p className="text-[10px] text-slate-600 mt-1">
              Helps us tailor the Terraform output. Leave blank if you'll create a new account.
            </p>
          </div>
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
                {tier === 3 ? 'Pipeline template + docs (one-time)' : 'Automated deploy pipeline (one-time)'}
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

      {/* Close scrollable region */}
      </div>

      {/* ── Sticky CTA — always visible at bottom ── */}
      {tier && (
        <div className="flex-shrink-0 pt-3 border-t border-slate-800 space-y-2">
          {checkoutError && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3">
              <p className="text-xs text-red-400">{checkoutError}</p>
            </div>
          )}

          {!canCheckout && checkoutBlockReason && (
            <p className="text-xs text-slate-500 text-center px-1 leading-relaxed">{checkoutBlockReason}</p>
          )}

          <button
            onClick={onCheckout}
            disabled={checkoutLoading || !canCheckout}
            className="w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200
              bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500
              text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2
              focus:ring-offset-slate-900 disabled:opacity-40 disabled:cursor-not-allowed
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
        </div>
      )}
    </aside>
  );
}
