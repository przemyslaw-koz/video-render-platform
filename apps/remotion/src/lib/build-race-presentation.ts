import type {RaceConfig, ResolvedRaceFonts, ResolvedToast} from '../types/race-config';
import type {SmoothLayoutFrame} from './compute-smooth-layout';
import {buildSmoothLayoutTimeline} from './compute-smooth-layout';
import {resolveRaceFonts} from './load-race-fonts';
import {resolveToasts} from './resolve-toasts';

export type RacePresentation = {
  layoutTimeline: SmoothLayoutFrame[];
  fonts: ResolvedRaceFonts;
  toasts: ResolvedToast[];
};

export const buildRacePresentation = (config: RaceConfig): RacePresentation => ({
  layoutTimeline: buildSmoothLayoutTimeline({
    data: config.data,
    durationInFrames: config.durationInFrames,
    startYear: config.startYear,
    endYear: config.endYear,
    fps: config.fps,
    barScaleMode: config.barScaleMode ?? 'expanding-axis',
    axisHeadroomRatio: config.axisHeadroomRatio,
    topN: config.topN,
  }),
  fonts: resolveRaceFonts(config.fonts),
  toasts: resolveToasts({
    toasts: config.toasts,
    startYear: config.startYear,
    endYear: config.endYear,
    durationInFrames: config.durationInFrames,
    fps: config.fps,
  }),
});
