import React, { useState, type FormEvent } from 'react';
import Navbar from '../components/Navbar';
import TierCards from '../components/TierCard';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <Hero />
      <PricingSection />
      <AboutSection />
      <ContactSection />
      <Footer />
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  const scrollToPricing = () => {
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-grid-pattern"
    >
      {/* Ambient glow orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-cyan-500/5 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-blue-600/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-purple-500/3 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-24 pb-16">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/5 text-cyan-400 text-xs font-medium mb-8 animate-fade-in">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          DevOps as a Service — No cloud expertise required
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight mb-6 animate-slide-up">
          <span className="text-gradient">AspenX.cloud</span>
          <br />
          <span className="text-white">Your cloud, built right.</span>
        </h1>

        {/* Sub-headline */}
        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10 animate-slide-up">
          Describe the shape of your web app. We provision, deploy, and optionally manage
          production AWS infrastructure — so you can ship features, not servers.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up">
          <button
            onClick={scrollToPricing}
            className="px-8 py-4 rounded-xl font-semibold text-base bg-gradient-to-r from-cyan-500 to-blue-600
              hover:from-cyan-400 hover:to-blue-500 text-white transition-all duration-200
              shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 glow-cyan-sm
              focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            Build your environment
          </button>
          <button
            onClick={scrollToPricing}
            className="px-8 py-4 rounded-xl font-semibold text-base border border-slate-700
              text-slate-300 hover:text-white hover:border-slate-500 hover:bg-slate-800/40
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            See pricing →
          </button>
        </div>

        {/* Trust indicators */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-6 text-slate-600 text-xs">
          {['No AWS expertise needed', 'Transparent pricing', 'Ownership transfer available', 'Terraform-first'].map((t) => (
            <div key={t} className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-cyan-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {t}
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <button
        onClick={scrollToPricing}
        aria-label="Scroll to pricing"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-slate-600 hover:text-slate-400 transition-colors animate-bounce focus:outline-none"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </section>
  );
}

// ─── Pricing Section ──────────────────────────────────────────────────────────

function PricingSection() {
  return (
    <section id="pricing" className="py-24 bg-slate-950 relative">
      {/* Top border gradient */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-500 mb-3">
            Choose your tier
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            How would you like to work?
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Three delivery models. Same recipe builder. Pick the level of ownership and management that fits your team.
          </p>
        </div>

        <TierCards />

        <p className="text-center text-xs text-slate-600 mt-8">
          Not sure which tier fits? <button onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })} className="text-cyan-600 hover:text-cyan-400 underline underline-offset-2 transition-colors">Get in touch</button> and we'll help you decide.
        </p>
      </div>
    </section>
  );
}

// ─── About Section ────────────────────────────────────────────────────────────

function AboutSection() {
  const pillars = [
    {
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v4m0 0H5m4 0h6m6-4v4m0 0h-6m6 0v10a2 2 0 01-2 2h-4m-6 0H5a2 2 0 01-2-2V7" />
      ),
      title: 'Recipe-driven provisioning',
      desc: 'Describe your app in plain English — traffic, app style, data, and ops needs. No AWS certifications required.',
    },
    {
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      ),
      title: 'Production-grade by default',
      desc: 'Every environment is built with security, reliability, and cost-efficiency in mind — not as an afterthought.',
    },
    {
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      ),
      title: 'Terraform-first infrastructure',
      desc: 'All environments are defined as code. You get auditable, reproducible infrastructure whether we manage it or you do.',
    },
    {
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      ),
      title: 'You stay in control',
      desc: 'Own your AWS account (Tier 1 & 3) or let us manage it (Tier 2). Either way, no vendor lock-in beyond standard AWS.',
    },
  ];

  return (
    <section id="about" className="py-24 bg-slate-950/80 relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — text */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-cyan-500 mb-4">About AspenX</p>
            <h2 className="text-4xl font-bold text-white mb-6 leading-tight">
              We build your cloud<br />so you can build your product.
            </h2>
            <div className="space-y-4 text-slate-400 leading-relaxed">
              <p>
                AspenX is a DevOps-as-a-Service platform that turns high-level app requirements
                into production-ready AWS infrastructure. Our recipe builder bridges the gap
                between "what my app needs" and "what AWS services to provision" — without
                requiring you to speak AWS fluently.
              </p>
              <p>
                Whether you want full ownership after delivery, ongoing managed infrastructure,
                or just the Terraform modules to deploy yourself, we have a tier that fits
                exactly where your team is today.
              </p>
            </div>
          </div>

          {/* Right — pillars grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {pillars.map((p) => (
              <div
                key={p.title}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 hover:border-slate-700 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {p.icon}
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-white mb-1.5">{p.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Contact Section ──────────────────────────────────────────────────────────

function ContactSection() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      const res = await fetch('https://formspree.io/f/mzdakgda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, message: form.message }),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        setError('Something went wrong. Please try again or email us directly.');
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="contact" className="py-24 bg-slate-950 relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-500 mb-3">Get in touch</p>
          <h2 className="text-4xl font-bold text-white mb-4">Contact us</h2>
          <p className="text-slate-400">
            Not sure which tier fits? Have a custom requirement? We'd love to help.
          </p>
        </div>

        {submitted ? (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-10 text-center animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Message received</h3>
            <p className="text-slate-400 text-sm">We'll get back to you within one business day.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 space-y-5">
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="contact-name" className="block text-xs font-medium text-slate-400 mb-1.5">
                  Name
                </label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Jane Smith"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600
                    focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label htmlFor="contact-email" className="block text-xs font-medium text-slate-400 mb-1.5">
                  Email
                </label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="jane@company.com"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600
                    focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
            <div>
              <label htmlFor="contact-message" className="block text-xs font-medium text-slate-400 mb-1.5">
                Message
              </label>
              <textarea
                id="contact-message"
                required
                rows={5}
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                placeholder="Tell us about your app and what you're looking for…"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600
                  focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all resize-none"
              />
            </div>
            {error && (
              <p className="text-sm text-red-400 text-center">{error}</p>
            )}
            <button
              type="submit"
              disabled={sending}
              className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-cyan-500 to-blue-600
                hover:from-cyan-400 hover:to-blue-500 text-white transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900
                disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {sending ? 'Sending…' : 'Send message'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/favicon.svg" alt="AspenX logo" className="w-6 h-6" />
            <span className="text-sm font-semibold text-slate-400">AspenX.cloud</span>
          </div>
          <p className="text-xs text-slate-600 text-center max-w-lg">
            AspenX.cloud is an independent DevOps services company. All price estimates are indicative and subject to a formal scoping review.
            AWS is a registered trademark of Amazon Web Services, Inc. AspenX is not affiliated with or endorsed by AWS.
          </p>
          <p className="text-xs text-slate-700">
            © {new Date().getFullYear()} AspenX.cloud
          </p>
        </div>
      </div>
    </footer>
  );
}
