import type {RaceConfig} from '../types/race-config';

export type RaceVideoSettings = Pick<
  RaceConfig,
  'width' | 'height' | 'fps' | 'durationInFrames'
>;

export const getRaceVideoSettings = (config: RaceConfig): RaceVideoSettings => ({
  width: config.width,
  height: config.height,
  fps: config.fps,
  durationInFrames: config.durationInFrames,
});

/** Short compositions used for learning demos in Remotion Studio. */
export const DEMO_DURATION_IN_FRAMES = 60;
