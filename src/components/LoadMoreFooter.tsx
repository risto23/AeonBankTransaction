import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/theme';
import { Button } from './Button';

interface Props {
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  onRetry: () => void;
}

/** Footer for the paginated list: spinner, retry on error, or end marker. */
export function LoadMoreFooter({ isLoading, error, hasMore, onRetry }: Props) {
  if (isLoading) {
    return (
      <View style={styles.container} testID="load-more-loading">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container} testID="load-more-error">
        <Text style={styles.text}>{error}</Text>
        <Button
          title="Load more"
          onPress={onRetry}
          style={styles.retry}
          testID="load-more-retry"
        />
      </View>
    );
  }

  if (!hasMore) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>You've reached the end.</Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  text: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  retry: {
    marginTop: spacing.md,
  },
});
