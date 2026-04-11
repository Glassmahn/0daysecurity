import { createFileRoute } from '@tanstack/react-router';
import { PolicyDetailView } from '@/components/policies/PolicyDetailView';

export const Route = createFileRoute('/policies/$policyId')({
  component: PolicyDetailPage,
  head: () => ({
    meta: [
      { title: 'Policy Detail — ZeroDay Security' },
      { name: 'description', content: 'Policy detail with version history, approval workflow, and linked controls' },
    ],
  }),
});

function PolicyDetailPage() {
  const { policyId } = Route.useParams();
  return <PolicyDetailView policyId={policyId} />;
}
