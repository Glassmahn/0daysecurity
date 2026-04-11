import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Play, CheckCircle, XCircle, Clock, AlertTriangle, Calendar,
  RefreshCw, Filter, Plus, Search, Library, FlaskConical, BarChart3,
  Timer, User, Cpu, FileText,
} from 'lucide-react';
import { Input } from '@/components/ui/input';

/* ── Mock Data ───────────────────────────────────────── */
const testRuns = [
  { id: 'TR-001', name: 'SOC 2 Access Control Quarterly', control: 'AC-1', status: 'passed', method: 'automated', tester: 'System', date: '2026-04-10', duration: '3m 42s', findings: 0 },
  { id: 'TR-002', name: 'Encryption At Rest Validation', control: 'SC-3', status: 'failed', method: 'automated', tester: 'System', date: '2026-04-09', duration: '5m 18s', findings: 3 },
  { id: 'TR-003', name: 'Change Management Walkthrough', control: 'CC-8.1', status: 'passed', method: 'manual', tester: 'Sarah Chen', date: '2026-04-08', duration: '45m', findings: 0 },
  { id: 'TR-004', name: 'Incident Response Tabletop', control: 'IR-1', status: 'in_progress', method: 'manual', tester: 'James Wilson', date: '2026-04-11', duration: '—', findings: 0 },
  { id: 'TR-005', name: 'Vendor Risk Assessment Review', control: 'VR-2', status: 'passed', method: 'manual', tester: 'Maria Lopez', date: '2026-04-07', duration: '1h 12m', findings: 1 },
  { id: 'TR-006', name: 'Password Policy Compliance Scan', control: 'AC-7', status: 'failed', method: 'automated', tester: 'System', date: '2026-04-06', duration: '2m 05s', findings: 12 },
  { id: 'TR-007', name: 'Data Backup Integrity Check', control: 'BC-3', status: 'passed', method: 'automated', tester: 'System', date: '2026-04-05', duration: '8m 33s', findings: 0 },
  { id: 'TR-008', name: 'Physical Security Walkthrough', control: 'PE-1', status: 'exception', method: 'manual', tester: 'David Park', date: '2026-04-04', duration: '2h', findings: 2 },
];

const testLibrary = [
  { id: 'TL-001', name: 'Logical Access Review', category: 'Access Control', frequency: 'Quarterly', type: 'automated', frameworks: ['SOC 2', 'ISO 27001'], lastRun: '2026-04-10', controlsCovered: 4, description: 'Validates user access permissions against role-based matrix' },
  { id: 'TL-002', name: 'Encryption Standards Audit', category: 'Data Protection', frequency: 'Monthly', type: 'automated', frameworks: ['HIPAA', 'PCI DSS'], lastRun: '2026-04-09', controlsCovered: 3, description: 'Scans all storage volumes and transit channels for encryption compliance' },
  { id: 'TL-003', name: 'Change Advisory Board Review', category: 'Change Management', frequency: 'Weekly', type: 'manual', frameworks: ['SOC 2', 'ITIL'], lastRun: '2026-04-08', controlsCovered: 2, description: 'Reviews all change requests processed through CAB workflow' },
  { id: 'TL-004', name: 'Incident Response Simulation', category: 'Incident Response', frequency: 'Semi-Annual', type: 'manual', frameworks: ['SOC 2', 'NIST CSF'], lastRun: '2026-03-15', controlsCovered: 6, description: 'Full tabletop exercise simulating a security breach scenario' },
  { id: 'TL-005', name: 'Vulnerability Scan', category: 'Vulnerability Management', frequency: 'Weekly', type: 'automated', frameworks: ['PCI DSS', 'SOC 2'], lastRun: '2026-04-11', controlsCovered: 5, description: 'Automated external and internal vulnerability scanning' },
  { id: 'TL-006', name: 'Business Continuity Test', category: 'Business Continuity', frequency: 'Annual', type: 'manual', frameworks: ['ISO 22301', 'SOC 2'], lastRun: '2025-11-20', controlsCovered: 8, description: 'Full DR failover and recovery exercise' },
  { id: 'TL-007', name: 'Privileged Access Monitoring', category: 'Access Control', frequency: 'Daily', type: 'automated', frameworks: ['SOC 2', 'HIPAA'], lastRun: '2026-04-11', controlsCovered: 2, description: 'Continuous monitoring of privileged account activity' },
  { id: 'TL-008', name: 'Security Awareness Assessment', category: 'Personnel Security', frequency: 'Quarterly', type: 'manual', frameworks: ['SOC 2', 'ISO 27001'], lastRun: '2026-03-01', controlsCovered: 1, description: 'Phishing simulation and security knowledge assessment' },
];

