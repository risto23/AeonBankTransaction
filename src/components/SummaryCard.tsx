import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';
import { formatCurrency } from '@/utils/format';
import type { TransactionSummary } from '@/types/transaction';

interface Props {
  summary: TransactionSummary;
}

export function SummaryCard({ summary }: Props) {
  return (
    <View style={styles.card} testID="summary-card">
      <SummaryColumn label="Money in" value={summary.incoming} />
      <View style={styles.divider} />
      <SummaryColumn label="Money out" value={summary.outgoing} />
    </View>
  );
}

function SummaryColumn({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.column}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{formatCurrency(value)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    margin: spacing.lg,
  },
  column: {
    flex: 1,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.onPrimary,
    opacity: 0.4,
    marginHorizontal: spacing.lg,
  },
  label: {
    ...typography.caption,
    color: colors.onPrimary,
    opacity: 0.85,
  },
  value: {
    ...typography.subtitle,
    color: colors.onPrimary,
    marginTop: spacing.xs,
  },
});
