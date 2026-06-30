import {spring} from 'remotion';
import {
  SPRING_CONFIG,
  SPRING_DURATION_IN_FRAMES,
  type YEasing,
  Y_SMOOTHING,
} from './constants';

type TargetYByFrame = Record<string, number>[];

type SpringSegment = {
  startFrame: number;
  fromY: number;
  toY: number;
};

export type SmoothYOptions = {
  names: string[];
  targetYByFrame: TargetYByFrame;
  durationInFrames: number;
  easing: YEasing;
  smoothing?: number;
  fps: number;
  springDurationInFrames?: number;
  springConfig?: typeof SPRING_CONFIG;
};

const lerp = (from: number, to: number, progress: number) =>
  from + (to - from) * progress;

const buildLerpYByFrame = ({
  names,
  targetYByFrame,
  durationInFrames,
  smoothing = Y_SMOOTHING,
}: SmoothYOptions): TargetYByFrame => {
  const smoothY: Record<string, number> = {};
  for (const name of names) {
    smoothY[name] = targetYByFrame[0][name];
  }

  const yByFrame: TargetYByFrame = [];

  for (let frame = 0; frame < durationInFrames; frame++) {
    if (frame > 0) {
      for (const name of names) {
        smoothY[name] = lerp(
          smoothY[name],
          targetYByFrame[frame][name],
          smoothing,
        );
      }
    }

    yByFrame.push({...smoothY});
  }

  return yByFrame;
};

const buildSpringYByFrame = ({
  names,
  targetYByFrame,
  durationInFrames,
  fps,
  springDurationInFrames = SPRING_DURATION_IN_FRAMES,
  springConfig = SPRING_CONFIG,
}: SmoothYOptions): TargetYByFrame => {
  const yByFrame: TargetYByFrame = [];
  const activeSegment: Record<string, SpringSegment | null> = {};
  const currentY: Record<string, number> = {};

  for (let frame = 0; frame < durationInFrames; frame++) {
    for (const name of names) {
      const target = targetYByFrame[frame][name];

      if (frame === 0) {
        currentY[name] = target;
        activeSegment[name] = null;
      } else {
        const previousTarget = targetYByFrame[frame - 1][name];

        if (target !== previousTarget) {
          activeSegment[name] = {
            startFrame: frame,
            fromY: currentY[name],
            toY: target,
          };
        }

        const segment = activeSegment[name];

        if (segment) {
          const localFrame = frame - segment.startFrame;
          currentY[name] = spring({
            frame: localFrame,
            fps,
            config: springConfig,
            from: segment.fromY,
            to: segment.toY,
            durationInFrames: springDurationInFrames,
          });
        } else {
          currentY[name] = target;
        }
      }
    }

    yByFrame.push(
      Object.fromEntries(names.map((name) => [name, currentY[name]])),
    );
  }

  return yByFrame;
};

export const buildSmoothYByFrame = (options: SmoothYOptions): TargetYByFrame => {
  if (options.easing === 'spring') {
    return buildSpringYByFrame(options);
  }

  return buildLerpYByFrame(options);
};

export const detectTargetYChanges = (
  name: string,
  targetYByFrame: TargetYByFrame,
): Array<{frame: number; fromY: number; toY: number}> => {
  const changes: Array<{frame: number; fromY: number; toY: number}> = [];

  for (let frame = 1; frame < targetYByFrame.length; frame++) {
    const previousTarget = targetYByFrame[frame - 1][name];
    const target = targetYByFrame[frame][name];

    if (target !== previousTarget) {
      changes.push({
        frame,
        fromY: previousTarget,
        toY: target,
      });
    }
  }

  return changes;
};
