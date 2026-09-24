import React, { useCallback, useEffect, useMemo } from 'react';
import {
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StateView, SummaryCard, TransactionListItem } from '@/components';
import type { RootStackScreenProps } from '@/navigation/types';
import { useTransactionStore } from '@/store/useTransactionStore';
import { colors, spacing, typography } from '@/theme';
import type { Transaction } from '@/types/transaction';
import { groupByMonth, summarize } from '@/utils/transaction';

type Props = RootStackScreenProps<'TransactionList'>;

export function TransactionListScreen({ navigation }: Props) {
  const transactions = useTransactionStore(state => state.transactions);
  const status = useTransactionStore(state => state.status);
  const error = useTransactionStore(state => state.error);
  const loadTransactions = useTransactionStore(state => state.loadTransactions);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const sections = useMemo(() => groupByMonth(transactions), [transactions]);
  const summary = useMemo(() => summarize(transactions), [transactions]);

  const handlePress = useCallback(
    (transaction: Transaction) =>
      navigation.navigate('TransactionDetail', { refId: transaction.refId }),
    [navigation],
  );

  const handleRefresh = useCallback(
    () => loadTransactions({ refresh: true }),
    [loadTransactions],
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
    <SectionList
      testID="transaction-list"
      sections={sections}
      keyExtractor={item => item.refId}
      renderItem={({ item }) => (
        <TransactionListItem transaction={item} onPress={handlePress} />
      )}
      renderSectionHeader={({ section }) => (
        <Text style={styles.sectionHeader}>{section.title}</Text>
      )}
      ItemSeparatorComponent={Separator}
      ListHeaderComponent={<SummaryCard summary={summary} />}
      ListEmptyComponent={<StateView variant="empty" />}
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
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
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
