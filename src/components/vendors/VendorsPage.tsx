import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Building2, ShieldCheck, ShieldAlert, AlertTriangle, Clock, Search, Plus,
  Filter, FileText, ExternalLink, Star, TrendingUp, TrendingDown, Minus,
  Globe, Lock, Mail, Phone, MapPin, Calendar,
} from 'lucide-react';
import { Input } from '@/components/ui/input';

/* ── Mock Data ───────────────────────────────────────── */
const vendors = [
  { id: 'V-001', name: 'Amazon Web Services', category: 'Cloud Infrastructure', riskTier: 'critical', riskScore: 82, status: 'approved', soc2: true, iso27001: true, hipaa: true, contractEnd: '2027-03-15', lastAssessment: '2026-03-01', contact: 'enterprise@aws.amazon.com', location: 'Seattle, WA', dataAccess: 'PHI, PII, Financial', trend: 'stable' },
  { id: 'V-002', name: 'Okta', category: 'Identity & Access', riskTier: 'high', riskScore: 71, status: 'approved', soc2: true, iso27001: true, hipaa: false, contractEnd: '2026-12-31', lastAssessment: '2026-02-15', contact: 'security@okta.com', location: 'San Francisco, CA', dataAccess: 'PII, Authentication', trend: 'improving' },
  { id: 'V-003', name: 'Snowflake', category: 'Data Warehouse', riskTier: 'high', riskScore: 68, status: 'approved', soc2: true, iso27001: true, hipaa: true, contractEnd: '2026-09-30', lastAssessment: '2026-01-20', contact: 'trust@snowflake.com', location: 'Bozeman, MT', dataAccess: 'PHI, PII, Analytics', trend: 'stable' },
  { id: 'V-004', name: 'SendGrid', category: 'Email Service', riskTier: 'medium', riskScore: 55, status: 'approved', soc2: true, iso27001: false, hipaa: false, contractEnd: '2026-06-30', lastAssessment: '2025-12-10', contact: 'security@sendgrid.com', location: 'Denver, CO', dataAccess: 'PII, Email Content', trend: 'declining' },
  { id: 'V-005', name: 'Jira (Atlassian)', category: 'Project Management', riskTier: 'low', riskScore: 38, status: 'approved', soc2: true, iso27001: true, hipaa: false, contractEnd: '2027-01-15', lastAssessment: '2026-02-28', contact: 'trust@atlassian.com', location: 'Sydney, AU', dataAccess: 'Internal Tickets', trend: 'stable' },
  { id: 'V-006', name: 'Acme Analytics', category: 'Business Intelligence', riskTier: 'medium', riskScore: 48, status: 'under_review', soc2: false, iso27001: false, hipaa: false, contractEnd: '—', lastAssessment: '2026-04-01', contact: 'info@acmeanalytics.io', location: 'Austin, TX', dataAccess: 'Analytics Data', trend: 'new' },
  { id: 'V-007', name: 'PagerDuty', category: 'Incident Management', riskTier: 'medium', riskScore: 52, status: 'approved', soc2: true, iso27001: true, hipaa: false, contractEnd: '2026-11-30', lastAssessment: '2026-01-05', contact: 'security@pagerduty.com', location: 'San Francisco, CA', dataAccess: 'Alert Data, PII', trend: 'stable' },
  { id: 'V-008', name: 'Legacy Payroll Co', category: 'HR / Payroll', riskTier: 'critical', riskScore: 29, status: 'needs_action', soc2: false, iso27001: false, hipaa: false, contractEnd: '2026-05-31', lastAssessment: '2025-06-15', contact: 'support@legacypayroll.com', location: 'Chicago, IL', dataAccess: 'PII, Financial, SSN', trend: 'declining' },
];

