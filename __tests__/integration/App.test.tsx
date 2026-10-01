import React, { useSyncExternalStore } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import Share from 'react-native-share';
import App from '../../App';
import { NetworkError } from '@/api/errors';
import { fetchTransactions } from '@/api/transactionApi';
import { mockTransactionResponse } from '@/api/mockData';
import { useTransactionStore } from '@/store/useTransactionStore';
import { sortByDateDesc } from '@/utils/transaction';
import { page } from '../helpers';

jest.mock('@/api/transactionApi');

const mockedFetch = jest.mocked(fetchTransactions);
const mockedUseNetInfo = jest.mocked(useNetInfo);

// A tiny external store standing in for NetInfo, so flipping the connection
// re-renders subscribed components the way the real hook does.
let netState = { isConnected: true, isInternetReachable: true };
const netListeners = new Set<() => void>();
const subscribeToNet = (listener: () => void) => {
  netListeners.add(listener);
  return () => netListeners.delete(listener);
};
mockedUseNetInfo.mockImplementation(
  () =>
    useSyncExternalStore(subscribeToNet, () => netState) as ReturnType<
      typeof useNetInfo
    >,
);

const setOnline = async (online: boolean) => {
  await act(async () => {
    netState = { isConnected: online, isInternetReachable: online };
    netListeners.forEach(listener => listener());
  });
};

const transactions = sortByDateDesc(mockTransactionResponse.data);

// The first render transforms the whole navigation stack, which is slow on
// cold caches.
jest.setTimeout(30000);

describe('App', () => {
  beforeEach(() => {
    useTransactionStore.getState().reset();
    jest.clearAllMocks();
    netState = { isConnected: true, isInternetReachable: true };
  });

  it('lists transactions with name, date and amount', async () => {
    mockedFetch.mockResolvedValue(page(transactions));
    await render(<App />);

    expect(await screen.findByText('Salary Payment')).toBeOnTheScreen();
    expect(screen.getByText('John Doe · 15 Oct 2024')).toBeOnTheScreen();
    expect(screen.getByText('+RM 1,500.00')).toBeOnTheScreen();
    expect(screen.getByText('-RM 500.00')).toBeOnTheScreen();
    expect(screen.getByText('October 2024')).toBeOnTheScreen();
  });

  it('opens the detail screen and shares the transaction', async () => {
    mockedFetch.mockResolvedValue(page(transactions));
    await render(<App />);

    await fireEvent.press(await screen.findByTestId('transaction-item-789GHI'));

    expect(await screen.findByText('Reference ID')).toBeOnTheScreen();
    expect(screen.getByText('789GHI')).toBeOnTheScreen();
    expect(screen.getByText('Robert Brown')).toBeOnTheScreen();
    expect(screen.getByText('5 Oct 2024, 4:18 PM')).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('share-button'));

    expect(Share.open).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('Reference ID: 789GHI'),
        url: 'file:///tmp/receipt.png',
        type: 'image/png',
      }),
    );
  });

  it('shows an error state with retry when loading fails', async () => {
    mockedFetch.mockRejectedValueOnce(new Error('Network down'));
    await render(<App />);

    expect(await screen.findByText('Network down')).toBeOnTheScreen();

    mockedFetch.mockResolvedValueOnce(page(transactions));
    await fireEvent.press(screen.getByTestId('retry-button'));

    expect(await screen.findByText('Salary Payment')).toBeOnTheScreen();
  });

  it('loads the next page when the end of the list is reached', async () => {
    const [first, second, ...rest] = transactions;
    mockedFetch.mockResolvedValueOnce(page([first, second], second.refId));
    await render(<App />);
    await screen.findByText('Salary Payment');
    expect(screen.queryByText('Emily Davis · 30 Aug 2024')).toBeNull();

    mockedFetch.mockResolvedValueOnce(page(rest, null));
    await fireEvent(screen.getByTestId('transaction-list'), 'endReached');

    expect(
      await screen.findByText('Emily Davis · 30 Aug 2024'),
    ).toBeOnTheScreen();
    expect(mockedFetch).toHaveBeenLastCalledWith({ cursor: second.refId });
    expect(screen.getByText("You've reached the end.")).toBeOnTheScreen();
  });

  it('lets the user retry a page that failed to load', async () => {
    const [first, second, ...rest] = transactions;
    mockedFetch.mockResolvedValueOnce(page([first, second], second.refId));
    await render(<App />);
    await screen.findByText('Salary Payment');

    mockedFetch.mockRejectedValueOnce(new NetworkError());
    await fireEvent(screen.getByTestId('transaction-list'), 'endReached');
    expect(await screen.findByTestId('load-more-error')).toBeOnTheScreen();

    mockedFetch.mockResolvedValueOnce(page(rest, null));
    await fireEvent.press(screen.getByTestId('load-more-retry'));

    expect(
      await screen.findByText('Emily Davis · 30 Aug 2024'),
    ).toBeOnTheScreen();
  });

  describe('going offline', () => {
    it('keeps the list on screen and shows an offline banner', async () => {
      mockedFetch.mockResolvedValue(page(transactions));
      await render(<App />);
      await screen.findByText('Salary Payment');

      await setOnline(false);

      expect(screen.getByTestId('offline-banner')).toBeOnTheScreen();
      expect(screen.getByText('Salary Payment')).toBeOnTheScreen();

      // Details and sharing work from the data already loaded.
      await fireEvent.press(screen.getByTestId('transaction-item-123ABC'));
      expect(await screen.findByText('Reference ID')).toBeOnTheScreen();
    });

    it('shows why a refresh failed without hiding the list', async () => {
      mockedFetch.mockResolvedValueOnce(page(transactions));
      await render(<App />);
      await screen.findByText('Salary Payment');

      mockedFetch.mockRejectedValueOnce(new NetworkError());
      await act(() =>
        useTransactionStore.getState().loadTransactions({ refresh: true }),
      );

      expect(
        await screen.findByTestId('refresh-error-banner'),
      ).toBeOnTheScreen();
      expect(screen.getByText(/No internet connection/)).toBeOnTheScreen();
      expect(screen.getByText('Salary Payment')).toBeOnTheScreen();

      mockedFetch.mockResolvedValueOnce(page(transactions));
      await fireEvent.press(screen.getByTestId('refresh-error-banner-action'));

      expect(screen.queryByTestId('refresh-error-banner')).toBeNull();
    });

    it('retries automatically when the connection comes back', async () => {
      netState = { isConnected: false, isInternetReachable: false };
      mockedFetch.mockRejectedValueOnce(new NetworkError());
      await render(<App />);
      expect(
        await screen.findByText(/No internet connection/),
      ).toBeOnTheScreen();

      mockedFetch.mockResolvedValueOnce(page(transactions));
      await setOnline(true);

      expect(await screen.findByText('Salary Payment')).toBeOnTheScreen();
      expect(mockedFetch).toHaveBeenCalledTimes(2);
    });

    it('does not refetch on reconnect when nothing failed', async () => {
      mockedFetch.mockResolvedValue(page(transactions));
      await render(<App />);
      await screen.findByText('Salary Payment');

      await setOnline(false);
      await setOnline(true);

      expect(mockedFetch).toHaveBeenCalledTimes(1);
      expect(screen.queryByTestId('offline-banner')).toBeNull();
    });
  });
});
