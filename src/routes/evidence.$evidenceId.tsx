import { createFileRoute } from '@tanstack/react-router';
import { EvidenceDetailView } from '@/components/evidence/EvidenceDetailView';

export const Route = createFileRoute('/evidence/$evidenceId')({
  component: EvidenceDetailPage,
  head: () => ({
    meta: [
      { title: 'Evidence Detail — ZeroDay Security' },
      { name: 'description', content: 'Evidence detail with collection history, linked controls, and expiration tracking' },
    ],
  }),
});

function EvidenceDetailPage() {
  const { evidenceId } = Route.useParams();
  return <EvidenceDetailView evidenceId={evidenceId} />;
}
