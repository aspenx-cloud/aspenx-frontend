import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { User } from 'firebase/auth';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import { loadBuilderState, saveBuilderState, saveOrder, saveRecentOrderId } from '../lib/storage';
import { formatUSD, STARTS_FROM } from '../lib/pricing';
import { buildDeploymentPlan, CATEGORY_META, type DeploymentPlan } from '../lib/plan';
import { REGIONS } from '../lib/types';
import type { Tier, RecipeItem, Addon, Region, PriceEstimate, CustomerDetails } from '../lib/types';
// Static import — avoids stale-chunk 404s after new deploys
import ArchitectureDiagram from '../components/ArchitectureDiagram';

// ─────────────────────────────────────────────────────────────────────────────
// Tier copy
// ─────────────────────────────────────────────────────────────────────────────

const TIER_NEXT_STEPS: Record<Tier, { title: string; items: string[] }> = {
  1: {
    title: 'What happens after payment',
    items: [
      'You will receive a bootstrap script to run in your AWS account.',
      'The script creates a deployment IAM role — AspenX never touches your root credentials.',
      'AspenX deploys your recipe into your account via the cross-account role.',
      'You pay AWS directly for all usage — no markup from AspenX.',
    ],
  },
  2: {
    title: 'What happens after payment',
    items: [
      'AspenX provisions and manages a dedicated AWS account under AspenX billing.',
      'AWS usage is billed at cost (pass-through) and invoiced to you separately.',
      'Your AspenX management fee covers all infra management, patching, and updates.',
      'You receive limited-access IAM roles to view and deploy your app.',
    ],
  },
  3: {
    title: 'What happens after payment',
    items: [
      'You will receive a production-ready Terraform module for your recipe.',
      'A step-by-step deployment guide is included.',
      'You run terraform apply in your own AWS account.',
      'You own the result — and pay AWS directly for usage.',
    ],
  },
};

