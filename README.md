# AspenX.cloud — Frontend

Production React frontend for **AspenX.cloud**, a DevOps-as-a-Service platform. Users describe the shape of their web app using a drag-and-drop recipe builder, select a delivery tier, and check out via Stripe.

## Tech Stack

| Layer | Technology |
|---|---|
| UI framework | React 18 + TypeScript |
| Build tool | Vite 5 |
| Routing | React Router v6 (HashRouter) |
| Styling | Tailwind CSS v3 |
| Drag & drop | @dnd-kit/core |
| Auth | Firebase Google Sign-In |
| Payments | Stripe Checkout (backend redirect) |
| Deploy | GitHub Actions → GitHub Pages |

---

## Delivery Tiers

AspenX offers three delivery models. All use the same drag-and-drop recipe builder.

### Tier 1 — Deploy into your AWS account (One-time)

- **You need:** An existing AWS account.
- **How it works:** You run a one-time bootstrap script that creates an IAM cross-account role in your account. AspenX uses that role to deploy the chosen architecture on your behalf.
- **Who owns the AWS account:** You — from day one.
- **Who pays AWS:** You pay Amazon directly for any usage. AspenX charges a one-time delivery fee.
- **Gating:** Requires a valid 12-digit AWS Account ID and a confirmation checkbox before checkout.

### Tier 2 — Managed DevOps (Monthly)

- **You need:** Nothing — no AWS account required.
- **How it works:** AspenX provisions a dedicated AWS account under AspenX's own billing. You get limited-access IAM roles to deploy and view your app. AspenX manages patching, updates, and infrastructure changes.
- **Who owns the AWS account:** AspenX owns and manages the account.
- **Who pays AWS:** AspenX pays AWS and invoices you a monthly all-inclusive subscription.
- **Optional add-on:** Support & infra changes (additional monthly fee).

### Tier 3 — Terraform Kit (One-time)

- **You need:** An AWS account (existing or new — you decide).
- **How it works:** AspenX delivers production-ready Terraform modules and step-by-step deployment instructions based on your recipe. You run `terraform apply` — you own the result.
- **Who owns the AWS account:** You.
- **Who pays AWS:** You pay Amazon directly. AspenX charges a one-time IaC delivery fee.
- **Optional field:** Provide your existing AWS Account ID to help tailor the Terraform output.

---

## Region Selection & AWS Cost Estimates

The Builder page includes a **Region selector** (dropdown) that lets you choose which AWS region to target. Available regions:

| Region code | Label |
|---|---|
| `us-east-1` | US East (N. Virginia) — baseline |
| `us-west-2` | US West (Oregon) |
| `eu-west-1` | EU (Ireland) |
| `eu-central-1` | EU (Frankfurt) |
| `ap-southeast-1` | Asia Pacific (Singapore) |

**Important:** Region selection currently affects only the **AWS usage estimate** shown in the UI, via a placeholder regional multiplier table in `src/lib/pricing.ts`. It is **not** real AWS pricing. Real regional pricing will be provided later via a backend pricing service.

> "Estimate only. Real AWS costs vary by usage and region."

---

## Price Model

The estimate box shows **two separate figures**:

1. **AspenX fee** — what the customer pays AspenX (our delivery/management fee).
2. **Estimated AWS monthly usage** — indicative cost the customer will pay Amazon (Tier 1 & 3) or that is bundled into the AspenX subscription (Tier 2).

### AspenX fee structure

| Tier | Type | Base starts at |
|---|---|---|
| 1 | One-time | $1,500 |
| 2 | Monthly | $299/mo |
| 3 | One-time | $499 |

Per-item add-ons and the CI/CD pipeline option are itemised in the breakdown. See `src/lib/pricing.ts` → `BASE_FEES`, `ITEM_FEES`, `ADDON_FEES` to tune constants.

---

## Local Development

### 1. Clone and install

```bash
git clone https://github.com/aspenx-cloud/aspenx-frontend.git
cd aspenx-frontend
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in your Firebase project values (see [Firebase setup](#firebase-setup) below).

The app runs without Firebase configured — auth features will be disabled but the recipe builder and pricing estimator work fully.

### 3. Start dev server

```bash
npm run dev
```

Visit `http://localhost:5173`

### 4. Build for production

```bash
npm run build
npm run preview   # optional local preview of built output
```

---

## Firebase Setup

