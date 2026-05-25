import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/trust-portal')({
  component: () => <Outlet />,
});
