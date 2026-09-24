import { fetchTransactions } from '@/api/transactionApi';
import { mockTransactionResponse } from '@/api/mockData';
import {
  selectTransactionById,
  useTransactionStore,
} from '@/store/useTransactionStore';

jest.mock('@/api/transactionApi');

const mockedFetch = jest.mocked(fetchTransactions);

describe('useTransactionStore', () => {
  beforeEach(() => {
    useTransactionStore.getState().reset();
    mockedFetch.mockReset();
  });

  it('loads and sorts transactions newest first', async () => {
    mockedFetch.mockResolvedValue(mockTransactionResponse.data);

    await useTransactionStore.getState().loadTransactions();

    const state = useTransactionStore.getState();
    expect(state.status).toBe('success');
    expect(state.error).toBeNull();
    expect(state.transactions.map(t => t.refId)).toEqual([
      '123ABC',
      '789GHI',
      '456DEF',
      '101JKL',
    ]);
  });

  it('exposes the loading status while fetching', async () => {
    mockedFetch.mockResolvedValue([]);

    const pending = useTransactionStore.getState().loadTransactions();
    expect(useTransactionStore.getState().status).toBe('loading');
    await pending;
  });

  it('uses the refreshing status for pull-to-refresh', async () => {
    mockedFetch.mockResolvedValue([]);

    const pending = useTransactionStore
      .getState()
      .loadTransactions({ refresh: true });
    expect(useTransactionStore.getState().status).toBe('refreshing');
    await pending;
  });

  it('ignores a second load while one is in flight', async () => {
    mockedFetch.mockResolvedValue([]);

    const { loadTransactions } = useTransactionStore.getState();
    await Promise.all([loadTransactions(), loadTransactions()]);

    expect(mockedFetch).toHaveBeenCalledTimes(1);
  });

  it('stores the error message when fetching fails', async () => {
    mockedFetch.mockRejectedValue(new Error('Network down'));

    await useTransactionStore.getState().loadTransactions();

    const state = useTransactionStore.getState();
    expect(state.status).toBe('error');
    expect(state.error).toBe('Network down');
  });

  it('selects a transaction by reference ID', async () => {
    mockedFetch.mockResolvedValue(mockTransactionResponse.data);
    await useTransactionStore.getState().loadTransactions();

    const state = useTransactionStore.getState();
    expect(selectTransactionById('456DEF')(state)?.recipientName).toBe(
      'Jane Smith',
    );
    expect(selectTransactionById('nope')(state)).toBeUndefined();
  });
});
