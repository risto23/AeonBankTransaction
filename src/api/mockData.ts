import type { Transaction, TransactionListResponse } from '@/types/transaction';

/**
 * Sample payload provided by the backend team.
 */
export const mockTransactionResponse: TransactionListResponse = {
  data: [
    {
      refId: '123ABC',
      transferDate: '2024-10-15T12:34:56Z',
      recipientName: 'John Doe',
      transferName: 'Salary Payment',
      amount: 1500.0,
    },
    {
      refId: '456DEF',
      transferDate: '2024-09-21T09:12:45Z',
      recipientName: 'Jane Smith',
      transferName: 'Invoice Payment',
      amount: 2300.75,
    },
    {
      refId: '789GHI',
      transferDate: '2024-10-05T16:18:30Z',
      recipientName: 'Robert Brown',
      transferName: 'Refund',
      amount: -500.0,
    },
    {
      refId: '101JKL',
      transferDate: '2024-08-30T11:47:22Z',
      recipientName: 'Emily Davis',
      transferName: 'Bonus Payment',
      amount: 1200.0,
    },
  ],
};

const RECIPIENTS = [
  'John Doe',
  'Jane Smith',
  'Robert Brown',
  'Emily Davis',
  'Ahmad Faizal',
  'Siti Aminah',
  'Tan Wei Ming',
  'Priya Nair',
  'Lim Mei Ling',
  'Muhammad Hafiz',
];

const INCOMING_NAMES = [
  'Salary Payment',
  'Bonus Payment',
  'Refund Received',
  'Transfer In',
  'Cashback',
];

const OUTGOING_NAMES = [
  'Invoice Payment',
  'Bill Payment',
  'Transfer Out',
  'Online Purchase',
  'Refund',
];

/**
 * Small seeded PRNG (Park-Miller) so the generated data is the same every
 * run. Returns numbers in [0, 1).
 */
function createRandom(seed: number) {
  let state = seed % 2147483647 || 1;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

/**
 * Generates `count` realistic-looking transactions going back in time from
 * `startDate`, roughly one every few hours. Used to exercise pagination and
 * list performance with a large history.
 */
export function generateMockTransactions(
  count: number,
  startDate = '2024-10-14T23:00:00Z',
  seed = 42,
): Transaction[] {
  const random = createRandom(seed);
  const pick = <T>(items: T[]) => items[Math.floor(random() * items.length)];

  const transactions: Transaction[] = [];
  let time = new Date(startDate).getTime();

  for (let i = 0; i < count; i++) {
    time -= Math.floor((1 + random() * 5) * 60 * 60 * 1000);
    const isIncoming = random() < 0.35;
    const cents = Math.floor((5 + random() * 2995) * 100);

    transactions.push({
      refId: `TX${String(i + 1).padStart(6, '0')}`,
      transferDate: new Date(time).toISOString().replace('.000Z', 'Z'),
      recipientName: pick(RECIPIENTS),
      transferName: pick(isIncoming ? INCOMING_NAMES : OUTGOING_NAMES),
      amount: (isIncoming ? cents : -cents) / 100,
    });
  }

  return transactions;
}
