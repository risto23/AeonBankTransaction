import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  TransactionList: undefined;
  TransactionDetail: { refId: string };
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;
