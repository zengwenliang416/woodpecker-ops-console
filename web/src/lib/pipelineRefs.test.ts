import { describe, expect, it } from 'vitest';

import { WebhookEvents } from '~/lib/api/types/webhook';

import { getPullRequestIndexFromRef, isPullRequestEvent, pipelineMatchesPullRequest } from './pipelineRefs';

describe('pipeline pull-request references', () => {
  it.each([
    ['refs/pull/42/merge', '42'],
    ['refs/pull/42/head', '42'],
    ['refs/merge-requests/17/from', '17'],
    ['refs/pull-requests/9', '9'],
  ])('normalizes %s', (ref, expected) => {
    expect(getPullRequestIndexFromRef(ref)).toBe(expected);
  });

  it.each(['refs/heads/main', 'refs/pull/42/files', 'pull/42', ''])('rejects unsupported ref %s', (ref) => {
    expect(getPullRequestIndexFromRef(ref)).toBeUndefined();
  });

  it('recognizes all supported pull-request events', () => {
    expect(isPullRequestEvent(WebhookEvents.PullRequest)).toBe(true);
    expect(isPullRequestEvent(WebhookEvents.PullRequestClosed)).toBe(true);
    expect(isPullRequestEvent(WebhookEvents.PullRequestMetadata)).toBe(true);
    expect(isPullRequestEvent(WebhookEvents.Push)).toBe(false);
  });

  it('requires both the event and normalized index to match', () => {
    expect(pipelineMatchesPullRequest({ event: WebhookEvents.PullRequest, ref: 'refs/pull/42/merge' }, '42')).toBe(
      true,
    );
    expect(pipelineMatchesPullRequest({ event: WebhookEvents.Push, ref: 'refs/pull/42/merge' }, '42')).toBe(false);
    expect(pipelineMatchesPullRequest({ event: WebhookEvents.PullRequest, ref: 'refs/pull/7/merge' }, '42')).toBe(
      false,
    );
  });
});
