import {Img} from 'remotion';
import {
  BAR_HEIGHT,
  ICON_GAP,
  ICON_SIZE,
  LABEL_FONT_SIZE,
  LABEL_MARGIN_BOTTOM,
} from '../lib/constants';
import {getBarColor} from '../lib/theme';
import type {ChartTheme, ResolvedRaceFonts} from '../types/race-config';

type BarRowProps = {
  name: string;
  value: number;
  width: number;
  y: number;
  theme: ChartTheme;
  fonts: ResolvedRaceFonts;
  iconSrc?: string | null;
  rank?: number;
};

export const BarRow = ({
  name,
  value,
  width,
  y,
  theme,
  fonts,
  iconSrc,
  rank,
}: BarRowProps) => {
  const label =
    rank !== undefined
      ? `${rank}. ${name} (${Math.round(value)})`
      : name;

  return (
    <div
      style={{
        position: 'absolute',
        top: y,
        left: 0,
        right: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: ICON_GAP,
          marginBottom: LABEL_MARGIN_BOTTOM,
        }}
      >
        {iconSrc ? (
          <Img
            src={iconSrc}
            style={{
              width: ICON_SIZE,
              height: ICON_SIZE,
              borderRadius: 8,
              objectFit: 'cover',
              flexShrink: 0,
            }}
          />
        ) : null}
        <div
          style={{
            color: theme.labelColor,
            fontFamily: fonts.label,
            fontSize: LABEL_FONT_SIZE,
          }}
        >
          {label}
        </div>
      </div>
      <div
        style={{
          height: BAR_HEIGHT,
          width,
          backgroundColor: getBarColor(name, theme),
          borderRadius: 8,
        }}
      />
    </div>
  );
};
