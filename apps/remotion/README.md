# Bar Chart Race — Remotion POC

Local proof of concept for a **bar chart race** animation built with [Remotion](https://www.remotion.dev/) (React + TypeScript).

Main composition: **`BarChartRace`** (20 s, 1920×1080, 30 fps). All video settings — resolution, timing, data, theme, fonts, icons, and toasts — live in `src/datasets/race-config.ts`. [`src/Root.tsx`](src/Root.tsx) and `calculateMetadata` read those values from the same config (no duplicate hardcoding).

## Requirements

- **Node.js 18+** (LTS)
- **npm**

If you use **WSL**, run `npm install` and all commands **only inside WSL** (do not mix with a `node_modules` folder installed from PowerShell on Windows).

The Docker image uses **Node 22** (see `Dockerfile`).

## Install

```bash
cd app
npm install
```

## Preview (Remotion Studio)

```bash
npm run dev
```

Open the URL printed in the terminal (usually **http://localhost:3000**).

In the left panel, select a composition:

| ID | Description |
|----|-------------|
| `BarChartRace` | Full 2018→2022 animation |
| `StaticBars` | Static chart (single year) |
| `GrowingBar` | Learning exercise — single growing bar |

Stop the server with `Ctrl+C` in the terminal.

## Render MP4

### Local (WSL / Linux / macOS)

```bash
npx remotion render BarChartRace out/bar-chart-race.mp4
```

Output file: `app/out/bar-chart-race.mp4`.

With custom input props:

```bash
npx remotion render BarChartRace out/bar-chart-race.mp4 --props=input/custom.props.json
```

Other compositions:

```bash
npx remotion render StaticBars out/static-bars.mp4
npx remotion render GrowingBar out/growing-bar.mp4
```

### Docker (recommended on Windows without WSL)

Build the image (once, or after changing `package.json`):

```bash
npm run render:docker:build
```

Render:

```bash
npm run render:docker
```

Output: `app/out/BarChartRace.mp4` (mounted `./out` volume).

`render.mjs` reads these environment variables (defaults in parentheses):

| Variable | Default | Purpose |
|----------|---------|---------|
| `COMPOSITION_ID` | `BarChartRace` | Composition to render |
| `OUTPUT_PATH` | `out/<COMPOSITION_ID>.mp4` | Output video path |
| `INPUT_PROPS_PATH` | *(unset)* | JSON file with `{ "config": { ... } }` |
| `BENCHMARK_PATH` | `out/benchmark.json` | Benchmark JSON output |

Override without editing files:

```bash
COMPOSITION_ID=StaticBars OUTPUT_PATH=out/static.mp4 npm run render:docker
INPUT_PROPS_PATH=input/custom.props.json npm run render:docker
```

Defaults for `COMPOSITION_ID` can also be set in [`docker-compose.yml`](docker-compose.yml).

## Render benchmark (Docker)

`render.mjs` logs a benchmark summary after each Docker render and writes `out/benchmark.json`.

```bash
npm run render:docker
```

Example log output:

```text
=== Render benchmark ===
composition=BarChartRace
duration_s=20 frames=600 fps=30 resolution=1920x1080
bundle_s=4.5
render_s=183.4
total_s=187.9
ms_per_frame=305.7
estimated_8min_s=4410.2
========================
```

### Extrapolating to an 8-minute video

Render time scales roughly with frame count. Use `ms_per_frame` from the benchmark:

```text
frames_8min = 8 × 60 × fps
estimated_8min_s ≈ bundle_s + (ms_per_frame × frames_8min) / 1000
```

For the default **30 fps** POC, `frames_8min = 14400`.

Quick approximation when bundle overhead is small (same fps and complexity):

```text
estimated_8min_s ≈ total_s × (480 / duration_s)
```

For the default 20 s POC at 30 fps: multiply `total_s` by **24**.

### Caveats

- Docker on your machine is a **local baseline**, not a direct AWS EC2 prediction.
- Assumes the same composition complexity and roughly linear scaling with frames.
- `estimated_8min_s` in `render.mjs` currently assumes **30 fps** (`8 × 60 × 30` frames). If you change `fps` in config/props, recompute using `8 × 60 × fps` instead of `14400`.
- Validate with real 2 min / 8 min renders on EC2 Spot when the worker exists (see [`docs/`](../docs/)).
- `docker compose build` time is **not** included — only `node render.mjs` inside the container.

## Video configuration

[`src/datasets/race-config.ts`](src/datasets/race-config.ts) is the single source of truth for `BarChartRace`:

| Field | Role |
|-------|------|
| `width`, `height` | Output resolution (also used by demo compositions in `Root.tsx`) |
| `fps`, `durationInFrames` | Timing; `calculateMetadata` syncs these when using custom props |
| `startYear`, `endYear` | Data interpolation range |
| `title`, `data` | Chart content |
| `theme` | Colors (background, bars, labels) |
| `fonts` | Google, local (`public/fonts/`), or system fonts |
| `assets` | Bar icons under `public/icons/` |
| `toasts` | Timed overlay messages |

| File | Contents |
|------|----------|
| `src/datasets/race-config.ts` | Default `RaceConfig` + `defaultBarChartRaceInputProps` |
| `src/datasets/chart-data.ts` | Raw data points imported by `race-config.ts` |
| `input/custom.props.json` | Example full props file for CLI / Docker renders |
| `public/icons/` | Bar icons (paths in `race-config.assets`) |
| `public/fonts/` | Optional local fonts (`fonts.source: 'local'`) |

Animation tuning (Y smoothing, spring, bar layout) stays in `src/lib/constants.ts` — separate from video metadata.

## Input props (`BarChartRace`)

The composition receives `{ config: RaceConfig }` via Remotion **input props** (not a hardcoded import in the component). Timeline, fonts, and toasts are built at render time from `config` (`useRacePresentation`), not when the module loads.

- **Studio / default render:** `defaultProps` in [`src/Root.tsx`](src/Root.tsx) point at [`src/datasets/race-config.ts`](src/datasets/race-config.ts).
- **Custom JSON (worker / CLI):** pass a props file whose root shape is `{ "config": { ...RaceConfig } }`. See [`input/custom.props.json`](input/custom.props.json).

```bash
npx remotion render BarChartRace out/bar-chart-race.mp4 --props=input/custom.props.json
```

Docker render (`render.mjs`) supports the same via env:

```bash
INPUT_PROPS_PATH=input/custom.props.json npm run render:docker
```

If `INPUT_PROPS_PATH` is unset, render passes empty props and Remotion merges them with `defaultProps` from the composition.

## Other commands

```bash
npm run lint      # eslint + TypeScript
npm run build     # Remotion bundle
```

## Target architecture docs

The broader pipeline plan (orchestrator, AWS, worker) is in the parent repo: [`docs/`](../docs/).
