import type { Tier, Region, RecipeItem, Addon, PriceEstimate, PriceLineItem } from './types';

// ─── Region multipliers (placeholder — real pricing via backend later) ────────
// Values relative to us-east-1 baseline (1.0).
export const REGION_MULTIPLIERS: Record<Region, number> = {
  'us-east-1':      1.00,
  'us-west-2':      1.00,
  'eu-west-1':      1.12,
  'eu-central-1':   1.15,
  'ap-southeast-1': 1.20,
};

// ─── Base AspenX Fees ─────────────────────────────────────────────────────────

export const BASE_FEES: Record<
  Tier,
  { label: string; amount: number; recurring: boolean; startingNote: string }
> = {
  1: {
    label: 'Tier 1 — Deploy into your AWS account (base)',
    amount: 1500,
    recurring: false,
    startingNote: 'Starting at $1,500 (one-time)',
  },
  2: {
    label: 'Tier 2 — Managed DevOps (base)',
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

// ─── Per-item AspenX fee add-ons ──────────────────────────────────────────────
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

// ─── Add-on AspenX Fees ───────────────────────────────────────────────────────

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

// ─── AWS usage estimate per item (baseline, us-east-1, monthly) ───────────────
// Rough indicative AWS monthly costs. Real costs vary by usage.

const AWS_ITEM_MONTHLY: Record<string, number> = {
  'traffic-prototype': 20,
  'traffic-small':     80,
  'traffic-medium':    350,
  'traffic-large':     1200,
  'style-static':      5,
  'style-website-api': 100,
  'style-api-first':   80,
  'style-realtime':    150,
  'style-jobs':        60,
  'data-sql':          150,
  'data-nosql':        50,
  'data-files':        30,
  'data-cache':        80,
  'data-search':       250,
  'sec-https':         0,
  'sec-waf':           50,
  'sec-private-db':    10,
  'sec-compliance':    30,
  'rel-single-az':     0,
  'rel-multi-az':      100,
  'rel-backups':       20,
  'rel-blue-green':    30,
  'ops-basic':         10,
  'ops-advanced':      50,
};

// ─── Complexity score ─────────────────────────────────────────────────────────
// 0–100. Used to communicate overall environment complexity to customers.

function computeComplexityScore(selections: RecipeItem[]): number {
  const ITEM_WEIGHTS: Record<string, number> = {
    'traffic-prototype': 5,
    'traffic-small':     15,
    'traffic-medium':    30,
    'traffic-large':     50,
    'style-static':      5,
    'style-website-api': 15,
    'style-api-first':   12,
    'style-realtime':    20,
    'style-jobs':        10,
    'data-sql':          10,
    'data-nosql':        8,
    'data-files':        5,
    'data-cache':        8,
    'data-search':       15,
    'sec-https':         2,
    'sec-waf':           8,
    'sec-private-db':    6,
    'sec-compliance':    12,
    'rel-single-az':     0,
    'rel-multi-az':      10,
    'rel-backups':       5,
    'rel-blue-green':    8,
    'ops-basic':         3,
    'ops-advanced':      8,
  };
  const raw = selections.reduce((sum, item) => sum + (ITEM_WEIGHTS[item.id] ?? 5), 0);
  return Math.min(100, raw);
}

// ─── Main estimate calculator ─────────────────────────────────────────────────

export function calculateEstimate(
  tier: Tier,
  selections: RecipeItem[],
  addons: Addon,
  region: Region = 'us-east-1',
): PriceEstimate {
  // ── AspenX fee breakdown ──────────────────────────────────────────────────
  const base = BASE_FEES[tier];
  const aspenxBreakdown: PriceLineItem[] = [
    { label: base.label, amount: base.amount, recurring: base.recurring },
  ];

  for (const item of selections) {
    const fee = ITEM_FEES[item.id];
    if (!fee) continue;
    const amount = fee.fees[tier - 1];
    if (amount > 0) {
      aspenxBreakdown.push({ label: fee.label, amount, recurring: tier === 2 });
    }
  }

  if (addons.cicd) {
    const cicdFee = ADDON_FEES.cicd[tier];
    aspenxBreakdown.push({ label: cicdFee.label, amount: cicdFee.amount, recurring: cicdFee.recurring });
  }

  if (addons.support && tier === 2) {
    const sf = ADDON_FEES.support[2];
    aspenxBreakdown.push({ label: sf.label, amount: sf.amount, recurring: sf.recurring });
  }

  const aspenxMonthly = aspenxBreakdown.filter((i) => i.recurring).reduce((s, i) => s + i.amount, 0);
  const aspenxOneTime = aspenxBreakdown.filter((i) => !i.recurring).reduce((s, i) => s + i.amount, 0);

  // ── AWS usage estimate ────────────────────────────────────────────────────
  const multiplier = REGION_MULTIPLIERS[region] ?? 1.0;
  const baseAwsMonthly = selections.reduce((sum, item) => sum + (AWS_ITEM_MONTHLY[item.id] ?? 0), 0);
  const awsMonthlyEstimate = Math.round(baseAwsMonthly * multiplier);

  return {
    aspenxMonthly,
    aspenxOneTime,
    aspenxBreakdown,
    awsMonthlyEstimate,
    complexityScore: computeComplexityScore(selections),
  };
}

export function formatUSD(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}
