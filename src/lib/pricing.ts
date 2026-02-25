import type { Tier, Region, RecipeItem, Addon, PriceEstimate, PriceBreakdownLine } from './types';

// ─────────────────────────────────────────────────────────────────────────────
// COMPLEXITY SCORING
// Each selected item contributes points. Points drive both the AspenX fee and
// the AWS usage estimate. Easy to tune — just change numbers below.
// ─────────────────────────────────────────────────────────────────────────────

const COMPLEXITY_POINTS: Record<string, number> = {
  // Traffic & scale (exclusive — only one selected)
  'traffic-prototype': 1,
  'traffic-small':     2,
  'traffic-medium':    4,
  'traffic-large':     7,
  // App style
  'style-static':      1,
  'style-website-api': 3,
  'style-api-first':   3,
  'style-realtime':    4,
  'style-jobs':        3,
  // Data needs
  'data-sql':          4,
  'data-nosql':        3,
  'data-files':        2,
  'data-cache':        2,
  'data-search':       4,
  // Security
  'sec-https':         1,
  'sec-waf':           2,
  'sec-private-db':    2,
  'sec-compliance':    4,
  // Reliability
  'rel-single-az':     0,
  'rel-multi-az':      4,
  'rel-backups':       2,
  'rel-blue-green':    3,
  // Ops
  'ops-basic':         1,
  'ops-advanced':      4,
};

// ─────────────────────────────────────────────────────────────────────────────
// STARTS-FROM TABLE  (minimum floor, no items selected + no addons)
// Used both in the estimate result and on the landing tier cards.
// ─────────────────────────────────────────────────────────────────────────────

export const STARTS_FROM: Record<Tier, { setupFee: number; monthlyFee: number }> = {
  1: { setupFee: 499,  monthlyFee: 0   },
  2: { setupFee: 499,  monthlyFee: 299 },
  3: { setupFee: 299,  monthlyFee: 0   },
};

// ─────────────────────────────────────────────────────────────────────────────
// ASPENX FEE FORMULA
//
// Tier 1:  setupFee = startsFrom.setupFee + complexityScore × 75
// Tier 2:  setupFee = startsFrom.setupFee + complexityScore × 60
//          monthlyFee = startsFrom.monthlyFee + complexityScore × 25
// Tier 3:  setupFee = startsFrom.setupFee + complexityScore × 45
//
// Sanity check (same complexity c):
//   T1 setup  = 499 + c×75   ≥  T3 setup = 299 + c×45  ✓ (T1 always > T3)
//   T2 total  = setup + monthly×months — intentionally separate billing
// ─────────────────────────────────────────────────────────────────────────────

const SETUP_FEE_PER_POINT:   Record<Tier, number> = { 1: 75, 2: 60, 3: 45 };
const MONTHLY_FEE_PER_POINT: Record<Tier, number> = { 1: 0,  2: 25, 3: 0  };

// ─────────────────────────────────────────────────────────────────────────────
// ADD-ONS
// ─────────────────────────────────────────────────────────────────────────────

const CICD_ADDON_SETUP    = 250; // one-time, all tiers
const SUPPORT_ADDON_MONTHLY = 200; // monthly, Tier 2 only

// ─────────────────────────────────────────────────────────────────────────────
// AWS USAGE ESTIMATE (Phase 1 placeholder model)
//
// awsMonthly = (AWS_BASE + complexityScore × AWS_PER_POINT + featureAdds) × regionMultiplier
//
// NOTE: These are conservative placeholders. Real AWS pricing will be
// integrated later using AWS Pricing APIs. For now we use a linear model
// that errs on the low side to avoid over-promising.
// ─────────────────────────────────────────────────────────────────────────────

const AWS_BASE      = 25;   // minimum baseline (DNS, basic infra, etc.)
const AWS_PER_POINT = 18;   // cost added per complexity point

