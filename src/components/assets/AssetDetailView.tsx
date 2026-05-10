import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { assets, controls } from '@/lib/mock-data';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft, Server, Database, Globe, Cloud, Monitor, Network, Laptop,
  Shield, AlertTriangle, CheckCircle2, XCircle, Clock, Bug, Scan,
  Calendar, User, TrendingDown, TrendingUp
} from 'lucide-react';

const typeIcons: Record<string, React.ElementType> = {
  server: Server,
  database: Database,
  application: Globe,
  cloud_resource: Cloud,
  saas_app: Monitor,
  network: Network,
  endpoint: Laptop,
};

const typeStyles: Record<string, string> = {
  server: 'bg-chart-1/15 text-chart-1',
  database: 'bg-chart-5/15 text-chart-5',
  application: 'bg-chart-2/15 text-chart-2',
  cloud_resource: 'bg-chart-3/15 text-chart-3',
  saas_app: 'bg-chart-4/15 text-chart-4',
  network: 'bg-primary/15 text-primary',
  endpoint: 'bg-muted text-muted-foreground',
};

const complianceStyles: Record<string, { style: string; icon: React.ElementType }> = {
  'Compliant': { style: 'bg-status-passing/15 text-status-passing', icon: CheckCircle2 },
  'Partial': { style: 'bg-status-in-progress/15 text-status-in-progress', icon: Clock },
  'Non-compliant': { style: 'bg-status-failing/15 text-status-failing', icon: XCircle },
};

const controlStatusStyle: Record<string, string> = {
  implemented: 'text-status-passing',
  in_progress: 'text-status-in-progress',
  failing: 'text-severity-critical',
  not_implemented: 'text-muted-foreground',
  not_applicable: 'text-muted-foreground',
};

// Mock vulnerability history
const vulnHistory: Record<string, Array<{
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  cve: string | null;
  status: 'open' | 'remediated' | 'accepted' | 'mitigated';
  discoveredAt: string;
  resolvedAt: string | null;
  description: string;
}>> = {
  'ast-1': [
    { id: 'v-1', title: 'Outdated OpenSSL version (1.1.1)', severity: 'critical', cve: 'CVE-2024-5535', status: 'open', discoveredAt: '2026-04-10', resolvedAt: null, description: 'OpenSSL 1.1.1 is end-of-life with known vulnerabilities' },
    { id: 'v-2', title: 'SSH root login enabled', severity: 'high', cve: null, status: 'open', discoveredAt: '2026-04-08', resolvedAt: null, description: 'Root login via SSH should be disabled in production' },
    { id: 'v-3', title: 'Unpatched kernel CVE', severity: 'high', cve: 'CVE-2025-1234', status: 'mitigated', discoveredAt: '2026-03-20', resolvedAt: '2026-03-28', description: 'Linux kernel privilege escalation — mitigated via security group restriction' },
    { id: 'v-4', title: 'TLS 1.0 still accepted', severity: 'medium', cve: null, status: 'remediated', discoveredAt: '2026-02-15', resolvedAt: '2026-02-20', description: 'Legacy TLS versions should be disabled' },
  ],
  'ast-2': [
    { id: 'v-5', title: 'PostgreSQL minor version behind', severity: 'medium', cve: null, status: 'open', discoveredAt: '2026-04-05', resolvedAt: null, description: 'Running 15.4, latest is 15.7 with security patches' },
    { id: 'v-6', title: 'Default pg_hba.conf settings', severity: 'high', cve: null, status: 'remediated', discoveredAt: '2026-03-01', resolvedAt: '2026-03-10', description: 'Using trust authentication for local connections' },
  ],
  'ast-4': [
    { id: 'v-7', title: 'S3 bucket lacks encryption at rest', severity: 'critical', cve: null, status: 'open', discoveredAt: '2026-04-09', resolvedAt: null, description: 'PHI data stored without SSE-S3 or SSE-KMS encryption' },
    { id: 'v-8', title: 'Public access block not enabled', severity: 'critical', cve: null, status: 'open', discoveredAt: '2026-04-09', resolvedAt: null, description: 'Block public access settings not configured on bucket' },
    { id: 'v-9', title: 'No bucket versioning', severity: 'high', cve: null, status: 'open', discoveredAt: '2026-04-01', resolvedAt: null, description: 'Versioning disabled — no protection against accidental deletion' },
    { id: 'v-10', title: 'Overly permissive bucket policy', severity: 'high', cve: null, status: 'mitigated', discoveredAt: '2026-03-15', resolvedAt: '2026-03-20', description: 'Wildcard principal in bucket policy restricted to VPC endpoint' },
  ],
  'ast-7': [
    { id: 'v-11', title: 'VPN firmware outdated', severity: 'high', cve: 'CVE-2025-4321', status: 'open', discoveredAt: '2026-04-03', resolvedAt: null, description: 'Known authentication bypass in current firmware version' },
    { id: 'v-12', title: 'Weak cipher suites enabled', severity: 'medium', cve: null, status: 'remediated', discoveredAt: '2026-02-01', resolvedAt: '2026-02-15', description: 'RC4 and DES cipher suites were enabled' },
  ],
};

