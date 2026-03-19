import React from 'react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicyPage() {
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
        <h1 className="text-4xl font-extrabold text-white mb-2">Privacy Policy</h1>
        <p className="text-slate-500 text-sm mb-10">Last updated: March 2025</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-8 text-slate-300 leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-white mb-3">1. Who we are</h2>
            <p>
              AspenX.cloud ("AspenX", "we", "us") is an independent DevOps services company that provides
              AWS infrastructure deployment and managed cloud services. If you have questions about this
              policy, contact us at{' '}
              <a href="mailto:privacy@aspenx.cloud" className="text-cyan-400 hover:text-cyan-300">
                privacy@aspenx.cloud
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">2. Information we collect</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-slate-200">Account data:</strong> When you sign in with Google we
                receive your name, email address, and profile photo via Google OAuth.
              </li>
              <li>
                <strong className="text-slate-200">Order data:</strong> We store details of orders you
                place, including tier, configuration selections, billing details (name, company, country,
                tax ID), and pricing.
              </li>
              <li>
                <strong className="text-slate-200">Payment data:</strong> Payments are processed by Stripe.
                We do not store full card details. Stripe may share a payment reference and status with us.
              </li>
              <li>
                <strong className="text-slate-200">Usage data:</strong> Standard server logs (IP address,
                browser type, pages visited, timestamps). We may use these to diagnose errors and improve the
                service.
              </li>
              <li>
                <strong className="text-slate-200">Local storage:</strong> We use your browser's
                localStorage to save your builder state and draft orders so you can continue where you left
                off. This data stays on your device.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">3. How we use your information</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>To create and manage your AspenX account and orders</li>
              <li>To process payments via Stripe</li>
              <li>To provision AWS infrastructure as part of your purchased service</li>
              <li>To send transactional emails (order confirmation, access credentials)</li>
              <li>To respond to support requests</li>
              <li>To comply with legal obligations</li>
            </ul>
            <p className="mt-3">
              We do not sell your personal data. We do not use your data for third-party advertising.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">4. Data sharing</h2>
            <p>We share data only with:</p>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li>
                <strong className="text-slate-200">Stripe</strong> — for payment processing
              </li>
              <li>
                <strong className="text-slate-200">Amazon Web Services (AWS)</strong> — infrastructure
                is deployed on AWS. Relevant configuration data is used in provisioning.
              </li>
              <li>
                <strong className="text-slate-200">Google Firebase</strong> — for authentication
              </li>
              <li>
                Service providers who help us operate this platform, under appropriate data processing
                agreements
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">5. Data retention</h2>
            <p>
              We retain order and account data for as long as required to provide the service and meet
              legal or contractual obligations. You may request deletion of your account and associated
              data by contacting{' '}
              <a href="mailto:privacy@aspenx.cloud" className="text-cyan-400 hover:text-cyan-300">
                privacy@aspenx.cloud
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">6. Your rights</h2>
            <p>
              Depending on your jurisdiction, you may have rights to access, correct, or delete your
              personal data, or to object to or restrict certain processing. To exercise these rights,
              contact us at{' '}
              <a href="mailto:privacy@aspenx.cloud" className="text-cyan-400 hover:text-cyan-300">
                privacy@aspenx.cloud
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">7. Cookies</h2>
            <p>
              This site uses minimal cookies — primarily those set by Google Firebase for authentication
              session management and by Stripe for payment processing. We do not use tracking cookies
              for advertising.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">8. Changes to this policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Material changes will be indicated
              by updating the "Last updated" date at the top of this page. Continued use of the service
              after changes constitutes acceptance of the updated policy.
            </p>
          </section>

        </div>
      </main>

      <PolicyFooter />
    </div>
  );
}

export function PolicyFooter() {
  return (
    <footer className="border-t border-slate-800 mt-16 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-slate-700">© {new Date().getFullYear()} AspenX.cloud</p>
        <div className="flex gap-5 text-xs text-slate-600">
          <Link to="/privacy" className="hover:text-slate-400 transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-slate-400 transition-colors">Terms of Service</Link>
          <Link to="/refund-policy" className="hover:text-slate-400 transition-colors">Refund Policy</Link>
        </div>
      </div>
    </footer>
  );
}
