// Single source of truth for status, severity, and role values used across
// the application. These mirror the CHECK constraints and enums defined in
// the Supabase migrations — update here if the DB schema changes.

export const CONTROL_STATUS = {
  IMPLEMENTED: 'implemented',
  FAILING: 'failing',
  IN_PROGRESS: 'in_progress',
  NOT_STARTED: 'not_started',
  PARTIALLY_IMPLEMENTED: 'partially_implemented',
  NOT_IMPLEMENTED: 'not_implemented',
  NOT_APPLICABLE: 'not_applicable',
} as const;
export type ControlStatus = typeof CONTROL_STATUS[keyof typeof CONTROL_STATUS];

export const FRAMEWORK_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  AUDIT_READY: 'audit_ready',
  CERTIFIED: 'certified',
} as const;
export type FrameworkStatus = typeof FRAMEWORK_STATUS[keyof typeof FRAMEWORK_STATUS];

export const SEVERITY = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;
export type Severity = typeof SEVERITY[keyof typeof SEVERITY];

export const SEVERITY_LEVELS = [
  SEVERITY.CRITICAL,
  SEVERITY.HIGH,
  SEVERITY.MEDIUM,
  SEVERITY.LOW,
] as const;

export const TEST_STATUS = {
  PASSING: 'passing',
  FAILING: 'failing',
  PENDING: 'pending',
  ERROR: 'error',
  DISABLED: 'disabled',
  IN_PROGRESS: 'in_progress',
} as const;
export type TestStatus = typeof TEST_STATUS[keyof typeof TEST_STATUS];

export const ALERT_STATUS = {
  OPEN: 'open',
  RESOLVED: 'resolved',
  DISMISSED: 'dismissed',
  ACKNOWLEDGED: 'acknowledged',
} as const;
export type AlertStatus = typeof ALERT_STATUS[keyof typeof ALERT_STATUS];

export const INCIDENT_STATUS = {
  OPEN: 'open',
  INVESTIGATING: 'investigating',
  CONTAINED: 'contained',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
} as const;
export type IncidentStatus = typeof INCIDENT_STATUS[keyof typeof INCIDENT_STATUS];

export const USER_STATUS = {
  ACTIVE: 'active',
  INVITED: 'invited',
  DEACTIVATED: 'deactivated',
} as const;
export type UserStatus = typeof USER_STATUS[keyof typeof USER_STATUS];

export const APP_ROLE = {
  ADMIN: 'admin',
  ANALYST: 'analyst',
  AUDITOR: 'auditor',
  VIEWER: 'viewer',
} as const;
export type AppRoleValue = typeof APP_ROLE[keyof typeof APP_ROLE];

export const APP_ROLES = [
  APP_ROLE.ADMIN,
  APP_ROLE.ANALYST,
  APP_ROLE.AUDITOR,
  APP_ROLE.VIEWER,
] as const;

export const VENDOR_STATUS = {
  ACTIVE: 'active',
  UNDER_REVIEW: 'under_review',
  SUSPENDED: 'suspended',
  OFFBOARDED: 'offboarded',
} as const;
export type VendorStatus = typeof VENDOR_STATUS[keyof typeof VENDOR_STATUS];

export const RISK_TIER = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;
export type RiskTier = typeof RISK_TIER[keyof typeof RISK_TIER];
