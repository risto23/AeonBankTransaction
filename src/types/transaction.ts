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

export type TransactionDirection = 'incoming' | 'outgoing';
