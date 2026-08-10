import type { Pipeline } from '~/lib/api/types';
import { WebhookEvents } from '~/lib/api/types/webhook';

const pullRequestEvents = new Set<WebhookEvents>([
  WebhookEvents.PullRequest,
  WebhookEvents.PullRequestClosed,
  WebhookEvents.PullRequestMetadata,
]);

const pullRequestRefPattern = /^refs\/(?:pull|merge-requests|pull-requests)\/([^/]+)(?:\/(?:merge|head|from))?$/;

export function isPullRequestEvent(event: WebhookEvents): boolean {
  return pullRequestEvents.has(event);
}

export function getPullRequestIndexFromRef(ref: string): string | undefined {
  return pullRequestRefPattern.exec(ref)?.[1];
}

export function pipelineMatchesPullRequest(
  pipeline: Pick<Pipeline, 'event' | 'ref'>,
  pullRequestIndex: string,
): boolean {
  return isPullRequestEvent(pipeline.event) && getPullRequestIndexFromRef(pipeline.ref) === pullRequestIndex;
}
