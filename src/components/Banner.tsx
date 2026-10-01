import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/theme';

interface Props {
  variant: 'offline' | 'error';
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
}

/**
 * Thin strip pinned above content for non-blocking problems, e.g. being
 * offline or a refresh that failed while older data is still on screen.
 */
export function Banner({
  variant,
  message,
  actionLabel,
  onAction,
  testID,
}: Props) {
  return (
    <View
      style={[styles.container, styles[variant]]}
      testID={testID}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          hitSlop={spacing.sm}
          testID={testID && `${testID}-action`}
        >
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  offline: {
    backgroundColor: colors.textPrimary,
  },
  error: {
    backgroundColor: colors.outgoing,
  },
  message: {
    ...typography.caption,
    flex: 1,
    color: colors.onPrimary,
  },
  action: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.onPrimary,
    marginLeft: spacing.md,
  },
});
