import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '@/theme';
import type { TransactionDirection } from '@/types/transaction';

interface Props {
  direction: TransactionDirection;
  size?: number;
}

export function DirectionIcon({ direction, size = 40 }: Props) {
  const isIncoming = direction === 'incoming';

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          backgroundColor: isIncoming ? colors.incomingBg : colors.outgoingBg,
        },
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Text
        style={[
          styles.arrow,
          {
            fontSize: size * 0.45,
            color: isIncoming ? colors.incoming : colors.outgoing,
          },
        ]}
      >
        {isIncoming ? '↓' : '↑'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    fontWeight: '700',
  },
});
