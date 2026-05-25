import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/vendor-portal')({
  component: VendorPortalLayout,
});

function VendorPortalLayout() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto py-12 px-4">
        <Outlet />
      </div>
    </div>
  );
}
