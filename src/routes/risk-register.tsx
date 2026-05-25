import { createFileRoute } from '@tanstack/react-router';
import { AppLayout } from '@/components/AppLayout';

function RiskRegisterPage() {
  return <AppLayout />;
}

export const Route = createFileRoute('/risk-register')({
  component: RiskRegisterPage,
});
