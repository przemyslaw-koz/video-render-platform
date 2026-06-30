import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export interface StorageAdapter {
  saveInput(jobId: string, content: string | Buffer): Promise<string>;
  getInputPath(jobId: string): Promise<string>;
}

const inputsRoot = 'inputs';

export class S3StorageAdapter implements StorageAdapter {
  async saveInput(jobId: string, content: string | Buffer): Promise<string> {
    void jobId;
    void content;
    throw new Error('Not implemented');
  }

  async getInputPath(jobId: string): Promise<string> {
    void jobId;
    throw new Error('Not implemented');
  }
}

export class LocalStorageAdapter implements StorageAdapter {
  async saveInput(jobId: string, content: string | Buffer): Promise<string> {
    const path = join(inputsRoot, jobId, 'input.json');
    await mkdir(join(inputsRoot, jobId), { recursive: true });
    await writeFile(path, content);
    return path;
  }

  async getInputPath(jobId: string): Promise<string> {
    return join(inputsRoot, jobId, 'input.json');
  }
}
