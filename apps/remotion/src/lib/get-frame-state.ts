import type {DataPoint} from '../types/race-config';
import {sortByValueWithTieBreak} from './rank-hysteresis';

export type ValueItem = {
  name: string;
  value: number;
};

export type FrameItem = ValueItem & {
  rank: number;
};

export type FrameState = {
  year: number;
  items: FrameItem[];
};

const lerp = (from: number, to: number, progress: number) =>
  from + (to - from) * progress;

const getValueAtYear = (
  data: DataPoint[],
  name: string,
  year: number,
): number => {
  const point = data.find((d) => d.name === name && d.year === year);
  if (!point) {
    throw new Error(`No data for ${name} in year ${year}`);
  }

  return point.value;
};

const getUniqueNames = (data: DataPoint[]): string[] => [
  ...new Set(data.map((d) => d.name)),
];

export const getFrameValues = ({
  frame,
  durationInFrames,
  data,
  startYear,
  endYear,
}: {
  frame: number;
  durationInFrames: number;
  data: DataPoint[];
  startYear: number;
  endYear: number;
}): {year: number; items: ValueItem[]} => {
  const progress = frame / Math.max(durationInFrames - 1, 1);
  const year = startYear + progress * (endYear - startYear);
  const yearFloor = Math.floor(year);
  const yearCeil = Math.ceil(year);
  const yearFraction = year - yearFloor;

  const items = getUniqueNames(data).map((name) => {
    const valueFloor = getValueAtYear(data, name, yearFloor);
    const valueCeil = getValueAtYear(data, name, yearCeil);
    const value = lerp(valueFloor, valueCeil, yearFraction);

    return {name, value};
  });

  return {year, items};
};

export const getFrameState = ({
  frame,
  durationInFrames,
  data,
  startYear,
  endYear,
}: {
  frame: number;
  durationInFrames: number;
  data: DataPoint[];
  startYear: number;
  endYear: number;
}): FrameState => {
  const {year, items} = getFrameValues({
    frame,
    durationInFrames,
    data,
    startYear,
    endYear,
  });

  return {
    year,
    items: sortByValueWithTieBreak(items).map((item, index) => ({
      ...item,
      rank: index + 1,
    })),
  };
};