const scheduleItems = [
  { test: 'Logical Access Review', nextRun: '2026-04-15', frequency: 'Quarterly', assignee: 'System', status: 'scheduled' },
  { test: 'Vulnerability Scan', nextRun: '2026-04-12', frequency: 'Weekly', assignee: 'System', status: 'scheduled' },
  { test: 'Change Advisory Board Review', nextRun: '2026-04-14', frequency: 'Weekly', assignee: 'Sarah Chen', status: 'scheduled' },
  { test: 'Privileged Access Monitoring', nextRun: '2026-04-12', frequency: 'Daily', assignee: 'System', status: 'scheduled' },
  { test: 'Security Awareness Assessment', nextRun: '2026-06-01', frequency: 'Quarterly', assignee: 'HR Team', status: 'pending_approval' },
  { test: 'Incident Response Simulation', nextRun: '2026-09-15', frequency: 'Semi-Annual', assignee: 'Security Team', status: 'scheduled' },
];

function statusBadge(status: string) {
  const map: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string; icon: React.ReactNode }> = {
    passed: { variant: 'default', label: 'Passed', icon: <CheckCircle className="h-3 w-3" /> },
    failed: { variant: 'destructive', label: 'Failed', icon: <XCircle className="h-3 w-3" /> },
    in_progress: { variant: 'secondary', label: 'In Progress', icon: <RefreshCw className="h-3 w-3 animate-spin" /> },
    exception: { variant: 'outline', label: 'Exception', icon: <AlertTriangle className="h-3 w-3" /> },
    scheduled: { variant: 'secondary', label: 'Scheduled', icon: <Clock className="h-3 w-3" /> },
    pending_approval: { variant: 'outline', label: 'Pending Approval', icon: <Clock className="h-3 w-3" /> },
  };
  const s = map[status] ?? { variant: 'outline' as const, label: status, icon: null };
  return <Badge variant={s.variant} className="gap-1">{s.icon}{s.label}</Badge>;
}

