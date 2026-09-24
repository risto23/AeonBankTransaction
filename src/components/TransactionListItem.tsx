import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/theme';
import type { Transaction } from '@/types/transaction';
import { formatShortDate, formatSignedCurrency } from '@/utils/format';
import { getDirection } from '@/utils/transaction';
import { DirectionIcon } from './DirectionIcon';

interface Props {
  transaction: Transaction;
  onPress: (transaction: Transaction) => void;
}

function TransactionListItemComponent({ transaction, onPress }: Props) {
  const { refId, transferName, recipientName, transferDate, amount } =
    transaction;
  const direction = getDirection(amount);
  const formattedAmount = formatSignedCurrency(amount);
  const formattedDate = formatShortDate(transferDate);

  return (
    <Pressable
      testID={`transaction-item-${refId}`}
      accessibilityRole="button"
      accessibilityLabel={`${transferName}, ${recipientName}, ${formattedDate}, ${formattedAmount}`}
      accessibilityHint="Opens transaction details"
      onPress={() => onPress(transaction)}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <DirectionIcon direction={direction} />

      <View style={styles.details}>
        <Text style={styles.title} numberOfLines={1}>
          {transferName}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {recipientName} · {formattedDate}
        </Text>
      </View>

      <Text
        style={[
          styles.amount,
          direction === 'incoming' ? styles.incoming : styles.outgoing,
        ]}
      >
        {formattedAmount}
      </Text>
    </Pressable>
  );
}

export const TransactionListItem = memo(TransactionListItemComponent);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  pressed: {
    backgroundColor: colors.background,
  },
  details: {
    flex: 1,
    marginHorizontal: spacing.md,
  },
  title: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  amount: {
    ...typography.subtitle,
  },
  incoming: {
    color: colors.incoming,
  },
  outgoing: {
    color: colors.outgoing,
  },
});
