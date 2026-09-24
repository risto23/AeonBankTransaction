export const colors = {
  primary: '#B5006B',
  primaryDark: '#8A0052',
  onPrimary: '#FFFFFF',
  background: '#F4F5F7',
  surface: '#FFFFFF',
  textPrimary: '#1A1C1E',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  incoming: '#0F8A4B',
  incomingBg: '#E6F4EC',
  outgoing: '#C62828',
  outgoingBg: '#FDECEC',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const typography = {
  title: { fontSize: 20, fontWeight: '700' },
  subtitle: { fontSize: 16, fontWeight: '600' },
  body: { fontSize: 14, fontWeight: '400' },
  caption: { fontSize: 12, fontWeight: '400' },
  amountLarge: { fontSize: 32, fontWeight: '700' },
} as const;
