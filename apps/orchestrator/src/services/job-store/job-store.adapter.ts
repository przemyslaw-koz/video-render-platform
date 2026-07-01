import { join } from 'node:path';
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';

export type JobStatus =
    | 'QUEUED'
    | 'STARTING'
    | 'RUNNING'
    | 'RENDERED'
    | 'UPLOADED'
    | 'DONE'
    | 'FAILED';

export type Job = {
    jobId: string;
    templateId: string;
    status: JobStatus;
    inputPath: string;
    outputPath: string;
    createdAt: string;
    startedAt: string | null;
    finishedAt: string | null;
    downloadUrl: string | null;
    errorMessage: string | null;
};

export type CreateJobInput = {
    jobId: string;
    templateId: string;
}

const jobsRoot = 'jobs';

export interface JobStoreAdapter {
    createJob(job: CreateJobInput): Promise<Job>;
    getJob(jobId: string): Promise<Job | null>;
    updateJob(job: Job): Promise<void>;
}

export class DynamoDBJobStoreAdapter implements JobStoreAdapter {
    async createJob(job: CreateJobInput): Promise<Job> {
        void job;
        throw new Error('Not implemented');
    }
    async getJob(jobId: string): Promise<Job | null> {
        void jobId;
        throw new Error('Not implemented');
    }
    async updateJob(job: Job): Promise<void> {
        void job;
        throw new Error('Not implemented');
    }
}

export class LocalJobStoreAdapter implements JobStoreAdapter {
    async createJob(job: CreateJobInput): Promise<Job> {
        const path = join(jobsRoot, `${job.jobId}.json`);
        await mkdir(jobsRoot, { recursive: true });
        const fullJob: Job = {
            jobId: job.jobId,
            templateId: job.templateId,
            status: 'QUEUED',
            inputPath: `inputs/${job.jobId}/input.json`,
            outputPath: `outputs/${job.jobId}/video.mp4`,
            createdAt: new Date().toISOString(),
            startedAt: null,
            finishedAt: null,
            downloadUrl: null,
            errorMessage: null,
        };
        await writeFile(path, JSON.stringify(fullJob, null, 2));
        return fullJob;
    }
    async getJob(jobId: string): Promise<Job | null> {
        const path = join(jobsRoot, `${jobId}.json`);

        const exists = await access(path).catch(() => false);
        if (!exists) {
            return null;
        }
        const content = await readFile(path, 'utf8');   

        return JSON.parse(content) as Job;
    }
    async updateJob(job: Job): Promise<void> {
        const path = join(jobsRoot, `${job.jobId}.json`);
        await writeFile(path, JSON.stringify(job, null, 2));
    }
}