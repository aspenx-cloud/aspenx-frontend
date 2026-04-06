import type { CustomerDetails } from './types';

export const API_BASE =
  import.meta.env.VITE_API_BASE_URL ??
  'https://api.aspenx.cloud';

// ─── Backend order types ───────────────────────────────────────────────────────

export type BackendOrderStatus = 'pending_payment' | 'paid' | 'cancelled' | 'refunded';

export type ProvisioningStatus =
  | 'not_started'
  | 'queued'
  | 'in_progress'
  | 'in_review'
  | 'completed'
  | 'failed';

export interface BackendOrder {
  orderId: string;
  tier: number;
  region: string;
  status: BackendOrderStatus;
  provisioningStatus?: ProvisioningStatus;
  createdAt: string;
  selections: string[];
  estimate: { setupFee: number; monthlyFee: number; awsMonthly: number };
  /** Email of the user who placed this order — stored at order creation time. */
  userEmail?: string;
  customer?: CustomerDetails;
  addons?: { cicd: boolean; support: boolean };
  awsAccountId?: string;
}

// ─── Fetch helpers ─────────────────────────────────────────────────────────────

/**
 * Fetch orders from the backend.
 *
 * TEMPORARY MVP LIMITATION: GET /orders is not yet user-scoped on the backend
 * and returns all orders across all users. Until server-side filtering is
 * implemented, we apply a client-side email filter so users only see their own
 * orders. This assumes the backend stores `userEmail` on each order record
 * (it is sent in the POST /orders payload). Orders without a `userEmail` field
 * are excluded to avoid showing unrelated records.
 *
 * When the backend adds proper user scoping, remove the `userEmail` param and
 * the client-side filter below.
 */
export async function fetchBackendOrders(
  idToken: string,
  userEmail: string,
): Promise<BackendOrder[]> {
  try {
    const res = await fetch(`${API_BASE}/orders`, {
      headers: { Authorization: `Bearer ${idToken}` },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const all: BackendOrder[] = Array.isArray(data) ? data : (data.orders ?? []);

    // Client-side filter: only show orders belonging to the signed-in user.
    // TODO: remove once GET /orders is user-scoped on the backend.
    return all
      .filter((o) => o.userEmail?.toLowerCase() === userEmail.toLowerCase())
      .map((o) => ({
        ...o,
        selections: Array.isArray(o.selections) ? o.selections : [],
        estimate: o.estimate ?? { setupFee: 0, monthlyFee: 0, awsMonthly: 0 },
      }));
  } catch {
    return [];
  }
}

/** Fetch a single order by ID. Returns null on any error or 404. */
export async function fetchBackendOrder(
  orderId: string,
  idToken?: string,
): Promise<BackendOrder | null> {
  try {
    const headers: Record<string, string> = {};
    if (idToken) headers['Authorization'] = `Bearer ${idToken}`;
    const res = await fetch(`${API_BASE}/orders/${orderId}`, { headers });
    if (!res.ok) return null;
    return (await res.json()) as BackendOrder;
  } catch {
    return null;
  }
}
