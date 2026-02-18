import type { Tier, RecipeItem, Addon, PriceEstimate, PriceLineItem } from './types';

// ─── Base Fees ────────────────────────────────────────────────────────────────
// Tune these constants to adjust pricing.

export const BASE_FEES: Record<
  Tier,
  { label: string; amount: number; recurring: boolean; startingNote: string }
> = {
  1: {
    label: 'Tier 1 — Deploy & Ownership Transfer (base)',
    amount: 1500,
    recurring: false,
    startingNote: 'Starting at $1,500 (one-time)',
  },
  2: {
    label: 'Tier 2 — Managed Cloud (base)',
    amount: 299,
    recurring: true,
    startingNote: 'Starting at $299/mo',
  },
  3: {
    label: 'Tier 3 — Terraform Kit (base)',
    amount: 499,
    recurring: false,
    startingNote: 'Starting at $499 (one-time)',
  },
};

// ─── Per-item add-on fees ─────────────────────────────────────────────────────
// fees tuple: [Tier1 one-time, Tier2 monthly, Tier3 one-time]

const ITEM_FEES: Record<string, { label: string; fees: [number, number, number] }> = {
  'traffic-prototype': { label: 'Prototype scale',       fees: [0,    0,    0]   },
  'traffic-small':     { label: 'Small scale infra',     fees: [250,  49,   75]  },
  'traffic-medium':    { label: 'Medium scale infra',    fees: [750,  149,  200] },
  'traffic-large':     { label: 'Large scale infra',     fees: [1500, 299,  350] },
  'style-static':      { label: 'Static site setup',     fees: [0,    0,    0]   },
  'style-website-api': { label: 'Website + API setup',   fees: [300,  59,   100] },
  'style-api-first':   { label: 'API backend setup',     fees: [200,  39,   75]  },
  'style-realtime':    { label: 'Realtime/WS setup',     fees: [500,  99,   150] },
  'style-jobs':        { label: 'Background jobs',       fees: [250,  49,   75]  },
  'data-sql':          { label: 'SQL database',          fees: [300,  59,   100] },
  'data-nosql':        { label: 'NoSQL database',        fees: [150,  29,   50]  },
  'data-files':        { label: 'File storage (S3)',     fees: [100,  19,   35]  },
  'data-cache':        { label: 'Caching layer',         fees: [200,  39,   75]  },
  'data-search':       { label: 'Full-text search',      fees: [350,  69,   100] },
  'sec-https':         { label: 'HTTPS / TLS',           fees: [0,    0,    0]   },
  'sec-waf':           { label: 'WAF protection',        fees: [200,  49,   75]  },
  'sec-private-db':    { label: 'Private DB networking', fees: [150,  29,   50]  },
  'sec-compliance':    { label: 'Compliance setup',      fees: [400,  79,   125] },
  'rel-single-az':     { label: 'Single-AZ config',     fees: [0,    0,    0]   },
  'rel-multi-az':      { label: 'Multi-AZ HA setup',    fees: [400,  79,   125] },
  'rel-backups':       { label: 'Backup & PITR config',  fees: [100,  19,   35]  },
  'rel-blue-green':    { label: 'Blue/green deploy',     fees: [250,  49,   75]  },
  'ops-basic':         { label: 'Basic monitoring',      fees: [0,    0,    0]   },
  'ops-advanced':      { label: 'Advanced monitoring',   fees: [300,  59,   100] },
};

// ─── Add-on Fees ──────────────────────────────────────────────────────────────

export const ADDON_FEES = {
  cicd: {
    1: { amount: 500, recurring: false, label: 'CI/CD pipeline setup (one-time)' },
    2: { amount: 500, recurring: false, label: 'CI/CD setup fee (one-time)' },
    3: { amount: 299, recurring: false, label: 'CI/CD pipeline template (one-time)' },
  } as Record<Tier, { amount: number; recurring: boolean; label: string }>,
  support: {
    2: { amount: 199, recurring: true, label: 'Support & infra changes (monthly)' },
  },
};

// ─── Estimate Calculator ──────────────────────────────────────────────────────

export function calculateEstimate(
  tier: Tier,
  selections: RecipeItem[],
  addons: Addon,
): PriceEstimate {
  const base = BASE_FEES[tier];
  const breakdown: PriceLineItem[] = [
    { label: base.label, amount: base.amount, recurring: base.recurring },
  ];

  for (const item of selections) {
    const fee = ITEM_FEES[item.id];
    if (!fee) continue;
    const amount = fee.fees[tier - 1];
    if (amount > 0) {
      breakdown.push({ label: fee.label, amount, recurring: tier === 2 });
    }
  }

  if (addons.cicd) {
    const cicdFee = ADDON_FEES.cicd[tier];
    breakdown.push({ label: cicdFee.label, amount: cicdFee.amount, recurring: cicdFee.recurring });
  }

  if (addons.support && tier === 2) {
    const sf = ADDON_FEES.support[2];
    breakdown.push({ label: sf.label, amount: sf.amount, recurring: sf.recurring });
  }

  const monthly = breakdown.filter(i => i.recurring).reduce((s, i) => s + i.amount, 0);
  const oneTime = breakdown.filter(i => !i.recurring).reduce((s, i) => s + i.amount, 0);

  return { monthly, oneTime, breakdown };
}

export function formatUSD(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}
