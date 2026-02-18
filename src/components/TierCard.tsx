import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Tier } from '../lib/types';

interface TierDef {
  tier: Tier;
  name: string;
  tagline: string;
  bestFor: string;
  model: string;
  bullets: string[];
  startingPrice: string;
  priceNote: string;
  popular?: boolean;
  accentClass: string;
  glowClass: string;
}

const TIERS: TierDef[] = [
  {
    tier: 1,
    name: 'Deploy & Own',
    tagline: 'One-time Deploy + Ownership Transfer',
    bestFor: 'Teams who want to own their infrastructure outright',
    model: 'One-time payment',
    accentClass: 'text-blue-400 border-blue-500/30',
    glowClass: 'hover:shadow-[0_0_30px_rgba(59,130,246,0.12)]',
    bullets: [
      'Build your app recipe with the drag-and-drop builder',
      'AspenX provisions & deploys into a brand-new AWS account',
      'Full AWS account ownership transferred to you after delivery',
      'Detailed handoff documentation included',
      'Optional CI/CD pipeline add-on',
    ],
    startingPrice: '$1,500',
    priceNote: 'one-time · AWS usage billed separately by Amazon',
  },
  {
    tier: 2,
    name: 'Managed Cloud',
    tagline: 'Fully Managed Monthly Subscription',
    bestFor: 'Teams who want zero DevOps overhead',
    model: 'Monthly subscription',
    popular: true,
    accentClass: 'text-cyan-400 border-cyan-500/50',
    glowClass: 'shadow-[0_0_40px_rgba(6,182,212,0.15)] hover:shadow-[0_0_50px_rgba(6,182,212,0.25)]',
    bullets: [
      'Build your app recipe with the drag-and-drop builder',
      'AspenX provisions & deploys into a new AWS account',
      'We stay the account owner and manage infra on your behalf',
      'Monthly infrastructure updates & security patches',
      'Optional support & change management add-on',
    ],
    startingPrice: '$299',
    priceNote: 'per month · AWS usage billed separately by Amazon',
  },
  {
    tier: 3,
    name: 'Terraform Kit',
    tagline: 'Terraform Files + Deploy Yourself',
    bestFor: 'Engineering teams who prefer full control',
    model: 'One-time payment',
    accentClass: 'text-purple-400 border-purple-500/30',
    glowClass: 'hover:shadow-[0_0_30px_rgba(168,85,247,0.12)]',
    bullets: [
      'Build your app recipe with the drag-and-drop builder',
      'Receive production-ready Terraform modules for your setup',
      'Step-by-step deployment guide for your AWS account',
      'You deploy, you own, you pay AWS directly',
      'Optional CI/CD pipeline template add-on',
    ],
    startingPrice: '$499',
    priceNote: 'one-time · you pay AWS directly for usage',
  },
];

interface TierCardProps {
  tier: TierDef;
}

function TierCard({ tier }: TierCardProps) {
  const navigate = useNavigate();

  return (
    <div
      className={`relative flex flex-col rounded-2xl border bg-slate-900 p-6 transition-all duration-300 ${tier.accentClass} ${tier.glowClass} ${
        tier.popular ? 'border-cyan-500/50' : 'border-slate-800'
      }`}
    >
      {tier.popular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg">
            Most Popular
          </span>
        </div>
      )}

      <div className="mb-4">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-1">Tier {tier.tier}</p>
        <h3 className={`text-xl font-bold mb-0.5 ${tier.popular ? 'text-cyan-400' : 'text-white'}`}>{tier.name}</h3>
        <p className="text-sm text-slate-400">{tier.tagline}</p>
      </div>

      <div className="mb-4 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
        <p className="text-xs text-slate-500 mb-0.5">Best for</p>
        <p className="text-sm text-slate-300">{tier.bestFor}</p>
      </div>

      <ul className="flex flex-col gap-2 mb-6 flex-1">
        {tier.bullets.map((b, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
            <svg
              className={`w-4 h-4 mt-0.5 flex-shrink-0 ${tier.popular ? 'text-cyan-400' : 'text-slate-500'}`}
              fill="currentColor" viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            {b}
          </li>
        ))}
      </ul>

      <div className="border-t border-slate-800 pt-4 mb-4">
        <p className={`text-3xl font-bold ${tier.popular ? 'text-cyan-400' : 'text-white'}`}>
          {tier.startingPrice}
        </p>
        <p className="text-xs text-slate-500 mt-0.5">{tier.priceNote}</p>
      </div>

      <button
        onClick={() => navigate(`/builder?tier=${tier.tier}`)}
        className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 ${
          tier.popular
            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white focus:ring-cyan-500'
            : 'border border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white hover:bg-slate-800/60 focus:ring-slate-500'
        }`}
      >
        Select Tier {tier.tier} →
      </button>
    </div>
  );
}

export default function TierCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
      {TIERS.map((t) => (
        <TierCard key={t.tier} tier={t} />
      ))}
    </div>
  );
}

export { TIERS };
