import type {ResolvedToast, TimeAnchor, ToastDefinition} from '../types/race-config';

export type ResolveToastsOptions = {
  toasts: ToastDefinition[];
  startYear: number;
  endYear: number;
  durationInFrames: number;
  fps: number;
};

const anchorToProgress = (
  at: TimeAnchor,
  startYear: number,
  endYear: number,
): number => {
  if ('progress' in at) {
    return Math.min(Math.max(at.progress, 0), 1);
  }

  const yearSpan = endYear - startYear;
  if (yearSpan === 0) {
    return 0;
  }

  return Math.min(Math.max((at.year - startYear) / yearSpan, 0), 1);
};

const anchorToStartFrame = (
  at: TimeAnchor,
  startYear: number,
  endYear: number,
  durationInFrames: number,
): number => {
  const progress = anchorToProgress(at, startYear, endYear);
  return Math.round(progress * Math.max(durationInFrames - 1, 0));
};

export const resolveToasts = ({
  toasts,
  startYear,
  endYear,
  durationInFrames,
  fps,
}: ResolveToastsOptions): ResolvedToast[] => {
  const resolved = toasts
    .map((toast) => {
      const startFrame = anchorToStartFrame(
        toast.at,
        startYear,
        endYear,
        durationInFrames,
      );
      const durationFrames = Math.max(Math.round(toast.ttlSeconds * fps), 1);

      return {
        startFrame,
        endFrame: startFrame + durationFrames,
        message: toast.message,
      };
    })
    .sort((a, b) => a.startFrame - b.startFrame);

  for (let i = 0; i < resolved.length - 1; i++) {
    if (resolved[i].endFrame > resolved[i + 1].startFrame) {
      throw new Error(
        `Toast overlap: frame ${resolved[i].startFrame} overlaps with frame ${resolved[i + 1].startFrame}`,
      );
    }
  }

  return resolved;
};

export const getActiveToast = (
  frame: number,
  toasts: ResolvedToast[],
): ResolvedToast | null =>
  toasts.find(
    (toast) => frame >= toast.startFrame && frame < toast.endFrame,
  ) ?? null;
