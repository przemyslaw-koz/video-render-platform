import type {RaceConfig} from '../types/race-config';
import {sampleData} from './chart-data';

export const raceConfig: RaceConfig = {
  title: 'Top Programming Languages',
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 600,
  startYear: 2018,
  endYear: 2022,
  data: sampleData,
  theme: {
    background: '#111111',
    titleColor: '#FFFFFF',
    labelColor: '#FFFFFF',
    barColors: {
      JavaScript: '#F7DF1E',
      Python: '#4B8BBE',
      Java: '#E76F00',
      TypeScript: '#3178C6',
      Go: '#00ADD8',
    },
    fallbackBarColor: '#CCCCCC',
  },
  fonts: {
    title: {
      source: 'google',
      family: 'Montserrat',
      weights: ['600', '700'],
    },
    label: {
      source: 'google',
      family: 'Roboto',
      weights: ['400', '500'],
    },
  },
  assets: {
    JavaScript: {src: 'icons/javascript.svg'},
    Python: {src: 'icons/python.svg'},
    Java: {src: 'icons/java.svg'},
    TypeScript: {src: 'icons/typescript.svg'},
    Go: {src: 'icons/go.svg'},
  },
  toasts: [
    {
      at: {year: 2020.6},
      message:
        'Python overtakes JavaScript — after years of JS dominance at the top.',
      ttlSeconds: 8,
    },
  ],
};

export const defaultBarChartRaceInputProps = {
  config: raceConfig,
};