export function TestsPage() {
  const [search, setSearch] = useState('');

  const passed = testRuns.filter(t => t.status === 'passed').length;
  const failed = testRuns.filter(t => t.status === 'failed').length;
  const inProgress = testRuns.filter(t => t.status === 'in_progress').length;
  const passRate = Math.round((passed / testRuns.length) * 100);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tests</h1>
          <p className="text-sm text-muted-foreground">Manage test execution, library, and schedules across all compliance frameworks</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Filter className="h-4 w-4 mr-1" />Filter</Button>
          <Button size="sm"><Plus className="h-4 w-4 mr-1" />New Test</Button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10"><BarChart3 className="h-5 w-5 text-primary" /></div>
          <div><p className="text-2xl font-bold">{passRate}%</p><p className="text-xs text-muted-foreground">Pass Rate</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-500/10"><CheckCircle className="h-5 w-5 text-green-500" /></div>
          <div><p className="text-2xl font-bold">{passed}</p><p className="text-xs text-muted-foreground">Passed</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-destructive/10"><XCircle className="h-5 w-5 text-destructive" /></div>
          <div><p className="text-2xl font-bold">{failed}</p><p className="text-xs text-muted-foreground">Failed</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-yellow-500/10"><RefreshCw className="h-5 w-5 text-yellow-500" /></div>
          <div><p className="text-2xl font-bold">{inProgress}</p><p className="text-xs text-muted-foreground">In Progress</p></div>
        </CardContent></Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="runs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="runs" className="gap-1"><Play className="h-3.5 w-3.5" />Test Runs</TabsTrigger>
          <TabsTrigger value="library" className="gap-1"><Library className="h-3.5 w-3.5" />Test Library</TabsTrigger>
          <TabsTrigger value="schedule" className="gap-1"><Calendar className="h-3.5 w-3.5" />Schedule</TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1"><BarChart3 className="h-3.5 w-3.5" />Analytics</TabsTrigger>
        </TabsList>

        {/* Test Runs */}
        <TabsContent value="runs">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Recent Test Runs</CardTitle>
                <div className="relative w-64"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search runs..." className="pl-8 h-9" value={search} onChange={e => setSearch(e.target.value)} /></div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>ID</TableHead><TableHead>Test Name</TableHead><TableHead>Control</TableHead>
                  <TableHead>Method</TableHead><TableHead>Tester</TableHead><TableHead>Duration</TableHead>
                  <TableHead>Findings</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {testRuns.filter(t => t.name.toLowerCase().includes(search.toLowerCase())).map(run => (
                    <TableRow key={run.id} className="cursor-pointer">
                      <TableCell className="font-mono text-xs">{run.id}</TableCell>
                      <TableCell className="font-medium">{run.name}</TableCell>
                      <TableCell><Badge variant="outline">{run.control}</Badge></TableCell>
                      <TableCell>{run.method === 'automated' ? <span className="flex items-center gap-1 text-xs"><Cpu className="h-3 w-3" />Auto</span> : <span className="flex items-center gap-1 text-xs"><User className="h-3 w-3" />Manual</span>}</TableCell>
                      <TableCell className="text-sm">{run.tester}</TableCell>
                      <TableCell className="text-sm font-mono">{run.duration}</TableCell>
                      <TableCell>{run.findings > 0 ? <Badge variant="destructive" className="text-xs">{run.findings}</Badge> : <span className="text-muted-foreground text-xs">0</span>}</TableCell>
                      <TableCell>{statusBadge(run.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{run.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Test Library */}
        <TabsContent value="library">
          <div className="grid gap-4 md:grid-cols-2">
            {testLibrary.map(test => (
              <Card key={test.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">{test.name}</CardTitle>
                    <Badge variant={test.type === 'automated' ? 'default' : 'secondary'} className="text-xs gap-1">
                      {test.type === 'automated' ? <Cpu className="h-3 w-3" /> : <User className="h-3 w-3" />}
                      {test.type}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">{test.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="flex flex-wrap gap-1">
                    {test.frameworks.map(f => <Badge key={f} variant="outline" className="text-xs">{f}</Badge>)}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div><p className="text-muted-foreground">Category</p><p className="font-medium">{test.category}</p></div>
                    <div><p className="text-muted-foreground">Frequency</p><p className="font-medium">{test.frequency}</p></div>
                    <div><p className="text-muted-foreground">Controls</p><p className="font-medium">{test.controlsCovered} covered</p></div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-2">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Last: {test.lastRun}</span>
                    <Button variant="ghost" size="sm" className="h-7 text-xs"><Play className="h-3 w-3 mr-1" />Run Now</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Schedule */}
        <TabsContent value="schedule">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Upcoming Test Schedule</CardTitle>
              <CardDescription>Automated and manual tests scheduled for upcoming periods</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Test</TableHead><TableHead>Next Run</TableHead><TableHead>Frequency</TableHead>
                  <TableHead>Assignee</TableHead><TableHead>Status</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {scheduleItems.map((s, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{s.test}</TableCell>
                      <TableCell className="font-mono text-sm">{s.nextRun}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{s.frequency}</Badge></TableCell>
                      <TableCell className="text-sm">{s.assignee}</TableCell>
                      <TableCell>{statusBadge(s.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Pass Rate Trend</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {['Jan','Feb','Mar','Apr'].map((m, i) => {
                  const rates = [88, 91, 85, passRate];
                  return (<div key={m} className="space-y-1">
                    <div className="flex justify-between text-xs"><span>{m} 2026</span><span className="font-medium">{rates[i]}%</span></div>
                    <Progress value={rates[i]} className="h-2" />
                  </div>);
                })}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Tests by Category</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  { cat: 'Access Control', count: 3, total: 8 },
                  { cat: 'Data Protection', count: 2, total: 8 },
                  { cat: 'Change Management', count: 1, total: 8 },
                  { cat: 'Incident Response', count: 1, total: 8 },
                  { cat: 'Other', count: 1, total: 8 },
                ].map(c => (
                  <div key={c.cat} className="flex items-center justify-between text-sm">
                    <span>{c.cat}</span>
                    <div className="flex items-center gap-2">
                      <Progress value={(c.count / c.total) * 100} className="w-24 h-2" />
                      <span className="text-xs text-muted-foreground w-6 text-right">{c.count}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Coverage Metrics</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Controls Tested', value: '34/42', pct: 81 },
                    { label: 'Framework Coverage', value: '6/7', pct: 86 },
                    { label: 'Automated Tests', value: '18/26', pct: 69 },
                    { label: 'On Schedule', value: '22/26', pct: 85 },
                  ].map(m => (
                    <div key={m.label} className="space-y-1 text-center">
                      <p className="text-lg font-bold">{m.value}</p>
                      <Progress value={m.pct} className="h-1.5" />
                      <p className="text-xs text-muted-foreground">{m.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Recent Failures</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {testRuns.filter(t => t.status === 'failed').map(t => (
                  <div key={t.id} className="flex items-center justify-between p-2 rounded-md bg-destructive/5 border border-destructive/10">
                    <div>
                      <p className="text-sm font-medium">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.date} · {t.findings} findings</p>
                    </div>
                    <Button variant="outline" size="sm" className="text-xs h-7">Investigate</Button>
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
