export interface ProviderField {
  key: string;
  label: string;
  placeholder: string;
  type: 'text' | 'password' | 'url';
  hint?: string;
}

export interface ProviderMeta {
  label: string;
  category: string;
  description: string;
  docsUrl: string;
  fields: ProviderField[];
  /** If true, we can ping an endpoint immediately after saving to test the connection. */
  testable: boolean;
}

export const PROVIDER_META: Record<string, ProviderMeta> = {
  slack: {
    label: 'Slack',
    category: 'Communication',
    description: 'Send security alerts and notifications to Slack channels via Incoming Webhooks.',
    docsUrl: 'https://api.slack.com/messaging/webhooks',
    testable: true,
    fields: [
      { key: 'webhook_url', label: 'Incoming Webhook URL', type: 'url', placeholder: 'https://hooks.slack.com/services/…', hint: 'Create one at api.slack.com → Your Apps → Incoming Webhooks' },
      { key: 'channel', label: 'Default Channel', type: 'text', placeholder: '#security-alerts' },
    ],
  },
  aws: {
    label: 'AWS',
    category: 'Cloud',
    description: 'Pull CloudTrail events, Config rules, and Security Hub findings to map against controls.',
    docsUrl: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html',
    testable: true,
    fields: [
      { key: 'account_id', label: 'AWS Account ID', type: 'text', placeholder: '123456789012' },
      { key: 'region', label: 'Primary Region', type: 'text', placeholder: 'us-east-1' },
      { key: 'access_key_id', label: 'Access Key ID', type: 'text', placeholder: 'AKIAIOSFODNN7EXAMPLE' },
      { key: 'secret_access_key', label: 'Secret Access Key', type: 'password', placeholder: '…', hint: 'Create an IAM user with ReadOnlyAccess policy' },
    ],
  },
  github: {
    label: 'GitHub',
    category: 'Code',
    description: 'Monitor branch protection, code review status, and SAST scan results across repositories.',
    docsUrl: 'https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token',
    testable: false,
    fields: [
      { key: 'org', label: 'Organization / Owner', type: 'text', placeholder: 'my-org' },
      { key: 'api_token', label: 'Personal Access Token', type: 'password', placeholder: 'github_pat_…', hint: 'Needs read access to repos, code-scanning, and security-events' },
    ],
  },
  okta: {
    label: 'Okta',
    category: 'Identity',
    description: 'Sync users, groups, and MFA enrollment status. Pull access logs into the audit trail.',
    docsUrl: 'https://developer.okta.com/docs/reference/core-okta-api/',
    testable: true,
    fields: [
      { key: 'domain', label: 'Okta Domain', type: 'url', placeholder: 'https://your-org.okta.com' },
      { key: 'api_token', label: 'API Token', type: 'password', placeholder: 'SSWS …', hint: 'Generated in Okta Admin → Security → API' },
    ],
  },
  datadog: {
    label: 'Datadog',
    category: 'Monitoring',
    description: 'Pull monitor alerts, SLO status, and security signals into the platform.',
    docsUrl: 'https://docs.datadoghq.com/api/latest/',
    testable: false,
    fields: [
      { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'dd-api-…' },
      { key: 'app_key', label: 'Application Key', type: 'password', placeholder: 'dd-app-…' },
      { key: 'site', label: 'Datadog Site', type: 'text', placeholder: 'datadoghq.com' },
    ],
  },
  jira: {
    label: 'Jira',
    category: 'Ticketing',
    description: 'Create and track remediation tickets. Sync finding status when tickets are closed.',
    docsUrl: 'https://developer.atlassian.com/cloud/jira/platform/rest/v3/',
    testable: true,
    fields: [
      { key: 'url', label: 'Jira URL', type: 'url', placeholder: 'https://your-org.atlassian.net' },
      { key: 'email', label: 'Account Email', type: 'text', placeholder: 'you@company.com' },
      { key: 'api_token', label: 'API Token', type: 'password', placeholder: 'ATATT…', hint: 'Generated at id.atlassian.com → Security' },
      { key: 'project_key', label: 'Default Project Key', type: 'text', placeholder: 'SEC' },
    ],
  },
  gcp: {
    label: 'Google Cloud',
    category: 'Cloud',
    description: 'Pull Security Command Center findings, Cloud Audit Logs, and policy compliance results.',
    docsUrl: 'https://cloud.google.com/security-command-center/docs',
    testable: true,
    fields: [
      { key: 'project_id', label: 'GCP Project ID', type: 'text', placeholder: 'my-project-123' },
      { key: 'service_account_json', label: 'Service Account JSON', type: 'password', placeholder: '{ "type": "service_account", ... }', hint: 'Create a service account and download its JSON key' },
    ],
  },
  jamf: {
    label: 'Jamf',
    category: 'MDM',
    description: 'Monitor device compliance, OS patch levels, and configuration profiles across managed endpoints.',
    docsUrl: 'https://developer.jamf.com/jamf-pro/docs',
    testable: true,
    fields: [
      { key: 'url', label: 'Jamf Pro URL', type: 'url', placeholder: 'https://your-org.jamfcloud.com' },
      { key: 'client_id', label: 'Client ID', type: 'text', placeholder: 'client-id-uuid' },
      { key: 'client_secret', label: 'Client Secret', type: 'password', placeholder: '…' },
    ],
  },
  crowdstrike: {
    label: 'CrowdStrike',
    category: 'Security',
    description: 'Pull EDR detection events, endpoint health, and threat intelligence into the alert feed.',
    docsUrl: 'https://falcon.crowdstrike.com/documentation/page/a2a7fc0e/crowdstrike-oauth2-based-apis',
    testable: true,
    fields: [
      { key: 'client_id', label: 'Client ID', type: 'text', placeholder: 'falcon-client-id' },
      { key: 'client_secret', label: 'Client Secret', type: 'password', placeholder: '…' },
      { key: 'base_url', label: 'Base URL', type: 'url', placeholder: 'https://api.crowdstrike.com' },
    ],
  },
  qualys: {
    label: 'Qualys',
    category: 'Security',
    description: 'Import vulnerability scan findings to map against controls and drive remediation workflows.',
    docsUrl: 'https://www.qualys.com/docs/qualys-api-vmpc-user-guide.pdf',
    testable: true,
    fields: [
      { key: 'platform_url', label: 'Platform URL', type: 'url', placeholder: 'https://qualysapi.qualys.com' },
      { key: 'username', label: 'Username', type: 'text', placeholder: 'api-user' },
      { key: 'password', label: 'Password', type: 'password', placeholder: '…' },
    ],
  },
  vanta: {
    label: 'Vanta',
    category: 'Compliance',
    description: 'Pull Vanta control status, test results, and vendor risk scores as evidence.',
    docsUrl: 'https://developer.vanta.com/docs',
    testable: false,
    fields: [
      { key: 'api_token', label: 'API Token', type: 'password', placeholder: 'vanta-api-…' },
    ],
  },
  pagerduty: {
    label: 'PagerDuty',
    category: 'Monitoring',
    description: 'Sync on-call schedules, incidents, and escalation policies to track incident response SLAs.',
    docsUrl: 'https://developer.pagerduty.com/api-reference/',
    testable: false,
    fields: [
      { key: 'api_token', label: 'REST API Key', type: 'password', placeholder: 'u+…' },
      { key: 'service_id', label: 'Default Service ID', type: 'text', placeholder: 'PXXXXXX' },
    ],
  },
};

export const CATEGORY_ORDER = ['Cloud', 'Identity', 'Security', 'Monitoring', 'Communication', 'Code', 'Ticketing', 'MDM', 'Compliance'];
