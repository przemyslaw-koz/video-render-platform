import { z } from 'zod';

/** Supported composition templates (orchestrator multipart field). */
export const templateIdSchema = z.enum(['bar-chart-race']);

export type TemplateId = z.infer<typeof templateIdSchema>;

const fontWeightSchema = z.enum(['400', '500', '600', '700']);

const googleFontFamilySchema = z.enum(['Inter', 'Roboto', 'Montserrat', 'Oswald']);

const fontConfigSchema = z.discriminatedUnion('source', [
  z.object({
    source: z.literal('system'),
    family: z.string().min(1),
  }),
  z.object({
    source: z.literal('google'),
    family: googleFontFamilySchema,
    weights: z.array(fontWeightSchema).optional(),
  }),
  z.object({
    source: z.literal('local'),
    family: z.string().min(1),
    src: z.string().min(1),
    weight: fontWeightSchema.optional(),
  }),
]);

const dataPointSchema = z.object({
  year: z.number(),
  name: z.string().min(1),
  value: z.number(),
});

const chartThemeSchema = z.object({
  background: z.string().min(1),
  titleColor: z.string().min(1),
  labelColor: z.string().min(1),
  barColors: z.record(z.string(), z.string()),
  fallbackBarColor: z.string().min(1),
});

const assetRefSchema = z.object({
  src: z.string().min(1),
});

const timeAnchorSchema = z.union([
  z.object({ year: z.number() }),
  z.object({ progress: z.number().min(0).max(1) }),
]);

const toastDefinitionSchema = z.object({
  at: timeAnchorSchema,
  message: z.string().min(1),
  ttlSeconds: z.number().positive(),
});

/** Remotion `BarChartRace` input props: `{ config: RaceConfig }`. */
export const raceConfigSchema = z.object({
  title: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  fps: z.number().int().positive(),
  durationInFrames: z.number().int().positive(),
  startYear: z.number(),
  endYear: z.number(),
  data: z.array(dataPointSchema).min(1),
  theme: chartThemeSchema,
  fonts: z.object({
    title: fontConfigSchema,
    label: fontConfigSchema,
  }),
  assets: z.record(z.string(), assetRefSchema),
  toasts: z.array(toastDefinitionSchema),
});

export type RaceConfig = z.infer<typeof raceConfigSchema>;

export const barChartRaceSchema = z.object({
  config: raceConfigSchema,
});

export type BarChartRace = z.infer<typeof barChartRaceSchema>;

export const parseTemplateId = (value: unknown) => templateIdSchema.safeParse(value);

export const parseBarChartRace = (value: unknown) =>
  barChartRaceSchema.safeParse(value);