// Mock scan results
const scanResults: Record<string, Array<{
  id: string;
  scanType: string;
  date: string;
  status: 'passed' | 'failed' | 'warning';
  findings: number;
  criticalFindings: number;
  scanner: string;
  duration: string;
}>> = {
  'ast-1': [
    { id: 's-1', scanType: 'Vulnerability Scan', date: '2026-04-11', status: 'failed', findings: 12, criticalFindings: 2, scanner: 'CrowdStrike', duration: '4m 32s' },
    { id: 's-2', scanType: 'Configuration Audit', date: '2026-04-10', status: 'warning', findings: 5, criticalFindings: 0, scanner: 'AWS Config', duration: '1m 15s' },
    { id: 's-3', scanType: 'Vulnerability Scan', date: '2026-03-28', status: 'failed', findings: 14, criticalFindings: 3, scanner: 'CrowdStrike', duration: '4m 18s' },
    { id: 's-4', scanType: 'Compliance Check', date: '2026-03-15', status: 'failed', findings: 8, criticalFindings: 1, scanner: 'Internal', duration: '2m 45s' },
    { id: 's-5', scanType: 'Vulnerability Scan', date: '2026-02-28', status: 'warning', findings: 6, criticalFindings: 0, scanner: 'CrowdStrike', duration: '4m 10s' },
  ],
  'ast-2': [
    { id: 's-6', scanType: 'Database Audit', date: '2026-04-11', status: 'warning', findings: 3, criticalFindings: 0, scanner: 'pgAudit', duration: '2m 10s' },
    { id: 's-7', scanType: 'Vulnerability Scan', date: '2026-04-05', status: 'warning', findings: 2, criticalFindings: 0, scanner: 'CrowdStrike', duration: '3m 22s' },
  ],
  'ast-3': [
    { id: 's-8', scanType: 'DAST Scan', date: '2026-04-10', status: 'passed', findings: 0, criticalFindings: 0, scanner: 'OWASP ZAP', duration: '12m 05s' },
    { id: 's-9', scanType: 'SAST Scan', date: '2026-04-08', status: 'passed', findings: 1, criticalFindings: 0, scanner: 'Semgrep', duration: '1m 30s' },
  ],
  'ast-4': [
    { id: 's-10', scanType: 'Cloud Security Scan', date: '2026-04-09', status: 'failed', findings: 8, criticalFindings: 3, scanner: 'AWS Config', duration: '0m 45s' },
    { id: 's-11', scanType: 'Data Classification', date: '2026-04-01', status: 'failed', findings: 4, criticalFindings: 2, scanner: 'Macie', duration: '15m 30s' },
  ],
  'ast-5': [
    { id: 's-12', scanType: 'Container Scan', date: '2026-04-10', status: 'passed', findings: 1, criticalFindings: 0, scanner: 'Trivy', duration: '3m 10s' },
  ],
  'ast-6': [
    { id: 's-13', scanType: 'SSO Config Audit', date: '2026-04-11', status: 'passed', findings: 0, criticalFindings: 0, scanner: 'Okta Health', duration: '0m 30s' },
  ],
  'ast-7': [
    { id: 's-14', scanType: 'Network Scan', date: '2026-04-10', status: 'warning', findings: 3, criticalFindings: 0, scanner: 'Nessus', duration: '8m 15s' },
  ],
  'ast-8': [
    { id: 's-15', scanType: 'Endpoint Scan', date: '2026-04-09', status: 'passed', findings: 0, criticalFindings: 0, scanner: 'CrowdStrike', duration: '2m 05s' },
  ],
};

