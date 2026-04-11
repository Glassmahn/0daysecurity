import { createFileRoute } from '@tanstack/react-router';
import { AuditTrailPage } from '@/components/audit-trail/AuditTrailPage';

export const Route = createFileRoute('/audits/')({
  component: AuditTrailPage,
  head: () => ({ meta: [{ title: 'Audit Trail — ZeroDay Security' }] }),
});
