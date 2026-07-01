import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(fileURLToPath(new URL('../../..', import.meta.url)));
const orchestratorRoot =
  process.env.ORCHESTRATOR_ROOT ?? join(repoRoot, 'apps/orchestrator');
const composeFile = join(repoRoot, 'apps/remotion/docker-compose.yml');

const compositionByTemplate: Record<string, string> = {
  'bar-chart-race': 'BarChartRace',
};

export type RunRemotionParams = {
  /** Relative to orchestrator root, e.g. `inputs/{jobId}/input.json` */
  inputPath: string;
  /** Relative to orchestrator root, e.g. `outputs/{jobId}/video.mp4` */
  outputPath: string;
  templateId?: string;
  compositionId?: string;
};

export function runRemotion(params: RunRemotionParams): Promise<void> {
  const compositionId =
    params.compositionId ??
    (params.templateId ? compositionByTemplate[params.templateId] : undefined) ??
    'BarChartRace';

  const inputHost = resolve(orchestratorRoot, params.inputPath);
  const outputDirHost = resolve(orchestratorRoot, dirname(params.outputPath));

  const args = [
    'compose',
    '-f',
    composeFile,
    'run',
    '--rm',
    '-e',
    `COMPOSITION_ID=${compositionId}`,
    '-e',
    'INPUT_PROPS_PATH=/app/input/input.json',
    '-e',
    'OUTPUT_PATH=/app/out/video.mp4',
    '-v',
    `${inputHost}:/app/input/input.json:ro`,
    '-v',
    `${outputDirHost}:/app/out`,
    'render',
  ];

  return mkdir(outputDirHost, { recursive: true }).then(
    () =>
      new Promise<void>((resolvePromise, reject) => {
        const child = spawn('docker', args, {
          cwd: repoRoot,
          stdio: 'inherit',
        });

        child.on('error', reject);
        child.on('close', (code) => {
          if (code === 0) {
            resolvePromise();
            return;
          }
          reject(new Error(`docker compose exited with code ${code}`));
        });
      }),
  );
}