const assessmentHistory = [
  { vendor: 'Amazon Web Services', date: '2026-03-01', score: 82, prevScore: 80, assessor: 'Sarah Chen', type: 'Annual', findings: 2, status: 'completed' },
  { vendor: 'Okta', date: '2026-02-15', score: 71, prevScore: 65, assessor: 'James Wilson', type: 'Annual', findings: 4, status: 'completed' },
  { vendor: 'Legacy Payroll Co', date: '2025-06-15', score: 29, prevScore: 42, assessor: 'Maria Lopez', type: 'Annual', findings: 18, status: 'overdue' },
  { vendor: 'Acme Analytics', date: '2026-04-01', score: 48, prevScore: 0, assessor: 'David Park', type: 'Onboarding', findings: 8, status: 'in_progress' },
  { vendor: 'Snowflake', date: '2026-01-20', score: 68, prevScore: 70, assessor: 'Sarah Chen', type: 'Annual', findings: 5, status: 'completed' },
  { vendor: 'SendGrid', date: '2025-12-10', score: 55, prevScore: 62, assessor: 'James Wilson', type: 'Annual', findings: 7, status: 'completed' },
];

const contractItems = [
  { vendor: 'SendGrid', contractEnd: '2026-06-30', daysLeft: 80, autoRenew: true, value: '$24,000/yr', dpa: true, sla: '99.9%' },
  { vendor: 'Legacy Payroll Co', contractEnd: '2026-05-31', daysLeft: 50, autoRenew: false, value: '$96,000/yr', dpa: false, sla: '99.0%' },
  { vendor: 'Snowflake', contractEnd: '2026-09-30', daysLeft: 172, autoRenew: true, value: '$180,000/yr', dpa: true, sla: '99.95%' },
  { vendor: 'PagerDuty', contractEnd: '2026-11-30', daysLeft: 233, autoRenew: true, value: '$18,000/yr', dpa: true, sla: '99.9%' },
  { vendor: 'Okta', contractEnd: '2026-12-31', daysLeft: 264, autoRenew: true, value: '$72,000/yr', dpa: true, sla: '99.99%' },
  { vendor: 'Jira (Atlassian)', contractEnd: '2027-01-15', daysLeft: 279, autoRenew: true, value: '$36,000/yr', dpa: true, sla: '99.9%' },
  { vendor: 'Amazon Web Services', contractEnd: '2027-03-15', daysLeft: 338, autoRenew: true, value: '$420,000/yr', dpa: true, sla: '99.99%' },
];

function riskTierBadge(tier: string) {
  const map: Record<string, 'destructive' | 'default' | 'secondary' | 'outline'> = { critical: 'destructive', high: 'default', medium: 'secondary', low: 'outline' };
  return <Badge variant={map[tier] ?? 'outline'} className="capitalize text-xs">{tier}</Badge>;
}

function statusBadge(status: string) {
  const map: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    approved: { variant: 'default', label: 'Approved' },
    under_review: { variant: 'secondary', label: 'Under Review' },
    needs_action: { variant: 'destructive', label: 'Needs Action' },
    completed: { variant: 'default', label: 'Completed' },
    in_progress: { variant: 'secondary', label: 'In Progress' },
    overdue: { variant: 'destructive', label: 'Overdue' },
  };
  const s = map[status] ?? { variant: 'outline' as const, label: status };
  return <Badge variant={s.variant} className="text-xs">{s.label}</Badge>;
}

function trendIcon(trend: string) {
  if (trend === 'improving') return <TrendingUp className="h-3.5 w-3.5 text-green-500" />;
  if (trend === 'declining') return <TrendingDown className="h-3.5 w-3.5 text-destructive" />;
  if (trend === 'new') return <Star className="h-3.5 w-3.5 text-yellow-500" />;
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
}

function riskScoreColor(score: number) {
  if (score >= 70) return 'text-green-600';
  if (score >= 50) return 'text-yellow-600';
  return 'text-destructive';
}

