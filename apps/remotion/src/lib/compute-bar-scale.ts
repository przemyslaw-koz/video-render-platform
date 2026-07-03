import type {BarScaleMode} from '../types/race-config';

const DEFAULT_AXIS_HEADROOM_RATIO = 0.95;

const fallbackScaleMax = (frameMax: number): number => frameMax || 1;

const initialExpandingScaleMax = (
  frameMax: number,
  headroomRatio: number,
): number => (frameMax > 0 ? frameMax / headroomRatio : 1);

export const getScaleMaxForFrame = (
  frameMax: number,
  previousScaleMax: number,
  mode: BarScaleMode,
  headroomRatio: number,
): number => {
  if (mode === 'leader-relative') {
    return fallbackScaleMax(frameMax);
  }

  const leaderFraction = frameMax / previousScaleMax;
  if (leaderFraction > headroomRatio) {
    return frameMax / headroomRatio;
  }

  return previousScaleMax;
};

export const buildScaleMaxByFrame = (
  frameMaxValues: number[],
  mode: BarScaleMode,
  headroomRatio = DEFAULT_AXIS_HEADROOM_RATIO,
): number[] => {
  if (frameMaxValues.length === 0) {
    return [];
  }

  if (mode === 'leader-relative') {
    return frameMaxValues.map(fallbackScaleMax);
  }

  const scaleMaxByFrame: number[] = [];
  let scaleMax = getScaleMaxForFrame(
    frameMaxValues[0],
    initialExpandingScaleMax(frameMaxValues[0], headroomRatio),
    mode,
    headroomRatio,
  );
  scaleMaxByFrame.push(scaleMax);

  for (let frame = 1; frame < frameMaxValues.length; frame++) {
    scaleMax = getScaleMaxForFrame(
      frameMaxValues[frame],
      scaleMax,
      mode,
      headroomRatio,
    );
    scaleMaxByFrame.push(scaleMax);
  }

  return scaleMaxByFrame;
};
