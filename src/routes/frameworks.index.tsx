import { createFileRoute } from '@tanstack/react-router';
import { FrameworkMarketplace } from '@/components/frameworks/FrameworkMarketplace';

export const Route = createFileRoute('/frameworks/')({
  component: FrameworksPage,
  head: () => ({
    meta: [
      { title: 'Frameworks — WatchDog Security' },
      { name: 'description', content: 'Compliance frameworks marketplace and management' },
    ],
  }),
});

function FrameworksPage() {
  return <FrameworkMarketplace />;
}
