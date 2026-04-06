import React from 'react';
import { Link } from 'react-router-dom';
import { PolicyFooter } from './PrivacyPolicyPage';

export default function TermsOfServicePage() {
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
        <h1 className="text-4xl font-extrabold text-white mb-2">Terms of Service</h1>
        <p className="text-slate-500 text-sm mb-10">Last updated: March 2026</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-8 text-slate-300 leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-white mb-3">1. Acceptance of terms</h2>
            <p>
              By accessing or using the AspenX.cloud platform ("Service"), you agree to be bound by
              these Terms of Service. If you do not agree, do not use the Service. These terms apply
              to all visitors, users, and customers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">2. Description of service</h2>
            <p>
              AspenX.cloud provides AWS infrastructure deployment, configuration, and managed cloud
              services. Services are delivered according to the tier and configuration selected at
              the time of purchase. All price estimates displayed in the builder are indicative and
              subject to formal scoping review unless a specific quote has been confirmed in writing.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">3. Accounts and eligibility</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>You must be at least 18 years old and have the authority to enter into this agreement.</li>
              <li>You are responsible for all activity under your account.</li>
              <li>You must provide accurate billing and contact information.</li>
              <li>
                AspenX reserves the right to suspend or terminate accounts that violate these terms
                or are associated with fraudulent activity.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">4. Payment and fees</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                All fees are quoted in US dollars. Payment is processed by Stripe at the time of order.
              </li>
              <li>
                Setup fees are charged once at time of purchase. Monthly management fees (where
                applicable) are billed recurring as stated in your plan.
              </li>
              <li>
                AWS usage costs are billed directly by Amazon Web Services and are separate from
                AspenX fees. AWS estimates shown are indicative only.
              </li>
              <li>
                Failure to complete payment may result in order cancellation. See our{' '}
                <Link to="/refund-policy" className="text-cyan-400 hover:text-cyan-300">Refund Policy</Link>{' '}
                for cancellation terms.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">5. Service delivery</h2>
            <p>
              AspenX will use commercially reasonable efforts to provision services within a reasonable
              timeframe after payment. Service delivery involves manual, operator-assisted steps —
              AspenX is not a fully automated platform. Orders are typically completed within 24 hours
              of payment confirmation, assuming no issues with the order configuration or components.
              You can track your order status at any time in your account at aspenx.cloud. AspenX will
              communicate any material delays or issues via email.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">6. Customer responsibilities</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                You are responsible for the content, data, and workloads you deploy to your AWS
                environment.
              </li>
              <li>
                You must comply with AWS's Acceptable Use Policy and applicable laws.
              </li>
              <li>
                For Tier 1 (Deploy & Own), you maintain ownership and control of your AWS account.
                AspenX access is limited to the scoped deployment IAM role you grant.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">7. Intellectual property</h2>
            <p>
              AspenX retains ownership of its tooling, templates, and deployment scripts. Upon full
              payment, you receive a non-exclusive right to use the delivered infrastructure and
              associated documentation for your own business purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">8. Limitation of liability</h2>
            <p>
              To the maximum extent permitted by law, AspenX's total liability for any claim arising
              from use of the Service is limited to the amount you paid for the specific service giving
              rise to the claim in the 12 months prior to the event. AspenX is not liable for indirect,
              incidental, consequential, or punitive damages.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">9. Disclaimer of warranties</h2>
            <p>
              The Service is provided "as is" and "as available". AspenX makes no warranty that the
              Service will be uninterrupted, error-free, or that any specific outcome will be achieved.
              AWS services are provided by Amazon Web Services and subject to AWS's own terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">10. Governing law</h2>
            <p>
              These terms are governed by the laws of the jurisdiction in which AspenX.cloud is
              registered. Any disputes will be resolved in the courts of that jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">11. Changes to terms</h2>
            <p>
              We may update these terms at any time. Continued use of the Service after changes
              constitutes acceptance. We will notify you of material changes via email where reasonably
              practicable.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">12. Contact</h2>
            <p>
              For questions about these terms, contact us at{' '}
              <a href="mailto:legal@aspenx.cloud" className="text-cyan-400 hover:text-cyan-300">
                legal@aspenx.cloud
              </a>.
            </p>
          </section>

        </div>
      </main>

      <PolicyFooter />
    </div>
  );
}
