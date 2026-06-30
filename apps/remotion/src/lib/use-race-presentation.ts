import {useMemo} from 'react';
import type {RaceConfig} from '../types/race-config';
import {
  buildRacePresentation,
  type RacePresentation,
} from './build-race-presentation';

/**
 * Builds layout timeline, fonts, and toasts from composition props at render
 * time — never at module import (required for per-job inputProps in workers).
 */
export const useRacePresentation = (config: RaceConfig): RacePresentation => {
  const {data, durationInFrames, startYear, endYear, fps, fonts, toasts} =
    config;

  return useMemo(
    () => buildRacePresentation(config),
    [data, durationInFrames, startYear, endYear, fps, fonts, toasts],
  );
};