const TIER_NAMES: Record<Tier, string> = {
  1: 'Deploy into your AWS account',
  2: 'Managed DevOps',
  3: 'Terraform Kit',
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function regionLabel(region: Region): string {
  return REGIONS.find((r) => r.value === region)?.label ?? region;
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-3">
      {children}
    </p>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-slate-800 bg-slate-900/60 p-5 ${className}`}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reviewMode = searchParams.get('mode') === 'review';
  const { user, signInWithGoogle, firebaseReady } = useAuth();

  // ── Load persisted builder state ────────────────────────────────────────
  const saved = loadBuilderState();
  const tier     = saved?.tier     as Tier | null;
  const region   = (saved?.region  as Region | undefined) ?? 'us-east-1';
  const selections: RecipeItem[] = saved?.selections ?? [];
  const addons: Addon            = saved?.addons ?? { cicd: false, support: false };
  const awsAccountId             = saved?.awsAccountId ?? '';

  // ── Customer billing details (editable on checkout, persisted to localStorage) ──
  const [customer, setCustomer] = useState<CustomerDetails>(() =>
    saved?.customer ?? { fullName: '', companyName: '', billingCountry: '', taxId: '' }
  );

  useEffect(() => {
    if (!tier || selections.length === 0) return;
    saveBuilderState({ tier, region, selections, addons, awsAccountId, customer });
  }, [customer]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Redirect if no state ────────────────────────────────────────────────
  // In review mode a paid order may have no selections stored — only require tier.
  useEffect(() => {
    const missing = reviewMode ? !tier : (!tier || selections.length === 0);
    if (missing) navigate('/builder', { replace: true });
  }, [reviewMode, tier, selections.length, navigate]);

  if (!tier) return null;
  if (!reviewMode && selections.length === 0) return null;

  const plan = buildDeploymentPlan(tier, selections, addons, region);
  const estimate = plan.estimate;
  const nextSteps = TIER_NEXT_STEPS[tier];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />

      <main className="pt-24 pb-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => navigate(-1)}
              className="text-slate-500 hover:text-slate-300 transition-colors text-sm flex items-center gap-1 focus:outline-none"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-500 mb-1">Checkout Review</p>
          <h1 className="text-3xl font-bold text-white">Review your order</h1>
          <p className="text-slate-400 mt-1 text-sm">Confirm everything looks right before paying.</p>
        </div>

        <div className="space-y-6">
          {/* ── A. Order summary ────────────────────────────────────────── */}
          <Card>
            <SectionHeading>Order summary</SectionHeading>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Tier</p>
                <p className="font-semibold text-white">
                  Tier {tier} — {TIER_NAMES[tier]}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">AWS Region</p>
                <p className="font-semibold text-white">{regionLabel(region)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Recipe items</p>
                <p className="font-semibold text-white">{selections.length} selected</p>
              </div>
            </div>

            {/* Selections list */}
            <div className="mt-4 flex flex-wrap gap-2">
              {selections.map((s) => (
                <span
                  key={s.id}
                  className="px-2.5 py-1 rounded-full text-xs border border-slate-700 bg-slate-800 text-slate-300"
                >
                  {s.label}
                </span>
              ))}
            </div>

            {/* Add-ons */}
            {(addons.cicd || addons.support) && (
              <div className="mt-4 pt-4 border-t border-slate-800">
                <p className="text-xs text-slate-500 mb-2">Add-ons</p>
                <div className="flex flex-wrap gap-2">
                  {addons.cicd && (
                    <span className="px-2.5 py-1 rounded-full text-xs border border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
                      CI/CD pipeline
                    </span>
                  )}
                  {addons.support && tier === 2 && (
                    <span className="px-2.5 py-1 rounded-full text-xs border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                      Support & infra changes
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Tier 1 AWS account */}
            {tier === 1 && awsAccountId && (
              <div className="mt-4 pt-4 border-t border-slate-800">
                <p className="text-xs text-slate-500 mb-1">Your AWS Account ID</p>
                <code className="text-sm font-mono text-blue-300">{awsAccountId}</code>
              </div>
            )}
          </Card>

          {/* ── B. AspenX fees ──────────────────────────────────────────── */}
          <Card>
            <SectionHeading>AspenX fees</SectionHeading>
            <div className="flex flex-wrap gap-8 mb-4">
              {estimate.aspenx.setupFee > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">One-time setup fee</p>
                  <p className="text-3xl font-bold text-cyan-400 tabular-nums">
                    {formatUSD(estimate.aspenx.setupFee)}
                  </p>
                </div>
              )}
              {estimate.aspenx.monthlyFee > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Monthly management fee</p>
                  <p className="text-3xl font-bold text-emerald-400 tabular-nums">
                    {formatUSD(estimate.aspenx.monthlyFee)}
                    <span className="text-base font-normal text-slate-500">/mo</span>
                  </p>
                </div>
              )}
            </div>

            {/* Breakdown */}
            <div className="space-y-1.5 border-t border-slate-800 pt-3">
              {estimate.breakdown.map((line, i) => (
                <div key={i} className="flex items-baseline justify-between gap-2 text-xs">
                  <span className="text-slate-500">{line.label}</span>
                  <span className="font-medium text-slate-300 tabular-nums">
                    {formatUSD(line.amount)}
                    <span className="text-slate-600 font-normal ml-0.5">
                      {line.isSetup ? ' once' : '/mo'}
                    </span>
                  </span>
                </div>
              ))}
            </div>

            <p className="text-[10px] text-slate-600 mt-3 leading-relaxed">
              Starts from {formatUSD(STARTS_FROM[tier].setupFee)} setup
              {STARTS_FROM[tier].monthlyFee > 0
                ? ` + ${formatUSD(STARTS_FROM[tier].monthlyFee)}/mo management`
                : ''
              }. Complexity score: {estimate.complexityScore} pts.
            </p>
          </Card>

          {/* ── C. AWS estimate ─────────────────────────────────────────── */}
          <Card>
            <SectionHeading>Estimated AWS usage</SectionHeading>
            <div className="flex items-end gap-4 mb-3">
              <div>
                <p className="text-3xl font-bold text-slate-400 tabular-nums">
                  ~{formatUSD(estimate.awsEstimate.monthly)}
                  <span className="text-base font-normal text-slate-600">/mo</span>
                </p>
              </div>
              <div className="pb-1">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                  estimate.complexityScore >= 25
                    ? 'text-red-400 border-red-500/30 bg-red-500/10'
                    : estimate.complexityScore >= 10
                    ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                    : 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                }`}>
                  {estimate.complexityScore >= 25 ? 'High' : estimate.complexityScore >= 10 ? 'Medium' : 'Low'} complexity
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              {tier === 2
                ? 'AWS usage is billed at cost (pass-through) and invoiced to you separately each month. It is not included in the AspenX management fee.'
                : 'You pay AWS directly. This is a placeholder estimate — actual costs depend on usage and region. Real pricing is available from the AWS Pricing calculator.'
              }
            </p>
            <p className="text-[10px] text-slate-600 mt-2">
              Region: {regionLabel(region)} · Estimate only · USD
            </p>
          </Card>

          {/* ── D. Architecture diagram ─────────────────────────────────── */}
          <Card>
            <SectionHeading>Architecture diagram</SectionHeading>
            <ArchitectureDiagram plan={plan} />
          </Card>

          {/* ── E. Deployment plan BOM ──────────────────────────────────── */}
          <DeploymentBOM plan={plan} />

          {/* ── F. Data flows ────────────────────────────────────────────── */}
          {plan.flows.length > 0 && (
            <Card>
              <SectionHeading>Data flows</SectionHeading>
              <div className="space-y-4">
                {plan.flows.map((flow) => {
                  const flowColor =
                    flow.type === 'request'   ? 'border-cyan-500/30 text-cyan-400'    :
                    flow.type === 'upload'    ? 'border-blue-500/30 text-blue-400'    :
                    flow.type === 'async'     ? 'border-purple-500/30 text-purple-400' :
                    'border-rose-500/30 text-rose-400';
                  return (
                    <div key={flow.id} className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-slate-950 ${flowColor}`}>
                          {flow.type}
                        </span>
                        <span className="text-sm font-semibold text-slate-200">{flow.name}</span>
                      </div>
                      <ol className="space-y-1.5">
                        {flow.steps.map((step, si) => (
                          <li key={si} className="flex items-start gap-2.5 text-xs text-slate-400">
                            <span className="flex-shrink-0 w-4 h-4 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[9px] font-bold text-slate-600 mt-0.5">
                              {si + 1}
                            </span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* ── G. Next steps ────────────────────────────────────────────── */}
          <Card>
            <SectionHeading>{nextSteps.title}</SectionHeading>
            <ol className="space-y-2">
              {nextSteps.items.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-500">
                    {i + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ol>
          </Card>

          {/* ── H. Customer details ──────────────────────────────────────── */}
          {reviewMode ? (
            (customer.fullName || customer.billingCountry) ? (
              <Card>
                <SectionHeading>Customer details</SectionHeading>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {customer.fullName && (
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Full name</p>
                      <p className="text-sm font-medium text-white">{customer.fullName}</p>
                    </div>
                  )}
                  {customer.companyName && (
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Company</p>
                      <p className="text-sm font-medium text-white">{customer.companyName}</p>
                    </div>
                  )}
                  {customer.billingCountry && (
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Billing country</p>
                      <p className="text-sm font-medium text-white">{customer.billingCountry}</p>
                    </div>
                  )}
                  {customer.taxId && (
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Tax ID / VAT</p>
                      <p className="text-sm font-medium text-white">{customer.taxId}</p>
                    </div>
                  )}
                </div>
              </Card>
            ) : null
          ) : (
            <CustomerDetailsCard customer={customer} onChange={setCustomer} />
          )}

          {/* ── I. Pay / Review ──────────────────────────────────────────── */}
          {reviewMode ? (
            <ReviewBanner onBack={() => navigate('/account')} />
          ) : (
            <PaySection
              tier={tier}
              region={region}
              selections={selections}
              addons={addons}
              awsAccountId={awsAccountId}
              estimate={estimate}
              deploymentPlan={plan}
              customer={customer}
              user={user}
              firebaseReady={firebaseReady}
              signInWithGoogle={signInWithGoogle}
            />
          )}
        </div>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Review banner (shown instead of PaySection when mode=review)
// ─────────────────────────────────────────────────────────────────────────────

function ReviewBanner({ onBack }: { onBack: () => void }) {
  return (
    <Card className="border-slate-700 bg-slate-900/40">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1">
            Read-only review
          </p>
          <p className="text-sm text-slate-400">
            This is a review of your completed order. No payment action is available.
          </p>
        </div>
        <button
          onClick={onBack}
          className="flex-shrink-0 px-5 py-2.5 rounded-xl font-semibold text-sm border border-slate-700
            text-slate-300 hover:text-white hover:border-slate-500 hover:bg-slate-800/40
            transition-all focus:outline-none focus:ring-2 focus:ring-slate-500"
        >
          ← Back to account
        </button>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pay section (isolated so auth state change re-renders only this)
// ─────────────────────────────────────────────────────────────────────────────

interface PaySectionProps {
  tier: Tier;
  region: Region;
  selections: RecipeItem[];
  addons: Addon;
  awsAccountId: string;
  estimate: PriceEstimate;
  deploymentPlan: DeploymentPlan;
  customer: CustomerDetails;
  user: User | null;
  firebaseReady: boolean;
  signInWithGoogle: () => Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Deployment BOM accordion
// ─────────────────────────────────────────────────────────────────────────────

function DeploymentBOM({ plan }: { plan: DeploymentPlan }) {
  const [openCats, setOpenCats] = useState<Set<string>>(new Set(['compute', 'edge', 'data']));

  const toggle = (cat: string) =>
    setOpenCats((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });

  // Group components by category, skip internet/dns/vpc (too low-level for BOM)
  const skipIds = new Set(['internet', 'dns', 'vpc']);
  const grouped = plan.components
    .filter((c) => !skipIds.has(c.id))
    .reduce<Record<string, typeof plan.components>>((acc, c) => {
      (acc[c.category] ??= []).push(c);
      return acc;
    }, {});

  const catOrder: string[] = ['edge', 'compute', 'realtime', 'data', 'async', 'ops', 'compliance', 'cicd'];
  const orderedCats = catOrder.filter((k) => grouped[k]);

  if (orderedCats.length === 0) return null;

  return (
    <Card>
      <SectionHeading>Deployment plan — AWS components</SectionHeading>
      <div className="space-y-2">
        {orderedCats.map((cat) => {
          const meta = CATEGORY_META[cat as keyof typeof CATEGORY_META];
          const items = grouped[cat];
          const isOpen = openCats.has(cat);
          return (
            <div key={cat} className="rounded-lg border border-slate-800 overflow-hidden">
              <button
                onClick={() => toggle(cat)}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-900/60 hover:bg-slate-800/60 transition-colors focus:outline-none"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base leading-none">{meta.icon}</span>
                  <span className={`text-xs font-semibold uppercase tracking-wider ${meta.color}`}>
                    {meta.label}
                  </span>
                  <span className="text-[10px] text-slate-600 font-normal">
                    {items.length} component{items.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <svg
                  className={`w-4 h-4 text-slate-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isOpen && (
                <div className="divide-y divide-slate-800/60">
                  {items.map((comp) => (
                    <div key={comp.id} className="px-4 py-3 bg-slate-950/40 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">{comp.name}</p>
                          <p className="text-xs text-slate-500">{comp.sub}</p>
                        </div>
                      </div>

                      {/* AWS service chips */}
                      {comp.awsServices.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {comp.awsServices.map((svc) => (
                            <span
                              key={svc}
                              className="text-[10px] px-2 py-0.5 rounded-full border border-slate-700 bg-slate-800 text-slate-400 font-medium"
                            >
                              {svc}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Details */}
                      <ul className="space-y-1">
                        {comp.details.map((d, di) => (
                          <li key={di} className="flex items-start gap-2 text-xs text-slate-400">
                            <span className="text-slate-700 mt-0.5 flex-shrink-0">›</span>
                            {d}
                          </li>
                        ))}
                      </ul>

                      {/* Driven by */}
                      {comp.drivenBy.length > 0 && (
                        <p className="text-[10px] text-slate-600">
                          Driven by: {comp.drivenBy.join(', ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-slate-700 mt-3 leading-relaxed">
        This is your reference deployment manifest. AspenX will map these components to your exact Terraform config after the scoping call.
      </p>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pay section (isolated so auth state change re-renders only this)
// ─────────────────────────────────────────────────────────────────────────────

function PaySection({
  tier,
  region,
  selections,
  addons,
  awsAccountId,
  estimate,
  deploymentPlan,
  customer,
  user,
  firebaseReady,
  signInWithGoogle,
}: PaySectionProps) {
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  const customerValid = customer.fullName.trim().length > 0 && customer.billingCountry.trim().length > 0;

  const handleSignIn = async () => {
    setSigningIn(true);
    try { await signInWithGoogle(); } catch { /* handled in context */ }
    finally { setSigningIn(false); }
  };

  const handlePay = async () => {
    if (!user || !customerValid) return;

    setLoading(true);
    setError(null);

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL ?? 'https://vq2d5twmbk.execute-api.us-east-1.amazonaws.com';

      let idToken: string;
      try {
        idToken = await user.getIdToken();
      } catch {
        throw new Error('You must be signed in to place an order. Please sign in and try again.');
      }

      // ── Step 1: Create order ─────────────────────────────────────────────
      const orderPayload: Record<string, unknown> = {
        tier,
        region,
        selections: selections.map((s) => s.id),
        addons,
        deploymentPlan,
        pricing: {
          aspenx: {
            setupFee:   estimate.aspenx.setupFee,
            monthlyFee: estimate.aspenx.monthlyFee,
          },
          awsEstimate: {
            monthly: estimate.awsEstimate.monthly,
          },
          currency: 'USD',
        },
        userEmail: user.email,
        customer: {
          fullName:       customer.fullName.trim(),
          companyName:    customer.companyName.trim(),
          billingCountry: customer.billingCountry.trim(),
          taxId:          customer.taxId.trim(),
        },
      };
      if (tier === 1) orderPayload.awsAccountId = awsAccountId;

      const orderRes = await fetch(`${apiBase}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(orderPayload),
      });

      const orderData = await orderRes.json() as { ok: boolean; orderId?: string; error?: string; missing?: string[] };
      if (!orderRes.ok || !orderData.ok) {
        const detail = orderData.missing?.length
          ? `${orderData.error ?? 'Order failed'} — missing: ${orderData.missing.join(', ')}`
          : (orderData.error ?? `Orders API responded ${orderRes.status}`);
        throw new Error(detail);
      }
      const { orderId } = orderData;
      if (!orderId) throw new Error('No orderId returned from orders API');

      // ── Persist orderId so success page can fetch real order state ────────
      saveRecentOrderId(orderId);

      // ── Save local record for account page review ────────────────────────
      saveOrder({
        id: orderId,
        tier,
        createdAt: new Date().toISOString(),
        estimate: {
          setupFee:   estimate.aspenx.setupFee,
          monthlyFee: estimate.aspenx.monthlyFee,
          awsMonthly: estimate.awsEstimate.monthly,
        },
        selections: selections.map((s) => s.id),
        status: 'pending',
        region,
        addons,
        awsAccountId: tier === 1 ? awsAccountId : undefined,
        customer: {
          fullName:       customer.fullName.trim(),
          companyName:    customer.companyName.trim(),
          billingCountry: customer.billingCountry.trim(),
          taxId:          customer.taxId.trim(),
        },
      });

      // ── Step 2: Create Stripe checkout session ───────────────────────────
      const stripeRes = await fetch(`${apiBase}/stripe/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });

      const stripeData = await stripeRes.json() as { ok: boolean; checkoutUrl?: string; error?: string };
      if (!stripeRes.ok || !stripeData.ok) {
        throw new Error(stripeData.error ?? `Stripe API responded ${stripeRes.status}`);
      }
      const { checkoutUrl } = stripeData;
      if (!checkoutUrl) throw new Error('No checkoutUrl returned from Stripe API');

      window.location.href = checkoutUrl;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(
        `Unable to start checkout (${msg}). Please try again or contact support@aspenx.cloud.`,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-cyan-500/20 bg-cyan-500/5">
      <SectionHeading>Payment</SectionHeading>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/5 p-3">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      <div className="flex items-center gap-4 mb-5">
        <div>
          <p className="text-xs text-slate-500">Due today (setup)</p>
          <p className="text-2xl font-bold text-cyan-400 tabular-nums">
            {formatUSD(estimate.aspenx.setupFee)}
          </p>
        </div>
        {estimate.aspenx.monthlyFee > 0 && (
          <>
            <span className="text-slate-700">+</span>
            <div>
              <p className="text-xs text-slate-500">Then monthly</p>
              <p className="text-2xl font-bold text-emerald-400 tabular-nums">
                {formatUSD(estimate.aspenx.monthlyFee)}/mo
              </p>
            </div>
          </>
        )}
      </div>

      {!user ? (
        <div className="space-y-3">
          <p className="text-sm text-slate-400">
            Sign in with Google to continue to payment.
          </p>
          {!firebaseReady ? (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
              <p className="text-xs text-amber-400">
                Firebase not configured — Google sign-in unavailable.
              </p>
            </div>
          ) : (
            <button
              onClick={handleSignIn}
              disabled={signingIn}
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-60"
            >
              {signingIn
                ? <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                : <GoogleIcon />
              }
              {signingIn ? 'Signing in…' : 'Sign in with Google'}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-slate-500">
            Signed in as <span className="text-slate-300">{user.email}</span>
          </p>
          {!customerValid && (
            <p className="text-xs text-amber-400">
              Complete the customer details above to continue.
            </p>
          )}
          <button
            onClick={handlePay}
            disabled={loading || !customerValid}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm
              bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500
              text-white transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500
              focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50
              disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Preparing payment…
              </>
            ) : (
              <>
                Pay & confirm order
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                </svg>
              </>
            )}
          </button>
          <p className="text-[10px] text-slate-600 leading-relaxed">
            Secured by Stripe · Final pricing confirmed after scoping call · USD
          </p>
        </div>
      )}
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Customer details form card
// ─────────────────────────────────────────────────────────────────────────────

function CustomerDetailsCard({
  customer,
  onChange,
}: {
  customer: CustomerDetails;
  onChange: (c: CustomerDetails) => void;
}) {
  const set = (field: keyof CustomerDetails) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...customer, [field]: e.target.value });

  const inputClass = (required: boolean, val: string) =>
    `w-full bg-slate-800 border rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600
     focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all
     ${required && val.trim() === '' ? 'border-slate-700' : 'border-slate-700'}`;

  return (
    <Card>
      <SectionHeading>Customer details</SectionHeading>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Full name */}
        <div>
          <label htmlFor="customer-fullname" className="block text-xs font-medium text-slate-400 mb-1">
            Full name <span className="text-red-400">*</span>
          </label>
          <input
            id="customer-fullname"
            type="text"
            value={customer.fullName}
            onChange={set('fullName')}
            placeholder="Jane Smith"
            className={inputClass(true, customer.fullName)}
          />
        </div>

        {/* Company name */}
        <div>
          <label htmlFor="customer-company" className="block text-xs font-medium text-slate-400 mb-1">
            Company <span className="text-slate-600">(optional)</span>
          </label>
          <input
            id="customer-company"
            type="text"
            value={customer.companyName}
            onChange={set('companyName')}
            placeholder="Acme Corp"
            className={inputClass(false, customer.companyName)}
          />
        </div>

        {/* Billing country */}
        <div>
          <label htmlFor="customer-country" className="block text-xs font-medium text-slate-400 mb-1">
            Billing country <span className="text-red-400">*</span>
          </label>
          <input
            id="customer-country"
            type="text"
            value={customer.billingCountry}
            onChange={set('billingCountry')}
            placeholder="United States"
            className={inputClass(true, customer.billingCountry)}
          />
        </div>

        {/* Tax ID */}
        <div>
          <label htmlFor="customer-taxid" className="block text-xs font-medium text-slate-400 mb-1">
            Tax ID / VAT <span className="text-slate-600">(optional)</span>
          </label>
          <input
            id="customer-taxid"
            type="text"
            value={customer.taxId}
            onChange={set('taxId')}
            placeholder="EU123456789"
            className={inputClass(false, customer.taxId)}
          />
        </div>
      </div>
      <p className="text-[10px] text-slate-600 mt-3">
        Required fields: full name and billing country. Used for your order record only — no invoice is generated at this stage.
      </p>
    </Card>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}
