import {useMemo} from 'react';
import {AbsoluteFill} from 'remotion';
import {BarRow} from './components/BarRow';
import {raceConfig} from './datasets/race-config';
import {getAssetSrc} from './lib/assets';
import {resolveRaceFonts} from './lib/load-race-fonts';
import {
  getChartHeight,
  getYFromRank,
  MAX_BAR_WIDTH,
} from './lib/constants';
import {sortByValueWithTieBreak} from './lib/rank-hysteresis';

const YEAR = 2020;

export const StaticBars = () => {
  const staticBarsFonts = useMemo(
    () => resolveRaceFonts(raceConfig.fonts),
    [raceConfig.fonts],
  );
  const {theme, assets} = raceConfig;
  const items = sortByValueWithTieBreak(
    raceConfig.data.filter((d) => d.year === YEAR),
  );
  const maxValue = Math.max(...items.map((x) => x.value));

  return (
    <AbsoluteFill style={{backgroundColor: theme.background, padding: 80}}>
      <h1
        style={{
          color: theme.titleColor,
          fontFamily: staticBarsFonts.title,
          fontSize: 64,
          marginBottom: 48,
        }}
      >
        {raceConfig.title} — {YEAR}
      </h1>

      <div
        style={{
          position: 'relative',
          height: getChartHeight(items.length),
        }}
      >
        {items.map((item, index) => {
          const rank = index + 1;
          const width = (item.value / maxValue) * MAX_BAR_WIDTH;

          return (
            <BarRow
              key={item.name}
              name={item.name}
              value={item.value}
              width={width}
              y={getYFromRank(rank)}
              theme={theme}
              fonts={staticBarsFonts}
              iconSrc={getAssetSrc(item.name, assets)}
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
