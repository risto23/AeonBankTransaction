import { mockTransactionResponse } from '@/api/mockData';
import {
  buildShareMessage,
  getDirection,
  groupByMonth,
  sortByDateDesc,
  summarize,
} from '@/utils/transaction';

const transactions = mockTransactionResponse.data;

describe('getDirection', () => {
  it('treats positive and zero amounts as incoming', () => {
    expect(getDirection(10)).toBe('incoming');
    expect(getDirection(0)).toBe('incoming');
  });

  it('treats negative amounts as outgoing', () => {
    expect(getDirection(-10)).toBe('outgoing');
  });
});

describe('sortByDateDesc', () => {
  it('orders transactions newest first', () => {
    expect(sortByDateDesc(transactions).map(t => t.refId)).toEqual([
      '123ABC',
      '789GHI',
      '456DEF',
      '101JKL',
    ]);
  });

  it('does not mutate the input', () => {
    const input = [...transactions];
    sortByDateDesc(input);
    expect(input).toEqual(transactions);
  });
});

describe('groupByMonth', () => {
  it('groups sorted transactions into month sections', () => {
    const sections = groupByMonth(sortByDateDesc(transactions));

    expect(
      sections.map(s => ({
        title: s.title,
        ids: s.data.map(t => t.refId),
      })),
    ).toEqual([
      { title: 'October 2024', ids: ['123ABC', '789GHI'] },
      { title: 'September 2024', ids: ['456DEF'] },
      { title: 'August 2024', ids: ['101JKL'] },
    ]);
  });

  it('returns no sections for an empty list', () => {
    expect(groupByMonth([])).toEqual([]);
  });
});

describe('summarize', () => {
  it('totals incoming and outgoing amounts separately', () => {
    expect(summarize(transactions)).toEqual({
      incoming: 1500 + 2300.75 + 1200,
      outgoing: 500,
    });
  });
});

describe('buildShareMessage', () => {
  it('includes every detail field', () => {
    const message = buildShareMessage(transactions[2]);

    expect(message).toContain('Transfer: Refund');
    expect(message).toContain('Amount: -RM 500.00');
    expect(message).toContain('Recipient: Robert Brown');
    expect(message).toContain('Date: 5 Oct 2024, 4:18 PM');
    expect(message).toContain('Reference ID: 789GHI');
  });
});
