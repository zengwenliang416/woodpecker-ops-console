import type { Pipeline, Repo } from '~/lib/api/types';

export type RepoPipelineStatus = 'success' | 'failure' | 'running' | 'pending' | 'skipped' | 'none';

const FAILURE_STATUSES = new Set(['failure', 'error', 'killed', 'canceled', 'declined']);
const RUNNING_STATUSES = new Set(['running', 'started']);
const PENDING_STATUSES = new Set(['pending', 'blocked']);

export interface PipelineStats {
  successRate: number | null;
  successfulCount: number;
  terminalCount: number;
  averageDurationSeconds: number;
  durations: number[];
}

export function repoPipelineStatus(repo: Repo): RepoPipelineStatus {
  const status = repo.last_pipeline?.status;
  if (status === 'success') return 'success';
  if (status && FAILURE_STATUSES.has(status)) return 'failure';
  if (status && RUNNING_STATUSES.has(status)) return 'running';
  if (status && PENDING_STATUSES.has(status)) return 'pending';
  if (status === 'skipped') return 'skipped';
  return 'none';
}

export function pipelineDurationSeconds(pipeline: Pipeline): number | null {
  if (pipeline.started <= 0 || pipeline.finished <= pipeline.started) return null;
  return pipeline.finished - pipeline.started;
}

export function calculatePipelineStats(pipelines: Pipeline[]): PipelineStats {
  const terminal = pipelines.filter(
    (pipeline) => pipeline.status === 'success' || FAILURE_STATUSES.has(pipeline.status),
  );
  const successfulCount = terminal.filter((pipeline) => pipeline.status === 'success').length;
  const durations = terminal.map(pipelineDurationSeconds).filter((seconds): seconds is number => seconds !== null);

  return {
    successRate: terminal.length > 0 ? (successfulCount / terminal.length) * 100 : null,
    successfulCount,
    terminalCount: terminal.length,
    averageDurationSeconds:
      durations.length > 0 ? durations.reduce((sum, seconds) => sum + seconds, 0) / durations.length : 0,
    durations,
  };
}
