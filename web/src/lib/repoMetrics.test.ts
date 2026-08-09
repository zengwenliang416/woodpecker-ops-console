import { describe, expect, it } from 'vitest';

import type { Pipeline, Repo } from '~/lib/api/types';

import { calculatePipelineStats, repoPipelineStatus } from './repoMetrics';

function pipeline(status: Pipeline['status'], started = 100, finished = 160): Pipeline {
  return { status, started, finished } as Pipeline;
}

describe('repo metrics', () => {
  it('does not classify repositories without pipelines as pending', () => {
    expect(repoPipelineStatus({ active: true } as Repo)).toBe('none');
    expect(repoPipelineStatus({ active: true, last_pipeline: pipeline('blocked') } as Repo)).toBe('pending');
    expect(repoPipelineStatus({ active: true, last_pipeline: pipeline('skipped') } as Repo)).toBe('skipped');
  });

  it('calculates success rate and duration from real terminal pipelines', () => {
    const stats = calculatePipelineStats([
      pipeline('success', 100, 220),
      pipeline('failure', 100, 160),
      pipeline('running', 100, 0),
    ]);

    expect(stats.successRate).toBe(50);
    expect(stats.successfulCount).toBe(1);
    expect(stats.terminalCount).toBe(2);
    expect(stats.averageDurationSeconds).toBe(90);
  });

  it('excludes canceled pipelines that never started from duration samples', () => {
    const stats = calculatePipelineStats([pipeline('canceled', 0, 1_700_000_000)]);

    expect(stats.terminalCount).toBe(1);
    expect(stats.durations).toEqual([]);
    expect(stats.averageDurationSeconds).toBe(0);
  });
});