export function VendorsPage() {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const approved = vendors.filter(v => v.status === 'approved').length;
  const needsAction = vendors.filter(v => v.status === 'needs_action').length;
  const avgScore = Math.round(vendors.reduce((a, v) => a + v.riskScore, 0) / vendors.length);
  const expiringContracts = contractItems.filter(c => c.daysLeft <= 90).length;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Vendors</h1>
          <p className="text-sm text-muted-foreground">Third-party vendor risk management, assessments, and contract tracking</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Filter className="h-4 w-4 mr-1" />Filter</Button>
          <Button size="sm"><Plus className="h-4 w-4 mr-1" />Add Vendor</Button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10"><Building2 className="h-5 w-5 text-primary" /></div>
          <div><p className="text-2xl font-bold">{vendors.length}</p><p className="text-xs text-muted-foreground">Total Vendors</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-500/10"><ShieldCheck className="h-5 w-5 text-green-500" /></div>
          <div><p className="text-2xl font-bold">{approved}</p><p className="text-xs text-muted-foreground">Approved</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-destructive/10"><ShieldAlert className="h-5 w-5 text-destructive" /></div>
          <div><p className="text-2xl font-bold">{needsAction}</p><p className="text-xs text-muted-foreground">Needs Action</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-yellow-500/10"><AlertTriangle className="h-5 w-5 text-yellow-500" /></div>
          <div><p className="text-2xl font-bold">{expiringContracts}</p><p className="text-xs text-muted-foreground">Expiring Soon</p></div>
        </CardContent></Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="directory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="directory" className="gap-1"><Building2 className="h-3.5 w-3.5" />Directory</TabsTrigger>
          <TabsTrigger value="assessments" className="gap-1"><FileText className="h-3.5 w-3.5" />Assessments</TabsTrigger>
          <TabsTrigger value="contracts" className="gap-1"><Lock className="h-3.5 w-3.5" />Contracts</TabsTrigger>
          <TabsTrigger value="risk-map" className="gap-1"><ShieldAlert className="h-3.5 w-3.5" />Risk Map</TabsTrigger>
        </TabsList>

        {/* Directory */}
        <TabsContent value="directory">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Vendor Directory</CardTitle>
                <div className="relative w-64"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search vendors..." className="pl-8 h-9" value={search} onChange={e => setSearch(e.target.value)} /></div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Vendor</TableHead><TableHead>Category</TableHead><TableHead>Risk Tier</TableHead>
                  <TableHead>Score</TableHead><TableHead>Certifications</TableHead><TableHead>Data Access</TableHead>
                  <TableHead>Trend</TableHead><TableHead>Status</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {vendors.filter(v => v.name.toLowerCase().includes(search.toLowerCase())).map(v => (
                    <TableRow key={v.id} className="cursor-pointer">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center text-xs font-bold">{v.name.charAt(0)}</div>
                          <div><p className="font-medium text-sm">{v.name}</p><p className="text-xs text-muted-foreground">{v.location}</p></div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{v.category}</TableCell>
                      <TableCell>{riskTierBadge(v.riskTier)}</TableCell>
                      <TableCell><span className={`font-bold ${riskScoreColor(v.riskScore)}`}>{v.riskScore}</span></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {v.soc2 && <Badge variant="outline" className="text-[10px] px-1">SOC 2</Badge>}
                          {v.iso27001 && <Badge variant="outline" className="text-[10px] px-1">ISO</Badge>}
                          {v.hipaa && <Badge variant="outline" className="text-[10px] px-1">HIPAA</Badge>}
                          {!v.soc2 && !v.iso27001 && !v.hipaa && <span className="text-xs text-muted-foreground">None</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs max-w-[120px] truncate">{v.dataAccess}</TableCell>
                      <TableCell>{trendIcon(v.trend)}</TableCell>
                      <TableCell>{statusBadge(v.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assessments */}
        <TabsContent value="assessments">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Assessment History</CardTitle>
              <CardDescription>Track vendor security assessments and scoring trends</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Vendor</TableHead><TableHead>Date</TableHead><TableHead>Type</TableHead>
                  <TableHead>Assessor</TableHead><TableHead>Score</TableHead><TableHead>Change</TableHead>
                  <TableHead>Findings</TableHead><TableHead>Status</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {assessmentHistory.map((a, i) => {
                    const delta = a.prevScore > 0 ? a.score - a.prevScore : null;
                    return (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{a.vendor}</TableCell>
                        <TableCell className="text-sm font-mono">{a.date}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{a.type}</Badge></TableCell>
                        <TableCell className="text-sm">{a.assessor}</TableCell>
                        <TableCell><span className={`font-bold ${riskScoreColor(a.score)}`}>{a.score}/100</span></TableCell>
                        <TableCell>
                          {delta !== null ? (
                            <span className={`text-xs font-medium ${delta > 0 ? 'text-green-600' : delta < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                              {delta > 0 ? '+' : ''}{delta}
                            </span>
                          ) : <span className="text-xs text-muted-foreground">New</span>}
                        </TableCell>
                        <TableCell>{a.findings > 10 ? <Badge variant="destructive" className="text-xs">{a.findings}</Badge> : <span className="text-sm">{a.findings}</span>}</TableCell>
                        <TableCell>{statusBadge(a.status)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contracts */}
        <TabsContent value="contracts">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Contract Management</CardTitle>
              <CardDescription>Track contract expirations, renewals, and compliance requirements</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Vendor</TableHead><TableHead>Contract End</TableHead><TableHead>Days Left</TableHead>
                  <TableHead>Value</TableHead><TableHead>Auto-Renew</TableHead><TableHead>DPA</TableHead>
                  <TableHead>SLA</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {contractItems.map((c, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{c.vendor}</TableCell>
                      <TableCell className="text-sm font-mono">{c.contractEnd}</TableCell>
                      <TableCell>
                        <span className={`font-medium text-sm ${c.daysLeft <= 60 ? 'text-destructive' : c.daysLeft <= 90 ? 'text-yellow-600' : 'text-foreground'}`}>
                          {c.daysLeft}d
                        </span>
                      </TableCell>
                      <TableCell className="text-sm font-medium">{c.value}</TableCell>
                      <TableCell>{c.autoRenew ? <Badge variant="default" className="text-xs">Yes</Badge> : <Badge variant="destructive" className="text-xs">No</Badge>}</TableCell>
                      <TableCell>{c.dpa ? <Badge variant="outline" className="text-xs text-green-600">Signed</Badge> : <Badge variant="destructive" className="text-xs">Missing</Badge>}</TableCell>
                      <TableCell className="text-sm font-mono">{c.sla}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk Map */}
        <TabsContent value="risk-map">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Risk Distribution by Tier</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {['critical', 'high', 'medium', 'low'].map(tier => {
                  const count = vendors.filter(v => v.riskTier === tier).length;
                  const pct = Math.round((count / vendors.length) * 100);
                  return (
                    <div key={tier} className="space-y-1">
                      <div className="flex justify-between text-sm"><span className="capitalize font-medium">{tier}</span><span>{count} vendors ({pct}%)</span></div>
                      <Progress value={pct} className="h-2" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Data Access Summary</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  { type: 'PHI (Protected Health Info)', count: vendors.filter(v => v.dataAccess.includes('PHI')).length, severity: 'critical' },
                  { type: 'PII (Personal Identifiable)', count: vendors.filter(v => v.dataAccess.includes('PII')).length, severity: 'high' },
                  { type: 'Financial Data', count: vendors.filter(v => v.dataAccess.includes('Financial')).length, severity: 'high' },
                  { type: 'Internal / Low Sensitivity', count: vendors.filter(v => !v.dataAccess.includes('PHI') && !v.dataAccess.includes('PII') && !v.dataAccess.includes('Financial')).length, severity: 'low' },
                ].map(d => (
                  <div key={d.type} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                    <span className="text-sm">{d.type}</span>
                    <div className="flex items-center gap-2">
                      {riskTierBadge(d.severity)}
                      <span className="text-sm font-bold">{d.count}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="md:col-span-2">
              <CardHeader><CardTitle className="text-base">Vendors Requiring Attention</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {vendors.filter(v => v.status === 'needs_action' || v.riskScore < 40 || v.trend === 'declining').map(v => (
                  <div key={v.id} className="flex items-center justify-between p-3 rounded-md bg-destructive/5 border border-destructive/10">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-md bg-destructive/10 flex items-center justify-center text-xs font-bold text-destructive">{v.name.charAt(0)}</div>
                      <div>
                        <p className="text-sm font-medium">{v.name}</p>
                        <p className="text-xs text-muted-foreground">Score: {v.riskScore} · {v.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {riskTierBadge(v.riskTier)}
                      <Button variant="outline" size="sm" className="text-xs h-7">Review</Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
