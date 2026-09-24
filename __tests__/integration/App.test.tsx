import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import Share from 'react-native-share';
import App from '../../App';
import { fetchTransactions } from '@/api/transactionApi';
import { mockTransactionResponse } from '@/api/mockData';
import { useTransactionStore } from '@/store/useTransactionStore';

jest.mock('@/api/transactionApi');

const mockedFetch = jest.mocked(fetchTransactions);

// The first render transforms the whole navigation stack, which is slow on
// cold caches.
jest.setTimeout(30000);

describe('App', () => {
  beforeEach(() => {
    useTransactionStore.getState().reset();
    jest.clearAllMocks();
  });

  it('lists transactions with name, date and amount', async () => {
    mockedFetch.mockResolvedValue(mockTransactionResponse.data);
    await render(<App />);

    expect(await screen.findByText('Salary Payment')).toBeOnTheScreen();
    expect(screen.getByText('John Doe · 15 Oct 2024')).toBeOnTheScreen();
    expect(screen.getByText('+RM 1,500.00')).toBeOnTheScreen();
    expect(screen.getByText('-RM 500.00')).toBeOnTheScreen();
    expect(screen.getByText('October 2024')).toBeOnTheScreen();
  });

  it('opens the detail screen and shares the transaction', async () => {
    mockedFetch.mockResolvedValue(mockTransactionResponse.data);
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

    mockedFetch.mockResolvedValueOnce(mockTransactionResponse.data);
    await fireEvent.press(screen.getByTestId('retry-button'));

    expect(await screen.findByText('Salary Payment')).toBeOnTheScreen();
  });
});