// Asset-to-control mapping
const assetControlMap: Record<string, string[]> = {
  'ast-1': ['CC-6.1', 'CC-6.2', 'CC-7.1', 'CC-7.3', 'CC-6.6'],
  'ast-2': ['CC-6.1', 'CC-6.3', 'CC-7.2', 'CC-6.8', 'CC-7.3'],
  'ast-3': ['CC-6.1', 'CC-6.2', 'CC-7.1', 'CC-6.6'],
  'ast-4': ['CC-7.2', 'HP-1.1', 'HP-1.2', 'CC-6.8', 'CC-6.1'],
  'ast-5': ['CC-6.6', 'CC-7.3'],
  'ast-6': ['CC-6.1', 'CC-6.2', 'CC-6.3'],
  'ast-7': ['CC-6.6', 'CC-7.1'],
  'ast-8': ['CC-6.1', 'HP-2.1'],
};

function riskColor(score: number) {
  if (score >= 80) return 'text-severity-critical';
  if (score >= 60) return 'text-severity-high';
  if (score >= 40) return 'text-severity-medium';
  return 'text-status-passing';
}

function riskBg(score: number) {
  if (score >= 80) return 'bg-severity-critical';
  if (score >= 60) return 'bg-severity-high';
  if (score >= 40) return 'bg-severity-medium';
  return 'bg-status-passing';
}

const sevStyle: Record<string, string> = {
  critical: 'bg-severity-critical/15 text-severity-critical',
  high: 'bg-severity-high/15 text-severity-high',
  medium: 'bg-severity-medium/15 text-severity-medium',
  low: 'bg-status-passing/15 text-status-passing',
};

const vulnStatusStyle: Record<string, string> = {
  open: 'bg-status-failing/15 text-status-failing',
  remediated: 'bg-status-passing/15 text-status-passing',
  accepted: 'bg-muted text-muted-foreground',
  mitigated: 'bg-status-in-progress/15 text-status-in-progress',
};

const scanStatusStyle: Record<string, { style: string; icon: React.ElementType }> = {
  passed: { style: 'bg-status-passing/15 text-status-passing', icon: CheckCircle2 },
  warning: { style: 'bg-status-in-progress/15 text-status-in-progress', icon: AlertTriangle },
  failed: { style: 'bg-status-failing/15 text-status-failing', icon: XCircle },
};

interface AssetDetailViewProps {
  assetId: string;
}

