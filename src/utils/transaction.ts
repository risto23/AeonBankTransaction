import type { Transaction, TransactionDirection } from '@/types/transaction';
import {
  formatDateTime,
  formatMonthYear,
  formatSignedCurrency,
} from './format';

export interface TransactionSection {
  title: string;
  data: Transaction[];
}

export interface TransactionSummary {
  incoming: number;
  outgoing: number;
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

export function summarize(transactions: Transaction[]): TransactionSummary {
  return transactions.reduce<TransactionSummary>(
    (acc, { amount }) =>
      amount < 0
        ? { ...acc, outgoing: acc.outgoing + Math.abs(amount) }
        : { ...acc, incoming: acc.incoming + amount },
    { incoming: 0, outgoing: 0 },
  );
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