> Auth is optional during development. Without Firebase, the sign-in button shows a configuration message.

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and create a project.
2. Enable **Authentication → Sign-in method → Google**.
3. Add **Authorized domains**:
   - `localhost` (for local dev)
   - `aspenx-cloud.github.io` (GitHub Pages default)
   - `aspenx.cloud` (if using a custom domain)
4. In **Project settings → General → Your apps**, register a Web app and copy the config values.
5. Paste the values into `.env.local`:

```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

---

## GitHub Actions Deployment

The workflow at `.github/workflows/deploy.yml` automatically builds and deploys to GitHub Pages on every push to `main`.

### One-time GitHub setup

1. In your repo: **Settings → Pages → Source → GitHub Actions**.
2. Add repository secrets (**Settings → Secrets and variables → Actions**) for each `VITE_FIREBASE_*` variable listed in `.env.example`.

### Custom domain

If you deploy to `aspenx.cloud` instead of `aspenx-cloud.github.io/aspenx-frontend/`:

1. Set `VITE_BASE_PATH: /` in the workflow env block.
2. Add a `CNAME` file to the `public/` directory containing `aspenx.cloud`.
3. Configure your DNS: `CNAME aspenx.cloud → aspenx-cloud.github.io`.

---

## Stripe Checkout (Backend Stub)

The checkout button calls:

```
POST https://api.aspenx.cloud/stripe/create-checkout-session
Content-Type: application/json

{
  "tier": 2,
  "region": "us-east-1",
  "selections": ["traffic-medium", "style-website-api", "data-sql"],
  "addons": { "cicd": true, "support": false },
  "aspenxPrice": { "monthly": 507, "oneTime": 500 },
  "awsEstimate": 600,
  "userEmail": "user@example.com",
  // Tier 1 only:
  "awsAccountId": "123456789012"
}
```

Expected response:

```json
{ "url": "https://checkout.stripe.com/pay/..." }
```

The frontend redirects the user to the Stripe URL. **No Stripe keys live in the frontend.** Implement this endpoint in your backend and keep the secret key server-side only.

---

## Project Structure

```
src/
├── pages/
│   ├── LandingPage.tsx      # Hero, pricing tiers, about, contact
│   ├── BuilderPage.tsx      # Drag-and-drop recipe builder + region selector
│   └── AccountPage.tsx      # User profile + orders
├── components/
│   ├── Navbar.tsx
│   ├── AuthButton.tsx
│   ├── Modal.tsx
│   ├── TierCard.tsx         # Pricing tier cards (correct business model)
│   ├── DragCard.tsx         # Draggable recipe item card
│   ├── DropCanvas.tsx       # Drop zone canvas
│   ├── BuilderTopic.tsx     # Topic group with collapsible cards
│   ├── SummaryPanel.tsx     # Left panel: tier requirements, selections, add-ons, CTA
│   └── EstimateBox.tsx      # Split AspenX fee / AWS usage estimate widget
└── lib/
    ├── types.ts             # TypeScript types (incl. Region)
    ├── mappings.ts          # Topic/item definitions + AWS hint text
    ├── pricing.ts           # Estimate logic, region multipliers, pricing constants
    ├── storage.ts           # localStorage helpers
    └── firebase.ts          # Firebase init
```

### Tuning pricing

All pricing constants live in `src/lib/pricing.ts`:
- `BASE_FEES` — starting AspenX fee per tier
- `ITEM_FEES` — per-item AspenX add-on fees by tier
- `ADDON_FEES` — CI/CD and support add-on fees
- `AWS_ITEM_MONTHLY` — indicative AWS monthly cost per item (baseline, us-east-1)
- `REGION_MULTIPLIERS` — placeholder regional cost multipliers

Real regional pricing will be introduced via a backend pricing service in a future release.

---

## Routes

| Path | Description |
|---|---|
| `/` (hash: `#/`) | Landing page |
| `/builder?tier=1\|2\|3` | Recipe builder |
| `/account` | User account + orders |

HashRouter is used for GitHub Pages compatibility (no server-side routing required).

---

## Accessibility

- WCAG AA contrast on all text
- Full keyboard navigation (focus rings, `aria-label`, `role` attributes)
- Mobile-first responsive layout
- Drag-and-drop has click/tap fallback for touch and keyboard users

---

## License

MIT © AspenX.cloud
