import { createFileRoute } from '@tanstack/react-router';
import { ControlDetailView } from '@/components/controls/ControlDetailView';

export const Route = createFileRoute('/controls/$controlId')({
  component: ControlDetailPage,
  head: () => ({
    meta: [
      { title: 'Control Detail — WatchDog Security' },
      { name: 'description', content: 'Control detail with evidence mapping, test history, and cross-framework mappings' },
    ],
  }),
});

function ControlDetailPage() {
  const { controlId } = Route.useParams();
  return <ControlDetailView controlId={controlId} />;
}
