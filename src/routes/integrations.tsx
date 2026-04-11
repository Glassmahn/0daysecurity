import { createFileRoute } from '@tanstack/react-router';
import { AppLayout } from '@/components/AppLayout';

export const Route = createFileRoute('/integrations')({
  component: () => <AppLayout />,
});
