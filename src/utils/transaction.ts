import type {
  Transaction,
  TransactionDirection,
  TransactionSummary,
} from '@/types/transaction';
import {
  formatDateTime,
  formatMonthYear,
  formatSignedCurrency,
} from './format';

export interface TransactionSection {
  title: string;
  data: Transaction[];
}

export const getDirection = (amount: number): TransactionDirection =>
  amount < 0 ? 'outgoing' : 'incoming';

/** Newest first. Returns a new array; the input is left untouched. */
export const sortByDateDesc = (transactions: Transaction[]): Transaction[] =>
  [...transactions].sort(
    (a, b) =>
      new Date(b.transferDate).getTime() - new Date(a.transferDate).getTime(),
  );

/**
 * Groups already-sorted transactions into month sections for a SectionList.
 */
export function groupByMonth(
  transactions: Transaction[],
): TransactionSection[] {
  const sections: TransactionSection[] = [];

  for (const transaction of transactions) {
    const title = formatMonthYear(transaction.transferDate);
    const last = sections[sections.length - 1];

    if (last?.title === title) {
      last.data.push(transaction);
    } else {
      sections.push({ title, data: [transaction] });
    }
  }

  return sections;
}

/**
 * Totals incoming and outgoing amounts. Sums in cents so thousands of
 * additions don't pile up floating point error.
 */
export function summarize(transactions: Transaction[]): TransactionSummary {
  let incomingCents = 0;
  let outgoingCents = 0;

  for (const { amount } of transactions) {
    const cents = Math.round(Math.abs(amount) * 100);
    if (amount < 0) {
      outgoingCents += cents;
    } else {
      incomingCents += cents;
    }
  }

  return { incoming: incomingCents / 100, outgoing: outgoingCents / 100 };
}

/**
 * Plain-text receipt used as the message body when sharing.
 */
export function buildShareMessage(transaction: Transaction): string {
  return [
    'AEON Bank - Transaction Receipt',
    '',
    `Transfer: ${transaction.transferName}`,
    `Amount: ${formatSignedCurrency(transaction.amount)}`,
    `Recipient: ${transaction.recipientName}`,
    `Date: ${formatDateTime(transaction.transferDate)}`,
    `Reference ID: ${transaction.refId}`,
  ].join('\n');
}
