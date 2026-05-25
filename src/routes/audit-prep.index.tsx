import { createFileRoute } from '@tanstack/react-router';
import { AuditPrepPage } from '@/components/audit-prep/AuditPrepPage';

export const Route = createFileRoute('/audit-prep/')({
  component: AuditPrepPage,
  head: () => ({ meta: [{ title: 'Audit Preparation — ZeroDay Security' }] }),
});
