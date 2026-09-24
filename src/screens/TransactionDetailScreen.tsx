import React, { useRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, DetailRow, DirectionIcon, StateView } from '@/components';
import {
  useShareTransaction,
  type ReceiptRef,
} from '@/hooks/useShareTransaction';
import type { RootStackScreenProps } from '@/navigation/types';
import {
  selectTransactionById,
  useTransactionStore,
} from '@/store/useTransactionStore';
import { colors, radius, spacing, typography } from '@/theme';
import { formatDateTime, formatSignedCurrency } from '@/utils/format';
import { getDirection } from '@/utils/transaction';

type Props = RootStackScreenProps<'TransactionDetail'>;

export function TransactionDetailScreen({ route }: Props) {
  const { refId } = route.params;
  const transaction = useTransactionStore(selectTransactionById(refId));
  const receiptRef = useRef<ReceiptRef>(null);
  const { share, isSharing } = useShareTransaction(receiptRef);
  const insets = useSafeAreaInsets();

  if (!transaction) {
    return (
      <StateView
        variant="error"
        message="This transaction could not be found."
      />
    );
  }

  const direction = getDirection(transaction.amount);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* collapsable={false} keeps this view in the native tree so it can be captured */}
        <View
          ref={receiptRef}
          collapsable={false}
          style={styles.receipt}
          testID="transaction-receipt"
        >
          <View style={styles.hero}>
            <DirectionIcon direction={direction} size={56} />
            <Text style={styles.transferName}>{transaction.transferName}</Text>
            <Text
              style={[
                styles.amount,
                direction === 'incoming' ? styles.incoming : styles.outgoing,
              ]}
              testID="transaction-amount"
            >
              {formatSignedCurrency(transaction.amount)}
            </Text>
            <Text style={styles.directionLabel}>
              {direction === 'incoming' ? 'Money in' : 'Money out'}
            </Text>
          </View>

          <View style={styles.rows}>
            <DetailRow label="Reference ID" value={transaction.refId} />
            <DetailRow
              label="Date"
              value={formatDateTime(transaction.transferDate)}
            />
            <DetailRow label="Recipient" value={transaction.recipientName} />
            <DetailRow
              label="Transfer amount"
              value={formatSignedCurrency(transaction.amount)}
              isLast
            />
          </View>
        </View>
      </ScrollView>

      <View
        style={[styles.footer, { paddingBottom: spacing.lg + insets.bottom }]}
      >
        <Button
          title="Share"
          testID="share-button"
          loading={isSharing}
          onPress={() => share(transaction)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  receipt: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
  },
  hero: {
    alignItems: 'center',
    paddingBottom: spacing.xl,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  transferName: {
    ...typography.subtitle,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  amount: {
    ...typography.amountLarge,
    marginTop: spacing.sm,
  },
  incoming: {
    color: colors.incoming,
  },
  outgoing: {
    color: colors.outgoing,
  },
  directionLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  rows: {
    marginTop: spacing.md,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
