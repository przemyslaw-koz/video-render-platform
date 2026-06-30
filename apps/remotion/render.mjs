import {writeFile, mkdir, readFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {performance} from 'node:perf_hooks';
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);

const FRAMES_8MIN_AT_30FPS = 8 * 60 * 30;

const compositionId = process.env.COMPOSITION_ID ?? 'BarChartRace';
const outputLocation =
  process.env.OUTPUT_PATH ?? `out/${compositionId}.mp4`;
const benchmarkPath =
  process.env.BENCHMARK_PATH ?? join(dirname(outputLocation), 'benchmark.json');

const loadInputProps = async () => {
  const propsPath = process.env.INPUT_PROPS_PATH;
  if (!propsPath || !existsSync(propsPath)) {
    return {};
  }

  return JSON.parse(await readFile(propsPath, 'utf8'));
};

const toSeconds = (ms) => Math.round((ms / 1000) * 10) / 10;

const totalStart = performance.now();

const bundleStart = performance.now();
const bundled = await bundle({
  entryPoint: require.resolve('./src/index.ts'),
  webpackOverride: (config) => config,
});
const bundleMs = performance.now() - bundleStart;

const inputProps = await loadInputProps();

const composition = await selectComposition({
  serveUrl: bundled,
  id: compositionId,
  inputProps,
});

const {durationInFrames, fps, width, height} = composition;
const durationSeconds = durationInFrames / fps;

console.log(`Rendering ${compositionId} -> ${outputLocation}`);

const renderStart = performance.now();
await renderMedia({
  codec: 'h264',
  composition,
  serveUrl: bundled,
  outputLocation,
  chromiumOptions: {
    enableMultiProcessOnLinux: true,
  },
  inputProps,
});
const renderMs = performance.now() - renderStart;

const totalMs = performance.now() - totalStart;
const msPerFrame =
  durationInFrames > 0 ? Math.round((renderMs / durationInFrames) * 10) / 10 : 0;
const estimated8MinSeconds =
  Math.round((bundleMs / 1000 + (msPerFrame * FRAMES_8MIN_AT_30FPS) / 1000) * 10) /
  10;

const benchmark = {
  compositionId,
  frames: durationInFrames,
  fps,
  width,
  height,
  durationSeconds,
  bundleMs: Math.round(bundleMs),
  renderMs: Math.round(renderMs),
  totalMs: Math.round(totalMs),
  msPerFrame,
  estimated8MinSeconds,
  timestamp: new Date().toISOString(),
};

console.log('=== Render benchmark ===');
console.log(`composition=${compositionId}`);
console.log(
  `duration_s=${durationSeconds} frames=${durationInFrames} fps=${fps} resolution=${width}x${height}`,
);
console.log(`bundle_s=${toSeconds(bundleMs)}`);
console.log(`render_s=${toSeconds(renderMs)}`);
console.log(`total_s=${toSeconds(totalMs)}`);
console.log(`ms_per_frame=${msPerFrame}`);
console.log(`estimated_8min_s=${estimated8MinSeconds}`);
console.log('========================');

await mkdir(dirname(benchmarkPath), {recursive: true});
await writeFile(benchmarkPath, `${JSON.stringify(benchmark, null, 2)}\n`);

console.log(`Benchmark: ${benchmarkPath}`);
console.log(`Done: ${outputLocation}`);
