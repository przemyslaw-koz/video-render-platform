import type {CalculateMetadataFunction} from 'remotion';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {BarRow} from './components/BarRow';
import {ToastOverlay} from './components/ToastOverlay';
import {getAssetSrc} from './lib/assets';
import {getSmoothLayoutAtFrame} from './lib/compute-smooth-layout';
import {getChartHeight, MAX_BAR_WIDTH} from './lib/constants';
import {useRacePresentation} from './lib/use-race-presentation';
import type {BarChartRaceProps} from './types/bar-chart-race-props';

export const barChartRaceCalculateMetadata: CalculateMetadataFunction<
  BarChartRaceProps
> = ({props}) => ({
  durationInFrames: props.config.durationInFrames,
  fps: props.config.fps,
  width: props.config.width,
  height: props.config.height,
});

export const BarChartRace: React.FC<BarChartRaceProps> = ({config}) => {
  const frame = useCurrentFrame();
  const {layoutTimeline, fonts, toasts} = useRacePresentation(config);
  const {year, items} = getSmoothLayoutAtFrame(frame, layoutTimeline);
  const maxValue = Math.max(...items.map((x) => x.value));
  const {theme, assets, title} = config;

  return (
    <AbsoluteFill style={{backgroundColor: theme.background, padding: 80}}>
      <h1
        style={{
          color: theme.titleColor,
          fontFamily: fonts.title,
          fontSize: 64,
          marginBottom: 48,
        }}
      >
        {title} — {year.toFixed(1)}
      </h1>

      <div
        style={{
          position: 'relative',
          height: getChartHeight(items.length),
        }}
      >
        {items.map((item) => {
          const width = (item.value / maxValue) * MAX_BAR_WIDTH;

          return (
            <BarRow
              key={item.name}
              name={item.name}
              value={item.value}
              width={width}
              y={item.y}
              rank={item.rank}
              theme={theme}
              fonts={fonts}
              iconSrc={getAssetSrc(item.name, assets)}
            />
          );
        })}
      </div>

      <ToastOverlay toasts={toasts} fonts={fonts} />
    </AbsoluteFill>
  );
};
