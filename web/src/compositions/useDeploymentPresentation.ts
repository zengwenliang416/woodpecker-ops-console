import { useI18n } from 'vue-i18n';

import type {
  AppReleaseStatus,
  DeploymentStatus,
  DeploymentTargetPhase,
  DeployStrategy,
  TargetStatus,
} from '~/lib/api/types';

export function useDeploymentPresentation() {
  const { t } = useI18n();

  function deploymentStatusLabel(status: DeploymentStatus): string {
    return {
      draft: t('ops.deployment.status_labels.draft'),
      pending_approval: t('ops.deployment.status_labels.pending_approval'),
      rejected: t('ops.deployment.status_labels.rejected'),
      approved: t('ops.deployment.status_labels.approved'),
      running: t('ops.deployment.status_labels.running'),
      paused: t('ops.deployment.status_labels.paused'),
      success: t('ops.deployment.status_labels.success'),
      failed: t('ops.deployment.status_labels.failed'),
      cancelled: t('ops.deployment.status_labels.cancelled'),
    }[status];
  }

  function releaseStatusLabel(status: AppReleaseStatus): string {
    return {
      ready: t('ops.deployment.release_statuses.ready'),
      deployed: t('ops.deployment.release_statuses.deployed'),
      superseded: t('ops.deployment.release_statuses.superseded'),
      rolled_back: t('ops.deployment.release_statuses.rolled_back'),
    }[status];
  }

  function strategyLabel(strategy: DeployStrategy): string {
    return {
      single: t('ops.deployment.strategy_single'),
      'all-at-once': t('ops.deployment.strategy_all_at_once'),
      rolling: t('ops.deployment.strategy_rolling'),
    }[strategy];
  }

  function targetStatusLabel(status: TargetStatus): string {
    return {
      queued: t('ops.deployment.target_statuses.queued'),
      deploying: t('ops.deployment.target_statuses.deploying'),
      health_check: t('ops.deployment.target_statuses.health_check'),
      healthy: t('ops.deployment.target_statuses.healthy'),
      failed: t('ops.deployment.target_statuses.failed'),
      skipped: t('ops.deployment.target_statuses.skipped'),
      rolled_back: t('ops.deployment.target_statuses.rolled_back'),
    }[status];
  }

  function phaseLabel(phase: string): string {
    const labels = {
      waiting: t('ops.deployment.phases.waiting'),
      pulling: t('ops.deployment.phases.pulling'),
      starting: t('ops.deployment.phases.starting'),
      health_check: t('ops.deployment.phases.health_check'),
      healthy: t('ops.deployment.phases.healthy'),
      failed: t('ops.deployment.phases.failed'),
    } satisfies Record<DeploymentTargetPhase, string>;
    return labels[phase as DeploymentTargetPhase] ?? t('ops.deployment.phase_unknown');
  }

  function actorLabel(actor?: string, fallback = '—'): string {
    if (actor === 'system') return t('ops.deployment.system_actor');
    return actor === undefined || actor.length === 0 ? fallback : actor;
  }

  return {
    actorLabel,
    deploymentStatusLabel,
    phaseLabel,
    releaseStatusLabel,
    strategyLabel,
    targetStatusLabel,
  };
}
