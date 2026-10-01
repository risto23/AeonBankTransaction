import { create } from 'zustand';
import { fetchTransactions } from '@/api/transactionApi';
import type {
  Transaction,
  TransactionPage,
  TransactionSummary,
} from '@/types/transaction';

type Status = 'idle' | 'loading' | 'refreshing' | 'success' | 'error';

interface TransactionState {
  /** Loaded pages, newest first, in the order the server returned them. */
  transactions: Transaction[];
  /** Same transactions keyed by refId for O(1) lookups. */
  byId: Record<string, Transaction>;
  /** Totals for the whole history, from the server. */
  summary: TransactionSummary | null;
  nextCursor: string | null;
  /** Status of the first page / pull-to-refresh. */
  status: Status;
  error: string | null;
  isLoadingMore: boolean;
  loadMoreError: string | null;
  loadTransactions: (options?: { refresh?: boolean }) => Promise<void>;
  loadMore: () => Promise<void>;
  reset: () => void;
}

const initialState: Pick<
  TransactionState,
  | 'transactions'
  | 'byId'
  | 'summary'
  | 'nextCursor'
  | 'status'
  | 'error'
  | 'isLoadingMore'
  | 'loadMoreError'
> = {
  transactions: [],
  byId: {},
  summary: null,
  nextCursor: null,
  status: 'idle',
  error: null,
  isLoadingMore: false,
  loadMoreError: null,
};

/**
 * Bumped whenever the list starts over (first load, refresh, reset). A
 * response that comes back for an older generation is dropped, so a slow
 * "load more" can't append a stale page onto a freshly refreshed list.
 */
let generation = 0;

const toMessage = (e: unknown) =>
  e instanceof Error ? e.message : 'Something went wrong.';

const indexById = (transactions: Transaction[]) =>
  Object.fromEntries(transactions.map(t => [t.refId, t]));

export const useTransactionStore = create<TransactionState>()((set, get) => ({
  ...initialState,

  loadTransactions: async ({ refresh = false } = {}) => {
    const { status } = get();
    if (status === 'loading' || status === 'refreshing') {
      return;
    }

    const requestGeneration = ++generation;
    set({
      status: refresh ? 'refreshing' : 'loading',
      error: null,
      isLoadingMore: false,
      loadMoreError: null,
    });

    let page: TransactionPage;
    try {
      page = await fetchTransactions();
    } catch (e) {
      if (requestGeneration === generation) {
        // Previously loaded transactions are kept, so the list stays usable
        // while offline; the screen shows the error alongside them.
        set({ status: 'error', error: toMessage(e) });
      }
      return;
    }

    if (requestGeneration !== generation) {
      return;
    }
    set({
      transactions: page.data,
      byId: indexById(page.data),
      summary: page.summary,
      nextCursor: page.nextCursor,
      status: 'success',
    });
  },

  loadMore: async () => {
    const { nextCursor, isLoadingMore, status } = get();
    if (
      !nextCursor ||
      isLoadingMore ||
      status === 'loading' ||
      status === 'refreshing'
    ) {
      return;
    }

    const requestGeneration = generation;
    set({ isLoadingMore: true, loadMoreError: null });

    let page: TransactionPage;
    try {
      page = await fetchTransactions({ cursor: nextCursor });
    } catch (e) {
      if (requestGeneration === generation) {
        set({ isLoadingMore: false, loadMoreError: toMessage(e) });
      }
      return;
    }

    if (requestGeneration !== generation) {
      return;
    }
    const { transactions, byId } = get();
    // Guard against duplicates if the server's pages ever overlap.
    const fresh = page.data.filter(t => !byId[t.refId]);
    set({
      transactions: [...transactions, ...fresh],
      byId: { ...byId, ...indexById(fresh) },
      summary: page.summary,
      nextCursor: page.nextCursor,
      isLoadingMore: false,
    });
  },

  reset: () => {
    generation++;
    set(initialState);
  },
}));

/** Selects a single transaction by its reference ID. */
export const selectTransactionById =
  (refId: string) => (state: TransactionState) =>
    state.byId[refId];

export const selectHasMore = (state: TransactionState) =>
  state.nextCursor !== null;
