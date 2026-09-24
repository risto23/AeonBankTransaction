import {
  formatCurrency,
  formatDateTime,
  formatMonthYear,
  formatShortDate,
  formatSignedCurrency,
} from '@/utils/format';

// Jest runs with TZ=UTC (see jest.config.js).

describe('formatCurrency', () => {
  it.each([
    [1500, 'RM 1,500.00'],
    [2300.75, 'RM 2,300.75'],
    [0, 'RM 0.00'],
    [1234567.891, 'RM 1,234,567.89'],
    [-500, 'RM 500.00'],
  ])('formats %p as %p', (amount, expected) => {
    expect(formatCurrency(amount)).toBe(expected);
  });
});

describe('formatSignedCurrency', () => {
  it('prefixes incoming amounts with +', () => {
    expect(formatSignedCurrency(1200)).toBe('+RM 1,200.00');
  });

  it('prefixes outgoing amounts with -', () => {
    expect(formatSignedCurrency(-500)).toBe('-RM 500.00');
  });
});

describe('date formatting', () => {
  const iso = '2024-10-15T12:34:56Z';

  it('formats a short date', () => {
    expect(formatShortDate(iso)).toBe('15 Oct 2024');
  });

  it('formats a date with time', () => {
    expect(formatDateTime(iso)).toBe('15 Oct 2024, 12:34 PM');
  });

  it('formats month and year', () => {
    expect(formatMonthYear(iso)).toBe('October 2024');
  });
});
