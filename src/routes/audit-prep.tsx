import { createFileRoute } from '@tanstack/react-router';
import { AppLayout } from '@/components/AppLayout';

export const Route = createFileRoute('/audit-prep')({
  component: () => <AppLayout />,
});
