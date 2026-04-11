import { createFileRoute } from '@tanstack/react-router';
import { TestsPage } from '@/components/tests/TestsPage';

export const Route = createFileRoute('/tests/')({
  component: TestsPage,
});
