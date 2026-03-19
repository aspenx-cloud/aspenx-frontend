import React from 'react';
import { Link } from 'react-router-dom';
import { PolicyFooter } from './PrivacyPolicyPage';

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Top nav */}
      <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/favicon.svg" alt="AspenX" className="w-7 h-7" />
            <span className="font-bold text-white tracking-tight">AspenX.cloud</span>
          </Link>
          <Link to="/" className="text-sm text-slate-400 hover:text-white transition-colors">
            ← Back to Home
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <p className="text-xs font-semibold uppercase tracking-widest text-cyan-500 mb-2">Legal</p>
        <h1 className="text-4xl font-extrabold text-white mb-2">Refund &amp; Cancellation Policy</h1>
        <p className="text-slate-500 text-sm mb-10">Last updated: March 2025</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-8 text-slate-300 leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-white mb-3">Overview</h2>
            <p>
              AspenX.cloud provides professional services that involve scoping, provisioning, and
              configuring AWS infrastructure on your behalf. Because work begins promptly after
              payment and involves real engineering effort, our refund policy reflects the nature
              of service delivery.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">Setup fee — one-time charge</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-slate-200">Before provisioning begins:</strong> If you cancel
                within 48 hours of purchase and provisioning has not started, you are eligible for a
                full refund of the setup fee. Contact us promptly at{' '}
                <a href="mailto:support@aspenx.cloud" className="text-cyan-400 hover:text-cyan-300">
                  support@aspenx.cloud
                </a>.
              </li>
              <li>
                <strong className="text-slate-200">After provisioning has started:</strong> Setup fees
                are non-refundable once provisioning work has commenced. We will notify you when
                provisioning begins.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">Monthly management fee</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                Monthly fees cover ongoing managed cloud services and are billed in advance.
              </li>
              <li>
                You may cancel your monthly plan at any time by contacting{' '}
                <a href="mailto:support@aspenx.cloud" className="text-cyan-400 hover:text-cyan-300">
                  support@aspenx.cloud
                </a>.
                Cancellation takes effect at the end of the current billing period.
              </li>
              <li>
                Partial-month refunds are not issued for mid-period cancellations.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">Abandoned checkout (no charge)</h2>
            <p>
              If you begin checkout but do not complete payment, no charge is made. Incomplete Stripe
              sessions expire automatically and no funds are captured.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">AWS usage costs</h2>
            <p>
              AWS usage costs are billed directly by Amazon Web Services to your AWS account (Tier 1)
              or charged as pass-through on the AspenX managed account (Tier 2). These costs are not
              billed by AspenX and are outside our refund scope. Please refer to your AWS billing
              console or contact AWS support for AWS-related billing queries.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">Disputes and exceptions</h2>
            <p>
              If you believe there has been an error or you have a complaint about service delivery,
              please contact us at{' '}
              <a href="mailto:support@aspenx.cloud" className="text-cyan-400 hover:text-cyan-300">
                support@aspenx.cloud
              </a>{' '}
              before initiating a payment dispute. We aim to resolve all issues fairly and promptly.
              Chargebacks initiated without prior contact may result in account suspension.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">How to request a refund or cancellation</h2>
            <p>
              Email{' '}
              <a href="mailto:support@aspenx.cloud" className="text-cyan-400 hover:text-cyan-300">
                support@aspenx.cloud
              </a>{' '}
              with your order ID, registered email address, and reason for the request. We will respond
              within 2 business days.
            </p>
          </section>

        </div>
      </main>

      <PolicyFooter />
    </div>
  );
}
