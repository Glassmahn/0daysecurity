import { createFileRoute } from '@tanstack/react-router';
import { FrameworkDetailView } from '@/components/frameworks/FrameworkDetailView';

export const Route = createFileRoute('/frameworks/$frameworkId')({
  component: FrameworkDetailPage,
  head: () => ({
    meta: [
      { title: 'Framework Detail — ZeroDay Security' },
      { name: 'description', content: 'Framework detail with mapped controls, compliance status, and progress' },
    ],
  }),
});

function FrameworkDetailPage() {
  const { frameworkId } = Route.useParams();
  return <FrameworkDetailView frameworkId={frameworkId} />;
}
