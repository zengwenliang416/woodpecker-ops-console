export type RepoBadgeFormat = 'url' | 'markdown' | 'html';

interface RepoBadgeTarget {
  rootPath: string;
  repoId: number;
  branch: string;
  events: string[];
  workflow: string;
  step: string;
}

interface RepoBadgeEmbed {
  format: RepoBadgeFormat;
  baseUrl: string;
  badgeUrl: string;
  repoUrl: string;
}

export function buildRepoBadgeUrl({ rootPath, repoId, branch, events, workflow, step }: RepoBadgeTarget): string {
  const params = new URLSearchParams();

  if (branch !== '') {
    params.set('branch', branch);
  }

  if (events.length > 0 && (events.length !== 1 || events[0] !== 'push')) {
    params.set('events', events.join(','));
  }

  const normalizedWorkflow = workflow.trim();
  if (normalizedWorkflow !== '') {
    params.set('workflow', normalizedWorkflow);

    const normalizedStep = step.trim();
    if (normalizedStep !== '') {
      params.set('step', normalizedStep);
    }
  }

  const query = params.toString();
  return `${rootPath}/api/badges/${repoId}/status.svg${query === '' ? '' : `?${query}`}`;
}

export function buildRepoBadgeTargetUrl(rootPath: string, repoId: number, branch: string): string {
  return `${rootPath}/repos/${repoId}${branch === '' ? '' : `/branches/${encodeURIComponent(branch)}`}`;
}

export function formatRepoBadgeEmbed({ format, baseUrl, badgeUrl, repoUrl }: RepoBadgeEmbed): string {
  const absoluteBadgeUrl = `${baseUrl}${badgeUrl}`;
  const absoluteRepoUrl = `${baseUrl}${repoUrl}`;

  if (format === 'url') {
    return absoluteBadgeUrl;
  }

  if (format === 'markdown') {
    return `[![status-badge](${absoluteBadgeUrl})](${absoluteRepoUrl})`;
  }

  return `<a href="${absoluteRepoUrl}" target="_blank">\n  <img src="${absoluteBadgeUrl.replaceAll('&', '&amp;')}" alt="status-badge" />\n</a>`;
}
