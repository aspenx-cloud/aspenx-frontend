import React, { useState } from 'react';
import type { Tier, PriceEstimate } from '../lib/types';
import { formatUSD } from '../lib/pricing';

interface EstimateBoxProps {
  tier: Tier;
  estimate: PriceEstimate;
}

export default function EstimateBox({ tier, estimate }: EstimateBoxProps) {
  const [expanded, setExpanded] = useState(false);

  const hasAspenxMonthly = estimate.aspenxMonthly > 0;
  const hasAspenxOneTime = estimate.aspenxOneTime > 0;
  const hasAwsEstimate = estimate.awsMonthlyEstimate > 0;

  const complexityLabel =
    estimate.complexityScore >= 60 ? 'High' :
    estimate.complexityScore >= 30 ? 'Medium' : 'Low';

  const complexityColor =
    estimate.complexityScore >= 60 ? 'text-red-400' :
    estimate.complexityScore >= 30 ? 'text-amber-400' : 'text-emerald-400';

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

      {/* AspenX fee section */}
      <div className="px-4 pb-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5">
          AspenX fee (what you pay us)
        </p>
        <div className="flex flex-wrap gap-4">
          {hasAspenxMonthly && (
            <div>
              <p className="text-2xl font-bold text-emerald-400">{formatUSD(estimate.aspenxMonthly)}</p>
              <p className="text-xs text-slate-500">/ month</p>
            </div>
          )}
          {hasAspenxOneTime && (
            <div>
              <p className="text-2xl font-bold text-cyan-400">{formatUSD(estimate.aspenxOneTime)}</p>
              <p className="text-xs text-slate-500">one-time</p>
            </div>
          )}
          {!hasAspenxMonthly && !hasAspenxOneTime && (
            <p className="text-sm text-slate-500 italic">Add items to see estimate</p>
          )}
        </div>
      </div>

      {/* AWS usage estimate section */}
      {(estimate.complexityScore > 0 || hasAwsEstimate) && (
        <div className="border-t border-slate-700/60 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5">
            Estimated AWS usage
            {tier === 2 ? ' (included in subscription)' : ' (you pay Amazon)'}
          </p>
          <div className="flex items-center gap-3">
            <div>
              <p className="text-lg font-bold text-slate-300">
                {hasAwsEstimate ? `~${formatUSD(estimate.awsMonthlyEstimate)}/mo` : '—'}
              </p>
              <p className="text-[10px] text-amber-400/70 mt-0.5">
                Estimate only. Real AWS costs vary by usage and region.
              </p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-[10px] text-slate-500">Complexity</p>
              <p className={`text-sm font-semibold ${complexityColor}`}>{complexityLabel}</p>
            </div>
          </div>
          {tier !== 2 && (
            <p className="text-[10px] text-slate-600 mt-1.5">
              You will be billed by Amazon Web Services directly for usage costs.
            </p>
          )}
        </div>
      )}

      {/* AspenX fee breakdown */}
      {expanded && estimate.aspenxBreakdown.length > 0 && (
        <div className="border-t border-slate-700 px-4 py-3 space-y-1.5 animate-fade-in">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-2">
            AspenX fee breakdown
          </p>
          {estimate.aspenxBreakdown.map((item, i) => (
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
