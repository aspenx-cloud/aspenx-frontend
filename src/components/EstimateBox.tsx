import React, { useState } from 'react';
import type { Tier, PriceEstimate } from '../lib/types';
import { formatUSD } from '../lib/pricing';

interface EstimateBoxProps {
  tier: Tier;
  estimate: PriceEstimate;
}

export default function EstimateBox({ tier, estimate }: EstimateBoxProps) {
  const [expanded, setExpanded] = useState(false);

  const hasMonthly = estimate.monthly > 0;
  const hasOneTime = estimate.oneTime > 0;

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/40 overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Price estimate</p>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-500 rounded"
          aria-expanded={expanded}
        >
          {expanded ? 'Hide breakdown' : 'See breakdown'}
        </button>
      </div>

      <div className="px-4 pb-3">
        <div className="flex flex-wrap gap-4">
          {hasMonthly && (
            <div>
              <p className="text-2xl font-bold text-emerald-400">{formatUSD(estimate.monthly)}</p>
              <p className="text-xs text-slate-500">/ month</p>
            </div>
          )}
          {hasOneTime && (
            <div>
              <p className="text-2xl font-bold text-cyan-400">{formatUSD(estimate.oneTime)}</p>
              <p className="text-xs text-slate-500">one-time</p>
            </div>
          )}
          {!hasMonthly && !hasOneTime && (
            <p className="text-sm text-slate-500 italic">Add items to see estimate</p>
          )}
        </div>

        {tier !== 3 && (
          <p className="text-xs text-amber-400/70 mt-2">
            + AWS usage costs billed directly by Amazon
          </p>
        )}
        {tier === 3 && (
          <p className="text-xs text-purple-400/70 mt-2">
            You pay AWS directly for usage — no markup from AspenX
          </p>
        )}
      </div>

      {expanded && estimate.breakdown.length > 0 && (
        <div className="border-t border-slate-700 px-4 py-3 space-y-1.5 animate-fade-in">
          {estimate.breakdown.map((item, i) => (
            <div key={i} className="flex items-baseline justify-between gap-2 text-xs">
              <span className="text-slate-400 flex-1 min-w-0 truncate">{item.label}</span>
              <span className="font-medium text-slate-300 flex-shrink-0">
                {formatUSD(item.amount)}
                <span className="text-slate-600 font-normal">
                  {item.recurring ? '/mo' : ' once'}
                </span>
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="px-4 pb-3">
        <p className="text-[10px] text-slate-600 mt-2 leading-relaxed">
          Estimates are indicative. Final pricing confirmed after scoping call.
          Prices shown in USD.
        </p>
      </div>
    </div>
  );
}