export function AssetDetailView({ assetId }: AssetDetailViewProps) {
  const asset = assets.find(a => a.id === assetId);
  const [activeTab, setActiveTab] = useState<'vulns' | 'compliance' | 'controls' | 'scans'>('vulns');

  if (!asset) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Server className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-lg font-semibold text-foreground">Asset not found</h2>
        <Link to="/assets" className="text-primary hover:underline text-sm">← Back to Assets</Link>
      </div>
    );
  }

  const TypeIcon = typeIcons[asset.type] || Server;
  const compStyle = complianceStyles[asset.complianceStatus] || complianceStyles['Partial'];
  const CompIcon = compStyle.icon;
  const vulnerabilities = vulnHistory[assetId] || [];
  const scans = scanResults[assetId] || [];
  const linkedControlRefs = assetControlMap[assetId] || [];
  const linkedControls = controls.filter(c => linkedControlRefs.includes(c.ref));

  const openVulns = vulnerabilities.filter(v => v.status === 'open').length;
  const critVulns = vulnerabilities.filter(v => v.severity === 'critical' && v.status === 'open').length;
  const lastScan = scans[0];
  const passingControls = linkedControls.filter(c => c.status === 'implemented').length;

  const tabs = [
    { key: 'vulns' as const, label: 'Vulnerabilities', count: vulnerabilities.length },
    { key: 'compliance' as const, label: 'Compliance', count: null },
    { key: 'controls' as const, label: 'Linked Controls', count: linkedControls.length },
    { key: 'scans' as const, label: 'Scan History', count: scans.length },
  ];

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link to="/assets">
          <button className="mt-1 p-1 rounded hover:bg-secondary transition-colors">
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <TypeIcon className="h-4 w-4 text-muted-foreground" />
            <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${typeStyles[asset.type] || 'bg-muted text-muted-foreground'}`}>
              {asset.type.replace(/_/g, ' ')}
            </span>
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${compStyle.style}`}>
              <CompIcon className="h-3 w-3" /> {asset.complianceStatus}
            </span>
            <span className="text-xs text-muted-foreground">{asset.environment}</span>
          </div>
          <h1 className="text-lg font-bold text-foreground font-mono">{asset.name}</h1>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" /> Owner: <strong className="text-foreground">{asset.owner}</strong></span>
            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Last Scanned: <strong className="text-foreground">{new Date(asset.lastScanned).toLocaleDateString('en-CA')}</strong></span>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Risk Score</div>
          <div className={`text-2xl font-bold ${riskColor(asset.riskScore)}`}>{asset.riskScore}</div>
          <div className="mt-2">
            <div className="h-1.5 w-full bg-surface rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${riskBg(asset.riskScore)}`} style={{ width: `${asset.riskScore}%` }} />
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Open Vulns</div>
          <div className={`text-2xl font-bold ${openVulns > 0 ? 'text-severity-critical' : 'text-status-passing'}`}>{openVulns}</div>
          <div className="text-xs text-muted-foreground mt-1">{critVulns} critical</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Controls</div>
          <div className="text-2xl font-bold text-foreground">{passingControls}/{linkedControls.length}</div>
          <div className="text-xs text-muted-foreground mt-1">passing</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Last Scan</div>
          {lastScan ? (
            <>
              <div className={`text-lg font-bold capitalize ${lastScan.status === 'passed' ? 'text-status-passing' : lastScan.status === 'warning' ? 'text-status-warning' : 'text-severity-critical'}`}>
                {lastScan.status}
              </div>
              <div className="text-xs text-muted-foreground mt-1">{lastScan.findings} findings</div>
            </>
          ) : (
            <div className="text-lg font-bold text-muted-foreground">—</div>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-secondary rounded-md p-0.5 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${activeTab === t.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t.label}{t.count !== null ? ` (${t.count})` : ''}
          </button>
        ))}
      </div>

      {/* Vulnerabilities */}
      {activeTab === 'vulns' && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Bug className="h-4 w-4 text-muted-foreground" /> Vulnerability History ({vulnerabilities.length})
            </h3>
          </div>
          {vulnerabilities.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No vulnerabilities recorded for this asset</div>
          ) : (
            <div className="divide-y divide-border">
              {vulnerabilities.map(v => (
                <div key={v.id} className="px-5 py-3 hover:bg-surface transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${sevStyle[v.severity]}`}>{v.severity}</span>
                        <span className="text-sm font-medium text-foreground">{v.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{v.description}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        {v.cve && <span className="font-mono text-primary">{v.cve}</span>}
                        <span>Discovered: {v.discoveredAt}</span>
                        {v.resolvedAt && <span>Resolved: {v.resolvedAt}</span>}
                      </div>
                    </div>
                    <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded shrink-0 ${vulnStatusStyle[v.status]}`}>{v.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Compliance */}
      {activeTab === 'compliance' && (
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" /> Compliance Status
          </h3>
          <div className="space-y-4">
            {/* Overall status */}
            <div className={`p-4 rounded-lg border ${asset.complianceStatus === 'Compliant' ? 'border-status-passing/30 bg-status-passing/5' : asset.complianceStatus === 'Partial' ? 'border-status-in-progress/30 bg-status-in-progress/5' : 'border-severity-critical/30 bg-severity-critical/5'}`}>
              <div className="flex items-center gap-2">
                <CompIcon className={`h-5 w-5 ${asset.complianceStatus === 'Compliant' ? 'text-status-passing' : asset.complianceStatus === 'Partial' ? 'text-status-in-progress' : 'text-severity-critical'}`} />
                <div>
                  <p className="text-sm font-medium text-foreground">{asset.complianceStatus}</p>
                  <p className="text-xs text-muted-foreground">
                    {asset.complianceStatus === 'Compliant'
                      ? 'This asset meets all applicable compliance requirements.'
                      : asset.complianceStatus === 'Partial'
                      ? 'Some controls are not fully implemented for this asset.'
                      : 'This asset has critical compliance gaps that require immediate attention.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Compliance checks */}
            <div className="space-y-2">
              {[
                { check: 'Encryption at rest', pass: !['ast-4'].includes(assetId) },
                { check: 'Encryption in transit', pass: !['ast-1'].includes(assetId) },
                { check: 'Access logging enabled', pass: true },
                { check: 'Vulnerability scanning', pass: true },
                { check: 'Backup configured', pass: !['ast-4', 'ast-7'].includes(assetId) },
                { check: 'Patch management', pass: !['ast-1', 'ast-7'].includes(assetId) },
                { check: 'Network segmentation', pass: !['ast-1'].includes(assetId) },
                { check: 'MFA required for access', pass: !['ast-2'].includes(assetId) },
              ].map((c, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg border border-border">
                  <span className="text-sm text-foreground">{c.check}</span>
                  {c.pass ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-status-passing">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Pass
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-medium text-severity-critical">
                      <XCircle className="h-3.5 w-3.5" /> Fail
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Risk trend */}
            <div className="p-4 rounded-lg border border-border">
              <div className="text-xs text-muted-foreground uppercase font-semibold mb-2">Risk Trend (30 days)</div>
              <div className="flex items-center gap-2">
                {asset.riskScore >= 60 ? (
                  <TrendingUp className="h-4 w-4 text-severity-critical" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-status-passing" />
                )}
                <span className={`text-sm font-medium ${asset.riskScore >= 60 ? 'text-severity-critical' : 'text-status-passing'}`}>
                  {asset.riskScore >= 60 ? 'Risk increasing — action required' : 'Risk stable or decreasing'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Linked Controls */}
      {activeTab === 'controls' && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" /> Linked Controls ({linkedControls.length})
            </h3>
          </div>
          {linkedControls.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No controls linked</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Control</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Framework</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Status</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Impl.</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Last Tested</th>
                </tr>
              </thead>
              <tbody>
                {linkedControls.map(c => (
                  <tr key={c.id} className="border-b border-border hover:bg-surface transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">{c.ref}</span>
                        <span className="font-medium text-foreground">{c.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{c.framework}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs font-medium capitalize ${controlStatusStyle[c.status]}`}>
                        {c.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <Progress value={c.implementationPct} className="h-1 w-16" />
                        <span className="text-xs text-muted-foreground">{c.implementationPct}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{c.lastTested || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Scan History */}
      {activeTab === 'scans' && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Scan className="h-4 w-4 text-muted-foreground" /> Scan History ({scans.length})
            </h3>
          </div>
          {scans.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No scan results available</div>
          ) : (
            <div className="divide-y divide-border">
              {scans.map(s => {
                const ss = scanStatusStyle[s.status];
                const ScanIcon = ss.icon;
                return (
                  <div key={s.id} className="px-5 py-3 hover:bg-surface transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <ScanIcon className={`h-4 w-4 ${s.status === 'passed' ? 'text-status-passing' : s.status === 'warning' ? 'text-status-in-progress' : 'text-severity-critical'}`} />
                        <div>
                          <div className="text-sm font-medium text-foreground">{s.scanType}</div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <span>{s.date}</span>
                            <span>·</span>
                            <span>{s.scanner}</span>
                            <span>·</span>
                            <span>{s.duration}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">{s.findings} findings</div>
                          {s.criticalFindings > 0 && (
                            <div className="text-[10px] text-severity-critical font-semibold">{s.criticalFindings} critical</div>
                          )}
                        </div>
                        <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${ss.style}`}>{s.status}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
