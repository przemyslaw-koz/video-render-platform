# Bar Chart Race POC — Open Items & Technical Debt

Checklist of known gaps, risks, and follow-up work for the Remotion POC (`apps/remotion/`) and the planned hybrid cloud pipeline ([ADR](./adr-hybrid-cloud-video-rendering-pipeline.md), [architecture overview](./hybrid-cloud-video-rendering-pipeline.md)).

Use this document before publishing the repo, wiring the orchestrator, or scaling to longer videos (e.g. 8 minutes).

---

## Already addressed in the POC

These were blockers for a worker that receives JSON per job; they are **done** in the current codebase:

| # | Topic | Resolution |
|---|--------|------------|
| 1 | Hardcoded `raceConfig` in the component | `BarChartRace` takes `{ config: RaceConfig }` via input props; `render.mjs` supports `INPUT_PROPS_PATH` |
| 2 | Drift between `Root.tsx` and `race-config.ts` | `width`, `height`, `fps`, `durationInFrames` live in `RaceConfig`; `Root` + `calculateMetadata` read from config |
| 3 | Precompute at module import | Timeline, fonts, and toasts built at render time via `useRacePresentation(config)` |

---

## Remotion app (`apps/remotion/`) — remaining items

### Medium priority (worth fixing before heavy worker use)

#### Split configuration sources

Video metadata is in `race-config.ts` / input props, but **animation tuning** still lives in `src/lib/constants.ts` (`Y_SMOOTHING`, `Y_EASING`, spring config, bar layout). That is intentional for now, but it means:

- changing easing or layout requires a **code deploy**, not just JSON
- orchestrator cannot tune animation feel per job without extending `RaceConfig`

**Follow-up:** either document constants as “engine tuning” or expose selected knobs on `RaceConfig` when product needs them.

#### Full timeline precomputed in memory

`buildSmoothLayoutTimeline` materializes layout for **every frame** up front (600 frames today; ~14 400 at 8 min / 30 fps).

**Risk:** higher RAM and precompute time for long videos or many bars.

**Follow-up:** lazy per-frame layout (`getFrameState` + cached Y), or compute only smooth Y without storing full `frameStates[]`.

#### `getSmoothLayoutAtFrame` has no bounds check

```ts
timeline[frame]  // undefined if frame is out of range → runtime crash
```

**Follow-up:** clamp frame to `[0, timeline.length - 1]` or throw a clear error.

#### Local fonts — fire-and-forget load

In `load-race-fonts.ts`, `source: 'local'` uses `void loadLocalFont(...)` without awaiting. Google fonts block via Remotion; local fonts may **not be ready** on early frames.

**Follow-up:** use Remotion `delayRender` / `continueRender` until the font is loaded (same pattern as async assets).

#### Benchmark `estimated_8min_s` assumes 30 fps

`render.mjs` uses `8 × 60 × 30` frames regardless of composition `fps`. README documents the caveat; the code does not yet use `composition.fps`.

**Follow-up:** `const frames8Min = 8 * 60 * composition.fps` (or read `fps` from benchmark JSON when post-processing).

#### Root `.gitignore`

Root `.gitignore` covers `node_modules/`, render output (`out/`, `dist/`), and common artifacts. Per-app ignores (e.g. `apps/orchestrator/.gitignore`) remain for app-specific tooling.

---

### Lower priority (cosmetic / Phase 2)

| Topic | Notes |
|--------|--------|
| Demo compositions (`GrowingBar`, `StaticBars`) | Fine for learning; move to `examples/` or drop in a “production” repo |
| `detectTargetYChanges` in `smooth-y.ts` | Exported but unused — remove or use in tests/docs |
| No `RaceConfig` validation | Orchestrator should validate JSON with **Zod** (or similar) before S3 upload / SQS enqueue |
| No tests / CI | Acceptable for POC; high value: tests for `resolveToasts`, `getFrameState`, rank hysteresis |
| `package.json` `"repository": {}` | Fill in after GitHub remote is created |
| Placeholder SVG icons | Replace with licensed assets before public marketing use |
| `StaticBars` still imports `raceConfig` directly | Demo only; not a worker concern |

---

## Hybrid pipeline — not in this POC yet

These are **out of scope** for `apps/remotion/` but required for the architecture in the ADR:

| Area | What the POC does today | What production needs |
|------|-------------------------|------------------------|
| Orchestrator | None | Hono + Bun API: validate job, upload input, enqueue work, poll status |
| Job queue | None | SQS (or equivalent) between orchestrator and worker |
| Storage | Local `out/` | S3 input JSON + output MP4 (+ optional benchmark artifact) |
| Worker | Docker `render.mjs` on one machine | EC2 Spot AMI / container: pull props, render, upload, exit |
| Job state | None | DynamoDB or PostgreSQL: pending → running → done / failed |
| Spot interruption | N/A | Checkpoint or retry; idempotent job handling |
| Auth & network | N/A | IAM least privilege; worker without inbound SSH |
| Observability | Console + `benchmark.json` | Structured logs, metrics, job duration per composition |
| Cost guardrails | Manual | Timeouts, max duration, Spot price caps, queue depth limits |

The POC proves **Remotion render + config contract**; the orchestrator repo should treat `RaceConfig` / input props as the stable boundary.

---

## Suggested order of work

1. **Repo hygiene** — migrate PoC into `apps/remotion/`, first commit with full tree (not a gitlink).
2. **Worker hardening** — bounds check on frame access; fix `estimated_8min` fps; optional Zod schema shared between orchestrator and worker.
3. **Long-video path** — profile memory at 2 min / 8 min; decide on lazy layout before EC2 sizing.
4. **Orchestrator MVP** — S3 + SQS + single worker script wrapping `render.mjs` / Remotion CLI with `INPUT_PROPS_PATH`.
5. **Production polish** — font loading, tests, CI, real icons.

---

## Related docs

- [apps/remotion/README.md](../apps/remotion/README.md) — local dev, Docker render, input props, benchmark
- [ADR: Hybrid Cloud Video Rendering Pipeline](./adr-hybrid-cloud-video-rendering-pipeline.md)
- [Hybrid Cloud Video Rendering Pipeline](./hybrid-cloud-video-rendering-pipeline.md)
