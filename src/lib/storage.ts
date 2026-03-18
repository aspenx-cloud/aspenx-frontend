import type { BuilderState } from './types';

// Bump version key when shape changes to avoid stale data
const BUILDER_KEY = 'aspenx_builder_v2';
const ORDERS_KEY = 'aspenx_orders_v1';

// ─── Builder State ────────────────────────────────────────────────────────────

export function saveBuilderState(state: BuilderState): void {
  try {
    localStorage.setItem(BUILDER_KEY, JSON.stringify(state));
  } catch {
    // localStorage may be unavailable in some environments
  }
}

export function loadBuilderState(): BuilderState | null {
  try {
    const raw = localStorage.getItem(BUILDER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as BuilderState;
  } catch {
    return null;
  }
}

export function clearBuilderState(): void {
  try {
    localStorage.removeItem(BUILDER_KEY);
  } catch {
    // ignore
  }
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export interface Order {
  id: string;
  tier: number;
  createdAt: string;
  estimate: { setupFee: number; monthlyFee: number; awsMonthly: number };
  selections: string[];
  status: 'pending' | 'processing' | 'complete';
  // Optional: added for state restore (backward-compatible)
  region?: string;
  addons?: { cicd: boolean; support: boolean };
  awsAccountId?: string;
}

export function saveOrder(order: Order): void {
  try {
    const orders = loadOrders();
    orders.unshift(order);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch {
    // ignore
  }
}

export function deleteOrder(id: string): void {
  try {
    const orders = loadOrders().filter((o) => o.id !== id);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch {
    // ignore
  }
}

export function loadOrders(): Order[] {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Order[];
  } catch {
    return [];
  }
}
