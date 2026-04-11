import { createFileRoute } from '@tanstack/react-router';
import { RiskDetailView } from '@/components/risk-register/RiskDetailView';

export const Route = createFileRoute('/risk-register/$riskId')({
  component: RiskDetailPage,
  head: () => ({
    meta: [
      { title: 'Risk Detail — ZeroDay Security' },
      { name: 'description', content: 'Risk detail with matrix visualization, treatment plan, and linked controls' },
    ],
  }),
});

function RiskDetailPage() {
  const { riskId } = Route.useParams();
  return <RiskDetailView riskId={riskId} />;
}
