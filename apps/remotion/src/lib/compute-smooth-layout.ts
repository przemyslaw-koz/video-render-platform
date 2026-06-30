import type {DataPoint} from '../types/race-config';
import {
  RANK_HYSTERESIS_THRESHOLD,
  Y_EASING,
  getYFromRank,
  type YEasing,
} from './constants';
import {getFrameValues, type FrameState} from './get-frame-state';
import {
  applyRankHysteresis,
  getInitialRankOrder,
  toRankedItems,
} from './rank-hysteresis';
import {buildSmoothYByFrame} from './smooth-y';

export type BarLayoutItem = {
  name: string;
  value: number;
  rank: number;
  y: number;
};

export type SmoothLayoutFrame = {
  year: number;
  items: BarLayoutItem[];
};

type RankedFrameStatesOptions = {
  data: DataPoint[];
  durationInFrames: number;
  startYear: number;
  endYear: number;
  hysteresisThreshold?: number;
};

export type SmoothLayoutOptions = RankedFrameStatesOptions & {
  easing?: YEasing;
  smoothing?: number;
  fps: number;
  springDurationInFrames?: number;
  springConfig?: {
    damping: number;
    stiffness: number;
    mass: number;
  };
};

const getUniqueNames = (data: DataPoint[]): string[] => [
  ...new Set(data.map((d) => d.name)),
];

const buildRankedFrameStates = ({
  data,
  durationInFrames,
  startYear,
  endYear,
  hysteresisThreshold,
}: RankedFrameStatesOptions): FrameState[] => {
  const frameStates: FrameState[] = [];
  let rankOrder: string[] | null = null;

  for (let frame = 0; frame < durationInFrames; frame++) {
    const {year, items} = getFrameValues({
      frame,
      durationInFrames,
      data,
      startYear,
      endYear,
    });

    if (rankOrder === null) {
      rankOrder = getInitialRankOrder(items);
    } else {
      rankOrder = applyRankHysteresis({
        previousOrder: rankOrder,
        items,
        threshold: hysteresisThreshold ?? RANK_HYSTERESIS_THRESHOLD,
      });
    }

    frameStates.push({
      year,
      items: toRankedItems(rankOrder, items),
    });
  }

  return frameStates;
};

export const buildSmoothLayoutTimeline = ({
  data,
  durationInFrames,
  startYear,
  endYear,
  easing = Y_EASING,
  smoothing,
  hysteresisThreshold = RANK_HYSTERESIS_THRESHOLD,
  fps,
  springDurationInFrames,
  springConfig,
}: SmoothLayoutOptions): SmoothLayoutFrame[] => {
  const names = getUniqueNames(data);
  const frameStates = buildRankedFrameStates({
    data,
    durationInFrames,
    startYear,
    endYear,
    hysteresisThreshold,
  });

  const targetYByFrame = frameStates.map((state) => {
    const targetY: Record<string, number> = {};
    for (const item of state.items) {
      targetY[item.name] = getYFromRank(item.rank);
    }

    return targetY;
  });

  const yByFrame = buildSmoothYByFrame({
    names,
    targetYByFrame,
    durationInFrames,
    easing,
    smoothing,
    fps,
    springDurationInFrames,
    springConfig,
  });

  return frameStates.map((state, frame) => ({
    year: state.year,
    items: state.items.map((item) => ({
      ...item,
      y: yByFrame[frame][item.name],
    })),
  }));
};

export const getSmoothLayoutAtFrame = (
  frame: number,
  timeline: SmoothLayoutFrame[],
): SmoothLayoutFrame => timeline[frame];
