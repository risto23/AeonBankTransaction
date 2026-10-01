import React, { useCallback, useEffect, useMemo } from 'react';
import {
  Platform,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
  type SectionListData,
  type SectionListRenderItem,
} from 'react-native';
import {
  Banner,
  LoadMoreFooter,
  StateView,
  SummaryCard,
  TransactionListItem,
} from '@/components';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import type { RootStackScreenProps } from '@/navigation/types';
import {
  selectHasMore,
  useTransactionStore,
} from '@/store/useTransactionStore';
import { colors, spacing, typography } from '@/theme';
import type { Transaction } from '@/types/transaction';
import { groupByMonth, type TransactionSection } from '@/utils/transaction';

type Props = RootStackScreenProps<'TransactionList'>;

export function TransactionListScreen({ navigation }: Props) {
  const transactions = useTransactionStore(state => state.transactions);
  const summary = useTransactionStore(state => state.summary);
  const status = useTransactionStore(state => state.status);
  const error = useTransactionStore(state => state.error);
  const isLoadingMore = useTransactionStore(state => state.isLoadingMore);
  const loadMoreError = useTransactionStore(state => state.loadMoreError);
  const hasMore = useTransactionStore(selectHasMore);
  const loadTransactions = useTransactionStore(state => state.loadTransactions);
  const loadMore = useTransactionStore(state => state.loadMore);

  // Coming back online only retries what actually failed. A list that is
  // already showing is left alone, so the user keeps their scroll position.
  const handleReconnect = useCallback(() => {
    const state = useTransactionStore.getState();
    if (state.status === 'error') {
      state.loadTransactions({ refresh: state.transactions.length > 0 });
    } else if (state.loadMoreError) {
      state.loadMore();
    }
  }, []);

  const { isOffline } = useNetworkStatus(handleReconnect);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const sections = useMemo(() => groupByMonth(transactions), [transactions]);

  const handlePress = useCallback(
    (transaction: Transaction) =>
      navigation.navigate('TransactionDetail', { refId: transaction.refId }),
    [navigation],
  );

  const handleRefresh = useCallback(
    () => loadTransactions({ refresh: true }),
    [loadTransactions],
  );

  // A failed page waits for the retry button (or reconnecting) instead of
  // firing again on every scroll past the end.
  const handleEndReached = useCallback(() => {
    if (!loadMoreError) {
      loadMore();
    }
  }, [loadMore, loadMoreError]);

  const renderItem = useCallback<
    SectionListRenderItem<Transaction, TransactionSection>
  >(
    ({ item }) => (
      <TransactionListItem transaction={item} onPress={handlePress} />
    ),
    [handlePress],
  );

  if (status === 'idle' || status === 'loading') {
    return <StateView variant="loading" />;
  }

  if (status === 'error' && transactions.length === 0) {
    return (
      <StateView
        variant="error"
        message={error ?? undefined}
        onRetry={() => loadTransactions()}
      />
    );
  }

  return (
    <View style={styles.screen}>
      {isOffline ? (
        <Banner
          variant="offline"
          testID="offline-banner"
          message="You're offline. Showing the transactions loaded so far."
        />
      ) : (
        status === 'error' && (
          <Banner
            variant="error"
            testID="refresh-error-banner"
            message={`Couldn't refresh. ${error ?? ''}`.trim()}
            actionLabel="Retry"
            onAction={handleRefresh}
          />
        )
      )}

      <SectionList
        testID="transaction-list"
        sections={sections}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        ItemSeparatorComponent={Separator}
        ListHeaderComponent={
          summary ? <SummaryCard summary={summary} /> : undefined
        }
        ListEmptyComponent={<StateView variant="empty" />}
        ListFooterComponent={
          transactions.length > 0 ? (
            <LoadMoreFooter
              isLoading={isLoadingMore}
              error={loadMoreError}
              hasMore={hasMore}
              onRetry={loadMore}
            />
          ) : undefined
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={11}
        removeClippedSubviews={Platform.OS === 'android'}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={status === 'refreshing'}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />
    </View>
  );
}

const keyExtractor = (item: Transaction) => item.refId;

const renderSectionHeader = ({
  section,
}: {
  section: SectionListData<Transaction, TransactionSection>;
}) => <Text style={styles.sectionHeader}>{section.title}</Text>;

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing.xxl,
  },
  sectionHeader: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: spacing.lg + 40 + spacing.md,
  },
});
