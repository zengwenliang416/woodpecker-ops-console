export type ServerStatus = 'online' | 'offline' | 'maintenance';
export type ServerHealth = 'healthy' | 'warning' | 'critical' | 'maintenance';
export type DeployStrategy = 'single' | 'all-at-once' | 'rolling';
export type DeploymentStatus =
  'draft' | 'pending_approval' | 'rejected' | 'approved' | 'running' | 'paused' | 'success' | 'failed' | 'cancelled';
export type TargetStatus = 'queued' | 'deploying' | 'health_check' | 'healthy' | 'failed' | 'skipped' | 'rolled_back';
export type DeploymentTargetPhase = 'waiting' | 'pulling' | 'starting' | 'health_check' | 'healthy' | 'failed';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved';
export type AppReleaseStatus = 'ready' | 'deployed' | 'superseded' | 'rolled_back';

export interface MetricsSnapshot {
  cpu: number[];
  memory: number[];
  disk: number[];
  network: number[];
}

export interface Server {
  id: number;
  created?: number;
  updated?: number;
  org_id?: number;
  group_id: number;
  environment_id: number;
  name: string;
  region?: string;
  zone?: string;
  private_ip?: string;
  public_ip?: string;
  os?: string;
  kernel?: string;
  runtime?: string;
  agent_version?: string;
  cert_serial?: string;
  status: ServerStatus;
  health: ServerHealth;
  cpu: number;
  memory: number;
  disk: number;
  load: number;
  uptime_seconds?: number;
  last_heartbeat?: number;
  current_release_id?: number;
  maintenance: boolean;
  labels?: Record<string, string>;
  metrics?: MetricsSnapshot;
}

export interface ServerGroup {
  id: number;
  created?: number;
  updated?: number;
  org_id?: number;
  environment_id: number;
  name: string;
  description?: string;
  strategy: DeployStrategy;
  batch_size: number;
  health_path?: string;
  port?: number;
  labels?: Record<string, string>;
}

export interface Application {
  id: number;
  created?: number;
  updated?: number;
  org_id?: number;
  repo_id?: number;
  name: string;
  description?: string;
  image: string;
  runtime: string;
  compose_file?: string;
  service: string;
  health_path?: string;
  port?: number;
  owner_team?: string;
}

export interface Environment {
  id: number;
  created?: number;
  updated?: number;
  org_id?: number;
  name: string;
  title?: string;
  protected: boolean;
  approval_required: boolean;
  minimum_approvers: number;
  auto_rollback: boolean;
  deploy_window?: string;
  domain?: string;
  color?: string;
}

export interface AppRelease {
  id: number;
  created?: number;
  updated?: number;
  org_id?: number;
  application_id: number;
  pipeline_id: number;
  version: string;
  commit?: string;
  digest: string;
  image?: string;
  size_bytes?: number;
  author?: string;
  status: AppReleaseStatus;
  note?: string;
}

export interface DeploymentLog {
  at: number;
  level: string;
  message: string;
}

export interface Deployment {
  id: number;
  created?: number;
  updated?: number;
  org_id?: number;
  application_id: number;
  environment_id: number;
  release_id: number;
  previous_release_id?: number;
  pipeline_id?: number;
  group_id?: number;
  status: DeploymentStatus;
  strategy: DeployStrategy;
  batch_size: number;
  progress: number;
  triggered_by?: string;
  approved_by?: string;
  approved_at?: number;
  started_at?: number;
  finished_at?: number;
  rollback_of?: number;
  rolled_back_to?: number;
  logs?: DeploymentLog[];
}

export interface DeploymentTarget {
  deployment_id: number;
  server_id: number;
  status: TargetStatus;
  phase: DeploymentTargetPhase;
  message?: string;
  attempts?: number;
  started_at?: number;
  finished_at?: number;
}

export interface Approval {
  id: number;
  created?: number;
  org_id?: number;
  deployment_id: number;
  approver: string;
  approved: boolean;
  comment?: string;
}

export interface Alert {
  id: number;
  created?: number;
  updated?: number;
  org_id?: number;
  type: string;
  severity: string;
  status: AlertStatus;
  server_id?: number;
  deployment_id?: number;
  message: string;
  acknowledged_by?: string;
  resolved_by?: string;
  resolved_at?: number;
}

export interface AuditLog {
  id: number;
  created?: number;
  org_id?: number;
  actor: string;
  action: string;
  resource_type?: string;
  resource_id?: number;
  detail?: string;
  ip?: string;
}

export interface InfrastructureOverview {
  server_count: number;
  server_online: number;
  server_maintenance: number;
  server_offline: number;
  avg_cpu: number;
  avg_memory: number;
  avg_disk: number;
  active_alerts: number;
  group_count: number;
  servers: Server[];
  groups: ServerGroup[];
  alerts: Alert[];
}

export interface DeploymentDetail {
  deployment: Deployment;
  targets: DeploymentTarget[];
  approvals: Approval[];
}

export interface DeploymentPolicies {
  health_check_retries: number;
  health_check_interval: number;
  batch_size_default: number;
  auto_rollback: boolean;
}
