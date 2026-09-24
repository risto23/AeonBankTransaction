import { create } from 'zustand';
import { fetchTransactions } from '@/api/transactionApi';
import type { Transaction } from '@/types/transaction';
import { sortByDateDesc } from '@/utils/transaction';

type Status = 'idle' | 'loading' | 'refreshing' | 'success' | 'error';

interface TransactionState {
  transactions: Transaction[];
  status: Status;
  error: string | null;
  loadTransactions: (options?: { refresh?: boolean }) => Promise<void>;
  reset: () => void;
}

const initialState: Pick<
  TransactionState,
  'transactions' | 'status' | 'error'
> = {
  transactions: [],
  status: 'idle',
  error: null,
};

export const useTransactionStore = create<TransactionState>()((set, get) => ({
  ...initialState,

  loadTransactions: async ({ refresh = false } = {}) => {
    const { status } = get();
    if (status === 'loading' || status === 'refreshing') {
      return;
    }

    set({ status: refresh ? 'refreshing' : 'loading', error: null });

    try {
      const transactions = await fetchTransactions();
      set({ transactions: sortByDateDesc(transactions), status: 'success' });
    } catch (e) {
      set({
        status: 'error',
        error: e instanceof Error ? e.message : 'Something went wrong.',
      });
    }
  },

  reset: () => set(initialState),
}));

/** Selects a single transaction by its reference ID. */
export const selectTransactionById =
  (refId: string) => (state: TransactionState) =>
    state.transactions.find(t => t.refId === refId);
