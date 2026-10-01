/**
 * Shape of a single transaction as returned by the backend.
 */
export interface Transaction {
  refId: string;
  /** ISO-8601 timestamp in UTC, e.g. `2024-10-15T12:34:56Z`. */
  transferDate: string;
  recipientName: string;
  transferName: string;
  /** Positive for incoming funds, negative for outgoing funds. */
  amount: number;
}

export interface TransactionListResponse {
  data: Transaction[];
}

export interface TransactionSummary {
  incoming: number;
  outgoing: number;
}

/**
 * One page of the transaction history, newest first.
 *
 * `nextCursor` is opaque to the client: pass it back to get the next page.
 * `null` means there are no more pages. `summary` covers the whole history,
 * not just this page, so it is computed by the server.
 */
export interface TransactionPage {
  data: Transaction[];
  nextCursor: string | null;
  summary: TransactionSummary;
}

export type TransactionDirection = 'incoming' | 'outgoing';
