import {Composition} from 'remotion';
import {
  BarChartRace,
  barChartRaceCalculateMetadata,
} from './BarChartRace';
import {defaultBarChartRaceInputProps, raceConfig} from './datasets/race-config';
import {GrowingBar} from './GrowingBar';
import {
  DEMO_DURATION_IN_FRAMES,
  getRaceVideoSettings,
} from './lib/race-video-settings';
import {StaticBars} from './StaticBars';

const barChartRaceVideo = getRaceVideoSettings(raceConfig);

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="GrowingBar"
        component={GrowingBar}
        durationInFrames={DEMO_DURATION_IN_FRAMES}
        fps={barChartRaceVideo.fps}
        width={barChartRaceVideo.width}
        height={barChartRaceVideo.height}
      />
      <Composition
        id="StaticBars"
        component={StaticBars}
        durationInFrames={DEMO_DURATION_IN_FRAMES}
        fps={barChartRaceVideo.fps}
        width={barChartRaceVideo.width}
        height={barChartRaceVideo.height}
      />
      <Composition
        id="BarChartRace"
        component={BarChartRace}
        durationInFrames={barChartRaceVideo.durationInFrames}
        fps={barChartRaceVideo.fps}
        width={barChartRaceVideo.width}
        height={barChartRaceVideo.height}
        defaultProps={defaultBarChartRaceInputProps}
        calculateMetadata={barChartRaceCalculateMetadata}
      />
    </>
  );
};
