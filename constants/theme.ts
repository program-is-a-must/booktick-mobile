export const colors = {
  primary:      '#4A9B8A',   // teal green (login, buttons)
  primaryLight: '#EAF4F2',
  blue:         '#4B7BE8',   // Books Read card
  orange:       '#F5A623',   // Total Minutes card
  purple:       '#9B59E8',   // Hours card
  green:        '#4A9B8A',   // This Week card
  background:   '#F0F2F5',
  bg:           '#F0F2F5',   // alias for background
  card:         '#FFFFFF',
  text:         '#1A1A2E',
  textMuted:    '#8A9BB0',
  border:       '#E2E8F0',
  danger:       '#E05252',
  success:      '#4A9B8A',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
} as const;

export const font = {
  regular: '400',
  medium:  '500',
  bold:    '700',
  size: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
    xxl: 32,
  },
} as const;