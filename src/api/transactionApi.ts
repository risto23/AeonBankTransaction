import NetInfo from '@react-native-community/netinfo';
import type { Transaction, TransactionPage } from '@/types/transaction';
import { sortByDateDesc, summarize } from '@/utils/transaction';
import { NetworkError, TimeoutError } from './errors';
import { generateMockTransactions, mockTransactionResponse } from './mockData';

export const PAGE_SIZE = 30;

const MOCK_LATENCY_MS = 800;
const MOCK_TOTAL_TRANSACTIONS = 10_000;
const REQUEST_TIMEOUT_MS = 10_000;

export interface FetchTransactionsParams {
  /** Cursor from the previous page; omit for the first page. */
  cursor?: string | null;
  limit?: number;
  latencyMs?: number;
}

/**
 * Fetches one page of the customer's transactions, newest first.
 *
 * Backed by an in-memory mock "server" for now; swap the body of
 * `mockRequest` for a real HTTP call (e.g.
 * `fetch(`${API_URL}/transactions?cursor=${cursor}&limit=${limit}`)`)
 * without touching any callers.
 */
export function fetchTransactions({
  cursor = null,
  limit = PAGE_SIZE,
  latencyMs = MOCK_LATENCY_MS,
}: FetchTransactionsParams = {}): Promise<TransactionPage> {
  return withTimeout(mockRequest(cursor, limit, latencyMs), REQUEST_TIMEOUT_MS);
}

async function mockRequest(
  cursor: string | null,
  limit: number,
  latencyMs: number,
): Promise<TransactionPage> {
  if (latencyMs > 0) {
    await delay(latencyMs);
  }

  // A real request fails on its own when the device is offline; the mock
  // has to check explicitly so offline behaviour can be tried out.
  const { isConnected, isInternetReachable } = await NetInfo.fetch();
  if (isConnected === false || isInternetReachable === false) {
    throw new NetworkError();
  }

  const db = getMockDatabase();
  let start = 0;
  if (cursor) {
    const index = db.indexById.get(cursor);
    if (index === undefined) {
      throw new Error('This page is no longer available. Please refresh.');
    }
    start = index + 1;
  }

  const data = db.transactions.slice(start, start + limit);
  const hasMore = start + limit < db.transactions.length;

  return {
    data,
    nextCursor: hasMore ? data[data.length - 1].refId : null,
    summary: db.summary,
  };
}

interface MockDatabase {
  transactions: Transaction[];
  indexById: Map<string, number>;
  summary: TransactionPage['summary'];
}

let mockDatabase: MockDatabase | null = null;

/** Built lazily on the first request, the way a server would index its table. */
function getMockDatabase(): MockDatabase {
  if (!mockDatabase) {
    const sample = mockTransactionResponse.data;
    const transactions = sortByDateDesc([
      ...sample,
      ...generateMockTransactions(MOCK_TOTAL_TRANSACTIONS - sample.length),
    ]);
    mockDatabase = {
      transactions,
      indexById: new Map(transactions.map((t, i) => [t.refId, i])),
      summary: summarize(transactions),
    };
  }
  return mockDatabase;
}

const delay = (ms: number) =>
  new Promise<void>(resolve => setTimeout(resolve, ms));

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError()), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
