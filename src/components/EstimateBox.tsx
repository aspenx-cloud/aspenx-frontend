import React, { useState } from 'react';
import type { Tier, PriceEstimate } from '../lib/types';
import { formatUSD } from '../lib/pricing';

interface EstimateBoxProps {
  tier: Tier;
  estimate: PriceEstimate;
}

export default function EstimateBox({ tier, estimate }: EstimateBoxProps) {
  const [expanded, setExpanded] = useState(false);

  const { setupFee, monthlyFee } = estimate.aspenx;
  const awsMonthly = estimate.awsEstimate.monthly;
  const { complexityScore, breakdown } = estimate;

  const hasAnyPrice = setupFee > 0 || monthlyFee > 0;

  const complexityLabel =
    complexityScore >= 25 ? 'High' :
    complexityScore >= 10 ? 'Medium' : 'Low';
  const complexityColor =
    complexityScore >= 25 ? 'bg-red-500' :
    complexityScore >= 10 ? 'bg-amber-500' : 'bg-emerald-500';
  // Scale bar: ~50 pts = full width
  const barWidth = Math.max(complexityScore > 0 ? 4 : 0, Math.min(100, complexityScore * 2));

  return (
    <div className="rounded-xl border border-slate-700/80 bg-slate-900 overflow-hidden">
      {/* AspenX fees — primary */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            AspenX fee
          </p>
          {hasAnyPrice && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors focus:outline-none"
              aria-expanded={expanded}
            >
              {expanded ? 'hide details' : 'see breakdown'}
            </button>
          )}
        </div>

        {hasAnyPrice ? (
          <div className="flex items-end gap-4 flex-wrap">
            {setupFee > 0 && (
              <div>
                <p className="text-3xl font-bold text-cyan-400 leading-none tabular-nums">
                  {formatUSD(setupFee)}
                </p>
                <p className="text-xs text-slate-500 mt-1">one-time setup</p>
              </div>
            )}
            {monthlyFee > 0 && (
              <div>
                <p className="text-3xl font-bold text-emerald-400 leading-none tabular-nums">
                  {formatUSD(monthlyFee)}
                </p>
                <p className="text-xs text-slate-500 mt-1">/ month management</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-600 italic">Add items to see estimate</p>
        )}
      </div>

      {/* Breakdown */}
      {expanded && breakdown.length > 0 && (
        <div className="border-t border-slate-800 px-4 py-3 space-y-1.5 animate-fade-in">
          {breakdown.map((item, i) => (
            <div key={i} className="flex items-baseline justify-between gap-2 text-xs">
              <span className="text-slate-500 flex-1 min-w-0 truncate">{item.label}</span>
              <span className="font-medium text-slate-300 flex-shrink-0 tabular-nums">
                {formatUSD(item.amount)}
                <span className="text-slate-600 font-normal text-[10px] ml-0.5">
                  {item.isSetup ? ' once' : '/mo'}
                </span>
              </span>
            </div>
          ))}
        </div>
      )}

      {/* AWS estimate — secondary */}
      {complexityScore > 0 && (
        <div className="border-t border-slate-800 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-2">
            {tier === 2
              ? 'Est. AWS usage (invoiced to you at cost)'
              : 'Est. AWS usage (you pay Amazon directly)'}
          </p>

          <div className="flex items-center justify-between gap-3 mb-2">
            <p className="text-lg font-bold text-slate-400 tabular-nums">
              {awsMonthly > 0 ? `~${formatUSD(awsMonthly)}/mo` : '—'}
            </p>
            <div className="text-right">
              <p className="text-[10px] text-slate-500 mb-0.5">Complexity</p>
              <p className="text-xs font-semibold text-slate-300">{complexityLabel}</p>
            </div>
          </div>

          {/* Complexity bar */}
          <div className="w-full h-1 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${complexityColor}`}
              style={{ width: `${barWidth}%` }}
            />
          </div>

          <p className="text-[10px] text-slate-600 mt-2 leading-relaxed">
            Estimate only. Real AWS costs vary by usage and region.
          </p>
        </div>
      )}

      <div className="px-4 py-2.5 border-t border-slate-800/60">
        <p className="text-[10px] text-slate-700 leading-relaxed">
          Final pricing confirmed after scoping call · USD
        </p>
      </div>
    </div>
  );
}
