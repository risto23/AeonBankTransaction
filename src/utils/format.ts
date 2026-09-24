import dayjs from 'dayjs';
import { CURRENCY_SYMBOL } from '@/constants/locale';

const toFixedWithGrouping = (value: number) =>
  value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/**
 * Formats an amount as currency, e.g. `1500` -> `RM 1,500.00`.
 *
 * Implemented manually instead of `Intl.NumberFormat` because Hermes on
 * older Android builds ships with limited `Intl` locale data.
 */
export function formatCurrency(amount: number): string {
  return `${CURRENCY_SYMBOL} ${toFixedWithGrouping(Math.abs(amount))}`;
}

/**
 * Formats an amount with an explicit direction sign,
 * e.g. `1500` -> `+RM 1,500.00`, `-500` -> `-RM 500.00`.
 */
export function formatSignedCurrency(amount: number): string {
  const sign = amount < 0 ? '-' : '+';
  return `${sign}${formatCurrency(amount)}`;
}

/** `2024-10-15T12:34:56Z` -> `15 Oct 2024` (device local time). */
export function formatShortDate(isoDate: string): string {
  return dayjs(isoDate).format('D MMM YYYY');
}

/** `2024-10-15T12:34:56Z` -> `15 Oct 2024, 12:34 PM` (device local time). */
export function formatDateTime(isoDate: string): string {
  return dayjs(isoDate).format('D MMM YYYY, h:mm A');
}

/** `2024-10-15T12:34:56Z` -> `October 2024` (device local time). */
export function formatMonthYear(isoDate: string): string {
  return dayjs(isoDate).format('MMMM YYYY');
}
