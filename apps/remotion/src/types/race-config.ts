export type FontWeight = '400' | '500' | '600' | '700';

/** Google fonts registered in `lib/load-race-fonts.ts` */
export type GoogleFontFamily = 'Inter' | 'Roboto' | 'Montserrat' | 'Oswald';

export type FontConfig =
  | {
      source: 'system';
      family: string;
    }
  | {
      source: 'google';
      family: GoogleFontFamily;
      weights?: FontWeight[];
    }
  | {
      source: 'local';
      family: string;
      /** Path relative to `public/`, e.g. `fonts/MyFont.woff2` */
      src: string;
      weight?: FontWeight;
    };

export type RaceFonts = {
  title: FontConfig;
  label: FontConfig;
};

export type ResolvedRaceFonts = {
  title: string;
  label: string;
};

export type DataPoint = {
  year: number;
  name: string;
  value: number;
};

export type ChartTheme = {
  background: string;
  titleColor: string;
  labelColor: string;
  barColors: Record<string, string>;
  fallbackBarColor: string;
};

export type AssetRef = {
  /** Path relative to `public/`, e.g. `icons/python.svg` */
  src: string;
};

export type TimeAnchor = {year: number} | {progress: number};

export type ToastDefinition = {
  at: TimeAnchor;
  message: string;
  ttlSeconds: number;
};

export type ResolvedToast = {
  startFrame: number;
  endFrame: number;
  message: string;
};

export type RaceConfig = {
  title: string;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  startYear: number;
  endYear: number;
  data: DataPoint[];
  theme: ChartTheme;
  fonts: RaceFonts;
  assets: Record<string, AssetRef>;
  toasts: ToastDefinition[];
};
