import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

interface StorageAdapter {
  saveInput(jobId: string, file: File): Promise<string>;
  getInputPath(jobId: string): Promise<string>;
}

const inputsRoot = 'inputs';

export class S3StorageAdapter implements StorageAdapter {
  async saveInput(jobId: string, file: File): Promise<string> {
    void jobId;
    void file;
    throw new Error('Not implemented');
  }

  async getInputPath(jobId: string): Promise<string> {
    void jobId;
    throw new Error('Not implemented');
  }
}

export class LocalStorageAdapter implements StorageAdapter {
  async saveInput(jobId: string, file: File): Promise<string> {
    const path = join(inputsRoot, jobId, 'input.json');
    await mkdir(join(inputsRoot, jobId), { recursive: true });
    await writeFile(path, Buffer.from(await file.arrayBuffer()));
    return path;
  }

  async getInputPath(jobId: string): Promise<string> {
    return join(inputsRoot, jobId, 'input.json');
  }
}
