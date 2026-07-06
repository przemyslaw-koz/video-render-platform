export const LABEL_FONT_SIZE = 32;
export const LABEL_MARGIN_BOTTOM = 8;
export const ICON_SIZE = 36;
export const ICON_GAP = 12;
export const LABEL_HEIGHT = LABEL_FONT_SIZE + LABEL_MARGIN_BOTTOM;
export const BAR_HEIGHT = 42;
export const BAR_GAP = 24;
export const ROW_STEP = LABEL_HEIGHT + BAR_HEIGHT + BAR_GAP;
export const MAX_BAR_WIDTH = 1200;
export const Y_SMOOTHING = 0.12;
export const RANK_HYSTERESIS_THRESHOLD = 0.5;
export const DEFAULT_TOP_N = 10;

export type YEasing = 'lerp' | 'spring';
export const Y_EASING: YEasing = 'spring';

export const SPRING_DURATION_IN_FRAMES = 28;
export const SPRING_CONFIG = {
  damping: 18,
  stiffness: 120,
  mass: 0.6,
};

export const getYFromRank = (rank: number): number => (rank - 1) * ROW_STEP;

export const getChartHeight = (barCount: number): number =>
  barCount * ROW_STEP - BAR_GAP;
