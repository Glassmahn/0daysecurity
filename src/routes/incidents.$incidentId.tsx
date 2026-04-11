import { createFileRoute } from '@tanstack/react-router';
import { AppLayout } from '@/components/AppLayout';

export const Route = createFileRoute('/incidents/$incidentId')({
  component: () => <AppLayout />,
});
