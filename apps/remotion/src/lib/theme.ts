import type {ChartTheme} from '../types/race-config';

export const getBarColor = (name: string, theme: ChartTheme): string =>
  theme.barColors[name] ?? theme.fallbackBarColor;
