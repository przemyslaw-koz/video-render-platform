import type {FrameItem, ValueItem} from './get-frame-state';

export const compareByValueWithTieBreak = (a: ValueItem, b: ValueItem): number =>
  b.value - a.value || a.name.localeCompare(b.name);

export const sortByValueWithTieBreak = (items: ValueItem[]): ValueItem[] =>
  [...items].sort(compareByValueWithTieBreak);

const toValuesByName = (items: ValueItem[]): Record<string, number> =>
  Object.fromEntries(items.map((item) => [item.name, item.value]));

export const applyRankHysteresis = ({
  previousOrder,
  items,
  threshold,
}: {
  previousOrder: string[];
  items: ValueItem[];
  threshold: number;
}): string[] => {
  const valuesByName = toValuesByName(items);
  const order = [...previousOrder];

  let changed = true;
  while (changed) {
    changed = false;

    for (let i = 0; i < order.length - 1; i++) {
      const upper = order[i];
      const lower = order[i + 1];

      if (valuesByName[lower] > valuesByName[upper] + threshold) {
        order[i] = lower;
        order[i + 1] = upper;
        changed = true;
      }
    }
  }

  return order;
};

export const toRankedItems = (
  order: string[],
  items: ValueItem[],
): FrameItem[] => {
  const valuesByName = toValuesByName(items);

  return order.map((name, index) => ({
    name,
    value: valuesByName[name],
    rank: index + 1,
  }));
};

export const getInitialRankOrder = (items: ValueItem[]): string[] =>
  sortByValueWithTieBreak(items).map((item) => item.name);
