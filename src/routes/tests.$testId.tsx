import { createFileRoute } from '@tanstack/react-router';
import { TestDetailView } from '@/components/tests/TestDetailView';

export const Route = createFileRoute('/tests/$testId')({
  component: TestDetailPage,
});

function TestDetailPage() {
  const { testId } = Route.useParams();
  return <TestDetailView testId={testId} />;
}
