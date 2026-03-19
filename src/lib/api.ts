import type { CustomerDetails } from './types';

export const API_BASE =
  import.meta.env.VITE_API_BASE_URL ??
  'https://vq2d5twmbk.execute-api.us-east-1.amazonaws.com';

// ─── Backend order types ───────────────────────────────────────────────────────

export type BackendOrderStatus = 'pending_payment' | 'paid' | 'cancelled' | 'refunded';

export type ProvisioningStatus =
  | 'not_started'
  | 'queued'
  | 'in_progress'
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
  customer?: CustomerDetails;
  addons?: { cicd: boolean; support: boolean };
  awsAccountId?: string;
}

// ─── Fetch helpers ─────────────────────────────────────────────────────────────

/** Fetch all orders for the authenticated user.
 *  Passes Firebase ID token as Bearer; returns [] on any error. */
export async function fetchBackendOrders(idToken: string): Promise<BackendOrder[]> {
  try {
    const res = await fetch(`${API_BASE}/orders`, {
      headers: { Authorization: `Bearer ${idToken}` },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : (data.orders ?? []);
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
