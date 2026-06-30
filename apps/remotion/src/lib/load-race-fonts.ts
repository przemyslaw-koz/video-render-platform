import {loadFont as loadLocalFont} from '@remotion/fonts';
import {loadFont as loadInter} from '@remotion/google-fonts/Inter';
import {loadFont as loadMontserrat} from '@remotion/google-fonts/Montserrat';
import {loadFont as loadOswald} from '@remotion/google-fonts/Oswald';
import {loadFont as loadRoboto} from '@remotion/google-fonts/Roboto';
import {staticFile} from 'remotion';
import type {
  FontConfig,
  FontWeight,
  GoogleFontFamily,
  RaceFonts,
  ResolvedRaceFonts,
} from '../types/race-config';

const DEFAULT_WEIGHTS: FontWeight[] = ['400', '700'];

const loadGoogleFont = (
  family: GoogleFontFamily,
  weights: FontWeight[],
): string => {
  const options = {
    subsets: ['latin'] as Array<'latin'>,
    weights,
  };

  switch (family) {
    case 'Inter':
      return loadInter('normal', options).fontFamily;
    case 'Roboto':
      return loadRoboto('normal', options).fontFamily;
    case 'Montserrat':
      return loadMontserrat('normal', options).fontFamily;
    case 'Oswald':
      return loadOswald('normal', options).fontFamily;
    default: {
      const exhaustive: never = family;
      throw new Error(`Unsupported Google font: ${exhaustive}`);
    }
  }
};

const loadLocalFontConfig = (config: Extract<FontConfig, {source: 'local'}>) => {
  void loadLocalFont({
    family: config.family,
    url: staticFile(config.src),
    weight: config.weight ?? '400',
  });

  return config.family;
};

const resolveFontConfig = (config: FontConfig): string => {
  switch (config.source) {
    case 'system':
      return config.family;
    case 'google':
      return loadGoogleFont(
        config.family,
        config.weights ?? DEFAULT_WEIGHTS,
      );
    case 'local':
      return loadLocalFontConfig(config);
    default: {
      const exhaustive: never = config;
      throw new Error(`Unsupported font config: ${exhaustive}`);
    }
  }
};

export const resolveRaceFonts = (fonts: RaceFonts): ResolvedRaceFonts => ({
  title: resolveFontConfig(fonts.title),
  label: resolveFontConfig(fonts.label),
});
