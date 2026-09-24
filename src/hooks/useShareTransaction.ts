import {
  useCallback,
  useState,
  type ComponentRef,
  type RefObject,
} from 'react';
import { Alert, type View } from 'react-native';
import Share from 'react-native-share';
import { captureRef } from 'react-native-view-shot';
import type { Transaction } from '@/types/transaction';
import { buildShareMessage } from '@/utils/transaction';

export type ReceiptRef = ComponentRef<typeof View>;

/**
 * Shares a transaction through the OS share sheet so the user can pick any
 * medium (WhatsApp, email, Telegram, save to files, ...).
 *
 * The receipt view is captured as a PNG and attached together with a plain
 * text summary. If the capture fails, it falls back to text only so sharing
 * still works.
 */
export function useShareTransaction(receiptRef: RefObject<ReceiptRef | null>) {
  const [isSharing, setIsSharing] = useState(false);

  const share = useCallback(
    async (transaction: Transaction) => {
      const message = buildShareMessage(transaction);
      const title = `Transaction ${transaction.refId}`;

      setIsSharing(true);
      try {
        const imageUri = await captureReceipt(receiptRef);

        await Share.open({
          title,
          subject: title,
          message,
          failOnCancel: false,
          ...(imageUri && { url: imageUri, type: 'image/png' }),
        });
      } catch {
        Alert.alert(
          'Unable to share',
          'Something went wrong while sharing this transaction.',
        );
      } finally {
        setIsSharing(false);
      }
    },
    [receiptRef],
  );

  return { share, isSharing };
}

async function captureReceipt(
  ref: RefObject<ReceiptRef | null>,
): Promise<string | undefined> {
  if (!ref.current) {
    return undefined;
  }
  try {
    return await captureRef(ref, { format: 'png', quality: 1 });
  } catch {
    return undefined;
  }
}
