import { createFileRoute } from '@tanstack/react-router';
import { VendorDetailView } from '@/components/vendors/VendorDetailView';

export const Route = createFileRoute('/vendors/$vendorId')({
  component: VendorDetailPage,
});

function VendorDetailPage() {
  const { vendorId } = Route.useParams();
  return <VendorDetailView vendorId={vendorId} />;
}
