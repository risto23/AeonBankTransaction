import type { Transaction, TransactionPage } from '@/types/transaction';
import { summarize } from '@/utils/transaction';

/** Builds an API page response around the given transactions. */
export const page = (
  data: Transaction[],
  nextCursor: string | null = null,
): TransactionPage => ({ data, nextCursor, summary: summarize(data) });

/** A promise that can be settled from the outside, for ordering tests. */
export function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
