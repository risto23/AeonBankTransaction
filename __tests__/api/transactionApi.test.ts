import NetInfo from '@react-native-community/netinfo';
import { NetworkError } from '@/api/errors';
import { generateMockTransactions } from '@/api/mockData';
import { fetchTransactions, PAGE_SIZE } from '@/api/transactionApi';
import type { Transaction } from '@/types/transaction';
import { summarize } from '@/utils/transaction';

const fetchPage = (cursor: string | null = null) =>
  fetchTransactions({ cursor, latencyMs: 0 });

const isNewestFirst = (transactions: Transaction[]) =>
  transactions.every(
    (t, i) => i === 0 || transactions[i - 1].transferDate >= t.transferDate,
  );

describe('fetchTransactions', () => {
  it('returns the first page newest first with a cursor', async () => {
    const result = await fetchPage();

    expect(result.data).toHaveLength(PAGE_SIZE);
    expect(result.data[0].refId).toBe('123ABC');
    expect(isNewestFirst(result.data)).toBe(true);
    expect(result.nextCursor).toBe(result.data[PAGE_SIZE - 1].refId);
  });

  it('pages through all 10,000 transactions without gaps or duplicates', async () => {
    const all: Transaction[] = [];
    let cursor: string | null = null;
    let pages = 0;

    do {
      const result = await fetchPage(cursor);
      all.push(...result.data);
      cursor = result.nextCursor;
      pages++;
    } while (cursor);

    expect(all).toHaveLength(10_000);
    expect(new Set(all.map(t => t.refId)).size).toBe(10_000);
    expect(isNewestFirst(all)).toBe(true);
    expect(pages).toBe(Math.ceil(10_000 / PAGE_SIZE));
  });

  it('returns the summary for the whole history on every page', async () => {
    const firstPage = await fetchPage();
    const secondPage = await fetchPage(firstPage.nextCursor);

    expect(firstPage.summary).toEqual(secondPage.summary);
    expect(firstPage.summary.incoming).toBeGreaterThan(
      summarize(firstPage.data).incoming,
    );
  });

  it('fails with a NetworkError while offline', async () => {
    jest.mocked(NetInfo.fetch).mockResolvedValueOnce({
      isConnected: false,
      isInternetReachable: false,
    } as Awaited<ReturnType<typeof NetInfo.fetch>>);

    const error = await fetchPage().catch(e => e);

    expect(error).toBeInstanceOf(NetworkError);
    expect(error.message).toMatch('No internet connection');
  });

  it('rejects a cursor it does not know', async () => {
    await expect(fetchPage('does-not-exist')).rejects.toThrow(
      'no longer available',
    );
  });
});

describe('generateMockTransactions', () => {
  it('is deterministic for the same seed', () => {
    expect(generateMockTransactions(50)).toEqual(generateMockTransactions(50));
  });

  it('produces amounts with at most two decimals', () => {
    for (const { amount } of generateMockTransactions(500)) {
      expect(Math.round(amount * 100) / 100).toBe(amount);
    }
  });
});
