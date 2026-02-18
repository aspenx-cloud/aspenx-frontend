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
  "selections": ["traffic-medium", "style-website-api", "data-sql"],
  "addons": { "cicd": true, "support": false },
  "userEmail": "user@example.com"
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
│   ├── BuilderPage.tsx      # Drag-and-drop recipe builder
│   └── AccountPage.tsx      # User profile + orders
├── components/
│   ├── Navbar.tsx
│   ├── AuthButton.tsx
│   ├── Modal.tsx
│   ├── TierCard.tsx         # Pricing tier cards
│   ├── DragCard.tsx         # Draggable recipe item card
│   ├── DropCanvas.tsx       # Drop zone canvas
│   ├── BuilderTopic.tsx     # Topic group with collapsible cards
│   ├── SummaryPanel.tsx     # Left panel: selections, add-ons, CTA
│   └── EstimateBox.tsx      # Price breakdown widget
└── lib/
    ├── types.ts             # TypeScript types
    ├── mappings.ts          # Topic/item definitions + AWS hint text
    ├── pricing.ts           # Estimate logic + pricing constants
    ├── storage.ts           # localStorage helpers
    └── firebase.ts          # Firebase init
```

### Tuning pricing

All pricing constants live in `src/lib/pricing.ts`. Edit `BASE_FEES`, `ITEM_FEES`, and `ADDON_FEES` to adjust starting prices and per-item add-on costs for each tier.

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
