import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/theme';
import { Button } from './Button';

type Variant = 'loading' | 'error' | 'empty';

interface Props {
  variant: Variant;
  message?: string;
  onRetry?: () => void;
}

const DEFAULT_MESSAGES: Record<Variant, string> = {
  loading: 'Loading transactions...',
  error: 'Something went wrong. Please try again.',
  empty: 'No transactions yet.',
};

/**
 * Full-screen placeholder for loading, error and empty states.
 */
export function StateView({ variant, message, onRetry }: Props) {
  return (
    <View style={styles.container} testID={`state-${variant}`}>
      {variant === 'loading' && (
        <ActivityIndicator size="large" color={colors.primary} />
      )}
      <Text style={styles.message}>{message ?? DEFAULT_MESSAGES[variant]}</Text>
      {onRetry && (
        <Button
          title="Try again"
          onPress={onRetry}
          style={styles.retry}
          testID="retry-button"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  retry: {
    marginTop: spacing.lg,
  },
});
