import { createFileRoute } from '@tanstack/react-router';
import { AppLayout } from '@/components/AppLayout';

export const Route = createFileRoute('/dashboard')({
  component: DashboardLayout,
});

function DashboardLayout() {
  return <AppLayout />;
}
