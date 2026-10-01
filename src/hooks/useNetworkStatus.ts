import { useEffect, useRef } from 'react';
import { useNetInfo } from '@react-native-community/netinfo';

/**
 * Tracks whether the device is offline and calls `onReconnect` once each
 * time it comes back online.
 *
 * `isInternetReachable` is checked as well as `isConnected`: being on a
 * Wi-Fi network doesn't mean the internet is reachable. Both start as
 * `null` (unknown), which is treated as online.
 */
export function useNetworkStatus(onReconnect?: () => void) {
  const { isConnected, isInternetReachable } = useNetInfo();
  const isOffline = isConnected === false || isInternetReachable === false;

  const wasOffline = useRef(false);
  const onReconnectRef = useRef(onReconnect);

  useEffect(() => {
    onReconnectRef.current = onReconnect;
  }, [onReconnect]);

  useEffect(() => {
    if (isOffline) {
      wasOffline.current = true;
    } else if (wasOffline.current) {
      wasOffline.current = false;
      onReconnectRef.current?.();
    }
  }, [isOffline]);

  return { isOffline };
}
