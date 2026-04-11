import { createFileRoute } from '@tanstack/react-router';
import { AssetDetailView } from '@/components/assets/AssetDetailView';

export const Route = createFileRoute('/assets/$assetId')({
  component: AssetDetailPage,
  head: () => ({
    meta: [
      { title: 'Asset Detail — WatchDog Security' },
      { name: 'description', content: 'Asset detail with vulnerability history, compliance status, and scan results' },
    ],
  }),
});

function AssetDetailPage() {
  const { assetId } = Route.useParams();
  return <AssetDetailView assetId={assetId} />;
}