/** Explicit per-feature AWS cost bumps (on top of complexity×perPoint) */
const AWS_FEATURE_ADDS: Record<string, number> = {
  'data-sql':       40,  // RDS instance
  'data-search':    30,  // OpenSearch cluster
  'style-realtime': 20,  // WebSocket API + connection mgmt
  'rel-multi-az':   35,  // cross-AZ data transfer + standby instance
  'sec-waf':        10,  // WAF rules evaluation cost
  'data-files':     10,  // S3 storage + requests baseline
  'ops-advanced':   20,  // X-Ray + enhanced CloudWatch metrics
};

// ─────────────────────────────────────────────────────────────────────────────
// REGION MULTIPLIERS (placeholder)
// Relative to us-east-1 = 1.00 baseline.
// Real regional pricing will come from AWS Pricing APIs in a future release.
// ─────────────────────────────────────────────────────────────────────────────

export const REGION_MULTIPLIERS: Record<Region, number> = {
  'us-east-1':      1.00,
  'us-west-2':      1.05,
  'eu-west-1':      1.12,
  'eu-central-1':   1.15,
  'ap-southeast-1': 1.18,
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN CALCULATOR
// ─────────────────────────────────────────────────────────────────────────────

export function calculateEstimate(
  tier: Tier,
  selections: RecipeItem[],
  addons: Addon,
  region: Region = 'us-east-1',
): PriceEstimate {
  // ── 1. Complexity score ───────────────────────────────────────────────────
  const complexityScore = selections.reduce(
    (sum, item) => sum + (COMPLEXITY_POINTS[item.id] ?? 0),
    0,
  );

  // ── 2. AspenX setup fee ───────────────────────────────────────────────────
  const base      = STARTS_FROM[tier];
  const setupBase = base.setupFee + complexityScore * SETUP_FEE_PER_POINT[tier];
  const monthlyBase = base.monthlyFee + complexityScore * MONTHLY_FEE_PER_POINT[tier];

  const breakdown: PriceBreakdownLine[] = [
    { label: 'Base setup fee',                           amount: base.setupFee,      isSetup: true  },
    ...(complexityScore > 0 ? [{
      label: `Complexity (${complexityScore} pts × $${SETUP_FEE_PER_POINT[tier]})`,
      amount: complexityScore * SETUP_FEE_PER_POINT[tier],
      isSetup: true,
    }] : []),
  ];

  if (tier === 2) {
    breakdown.push({ label: 'Base management fee',  amount: base.monthlyFee, isSetup: false });
    if (complexityScore > 0) {
      breakdown.push({
        label: `Complexity management (${complexityScore} pts × $${MONTHLY_FEE_PER_POINT[2]})`,
        amount: complexityScore * MONTHLY_FEE_PER_POINT[2],
        isSetup: false,
      });
    }
  }

  // ── 3. Add-ons ────────────────────────────────────────────────────────────
  let setupFee   = setupBase;
  let monthlyFee = monthlyBase;

  if (addons.cicd) {
    setupFee += CICD_ADDON_SETUP;
    breakdown.push({ label: 'CI/CD pipeline add-on', amount: CICD_ADDON_SETUP, isSetup: true });
  }

  if (addons.support && tier === 2) {
    monthlyFee += SUPPORT_ADDON_MONTHLY;
    breakdown.push({ label: 'Support & infra changes', amount: SUPPORT_ADDON_MONTHLY, isSetup: false });
  }

  // ── 4. AWS usage estimate ─────────────────────────────────────────────────
  const featureAdds = selections.reduce(
    (sum, item) => sum + (AWS_FEATURE_ADDS[item.id] ?? 0),
    0,
  );
  const multiplier   = REGION_MULTIPLIERS[region] ?? 1.0;
  const awsMonthly   = Math.round(
    (AWS_BASE + complexityScore * AWS_PER_POINT + featureAdds) * multiplier,
  );

  return {
    aspenx: {
      setupFee:   Math.round(setupFee),
      monthlyFee: Math.round(monthlyFee),
    },
    awsEstimate: {
      monthly: awsMonthly,
    },
    complexityScore,
    breakdown,
    startsFrom: base,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export function formatUSD(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}
