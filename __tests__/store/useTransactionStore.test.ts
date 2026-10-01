import { fetchTransactions } from '@/api/transactionApi';
import { mockTransactionResponse } from '@/api/mockData';
import {
  selectHasMore,
  selectTransactionById,
  useTransactionStore,
} from '@/store/useTransactionStore';
import type { TransactionPage } from '@/types/transaction';
import { sortByDateDesc } from '@/utils/transaction';
import { deferred, page } from '../helpers';

jest.mock('@/api/transactionApi');

const mockedFetch = jest.mocked(fetchTransactions);

const [first, second, third, fourth] = sortByDateDesc(
  mockTransactionResponse.data,
);
const getState = () => useTransactionStore.getState();

describe('useTransactionStore', () => {
  beforeEach(() => {
    getState().reset();
    mockedFetch.mockReset();
  });

  describe('loadTransactions', () => {
    it('stores the first page, the summary and the next cursor', async () => {
      mockedFetch.mockResolvedValue(page([first, second], second.refId));

      await getState().loadTransactions();

      const state = getState();
      expect(state.status).toBe('success');
      expect(state.error).toBeNull();
      expect(state.transactions).toEqual([first, second]);
      expect(state.summary).toEqual(page([first, second]).summary);
      expect(state.nextCursor).toBe(second.refId);
      expect(selectHasMore(state)).toBe(true);
    });

    it('exposes the loading status while fetching', async () => {
      mockedFetch.mockResolvedValue(page([]));

      const pending = getState().loadTransactions();
      expect(getState().status).toBe('loading');
      await pending;
    });

    it('uses the refreshing status for pull-to-refresh', async () => {
      mockedFetch.mockResolvedValue(page([]));

      const pending = getState().loadTransactions({ refresh: true });
      expect(getState().status).toBe('refreshing');
      await pending;
    });

    it('ignores a second load while one is in flight', async () => {
      mockedFetch.mockResolvedValue(page([]));

      const { loadTransactions } = getState();
      await Promise.all([loadTransactions(), loadTransactions()]);

      expect(mockedFetch).toHaveBeenCalledTimes(1);
    });

    it('stores the error message when fetching fails', async () => {
      mockedFetch.mockRejectedValue(new Error('Network down'));

      await getState().loadTransactions();

      const state = getState();
      expect(state.status).toBe('error');
      expect(state.error).toBe('Network down');
    });

    it('keeps the loaded transactions when a refresh fails', async () => {
      mockedFetch.mockResolvedValueOnce(page([first, second]));
      await getState().loadTransactions();

      mockedFetch.mockRejectedValueOnce(new Error('No internet connection.'));
      await getState().loadTransactions({ refresh: true });

      const state = getState();
      expect(state.status).toBe('error');
      expect(state.error).toBe('No internet connection.');
      expect(state.transactions).toEqual([first, second]);
    });

    it('replaces the list with the first page on refresh', async () => {
      mockedFetch.mockResolvedValueOnce(page([first], first.refId));
      await getState().loadTransactions();
      mockedFetch.mockResolvedValueOnce(page([second], null));
      await getState().loadMore();

      mockedFetch.mockResolvedValueOnce(page([first], first.refId));
      await getState().loadTransactions({ refresh: true });

      expect(getState().transactions).toEqual([first]);
      expect(getState().nextCursor).toBe(first.refId);
    });
  });

  describe('loadMore', () => {
    beforeEach(async () => {
      mockedFetch.mockResolvedValueOnce(page([first, second], second.refId));
      await getState().loadTransactions();
    });

    it('appends the next page using the cursor', async () => {
      mockedFetch.mockResolvedValueOnce(page([third, fourth], null));

      const pending = getState().loadMore();
      expect(getState().isLoadingMore).toBe(true);
      await pending;

      const state = getState();
      expect(mockedFetch).toHaveBeenLastCalledWith({ cursor: second.refId });
      expect(state.transactions).toEqual([first, second, third, fourth]);
      expect(state.isLoadingMore).toBe(false);
      expect(selectHasMore(state)).toBe(false);
    });

    it('skips transactions that are already loaded', async () => {
      mockedFetch.mockResolvedValueOnce(page([second, third], null));

      await getState().loadMore();

      expect(getState().transactions).toEqual([first, second, third]);
    });

    it('does nothing when there are no more pages', async () => {
      mockedFetch.mockResolvedValueOnce(page([third], null));
      await getState().loadMore();
      mockedFetch.mockClear();

      await getState().loadMore();

      expect(mockedFetch).not.toHaveBeenCalled();
    });

    it('ignores a second call while a page is in flight', async () => {
      mockedFetch.mockClear();
      mockedFetch.mockResolvedValue(page([third], null));

      await Promise.all([getState().loadMore(), getState().loadMore()]);

      expect(mockedFetch).toHaveBeenCalledTimes(1);
    });

    it('keeps the list and stores the error when a page fails', async () => {
      mockedFetch.mockRejectedValueOnce(new Error('No internet connection.'));

      await getState().loadMore();

      const state = getState();
      expect(state.loadMoreError).toBe('No internet connection.');
      expect(state.isLoadingMore).toBe(false);
      expect(state.transactions).toEqual([first, second]);
      expect(state.nextCursor).toBe(second.refId);
    });

    it('drops a page that arrives after the list was refreshed', async () => {
      const slowPage = deferred<TransactionPage>();
      mockedFetch.mockReturnValueOnce(slowPage.promise);
      const loadingMore = getState().loadMore();

      mockedFetch.mockResolvedValueOnce(page([first], first.refId));
      await getState().loadTransactions({ refresh: true });

      slowPage.resolve(page([third, fourth], null));
      await loadingMore;

      const state = getState();
      expect(state.transactions).toEqual([first]);
      expect(state.nextCursor).toBe(first.refId);
      expect(state.isLoadingMore).toBe(false);
    });
  });

  it('selects a transaction by reference ID', async () => {
    mockedFetch.mockResolvedValue(page(mockTransactionResponse.data));
    await getState().loadTransactions();

    const state = getState();
    expect(selectTransactionById('456DEF')(state)?.recipientName).toBe(
      'Jane Smith',
    );
    expect(selectTransactionById('nope')(state)).toBeUndefined();
  });
});
