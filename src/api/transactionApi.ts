import type { Transaction } from '@/types/transaction';
import { mockTransactionResponse } from './mockData';

const MOCK_LATENCY_MS = 800;

const delay = (ms: number) =>
  new Promise<void>(resolve => setTimeout(resolve, ms));

/**
 * Fetches the customer's latest transactions.
 *
 * Backed by a mock payload for now; swap the body for a real HTTP call
 * (e.g. `fetch(`${API_URL}/transactions`)`) without touching any callers.
 */
export async function fetchTransactions(
  latencyMs: number = MOCK_LATENCY_MS,
): Promise<Transaction[]> {
  await delay(latencyMs);
  return mockTransactionResponse.data;
}
