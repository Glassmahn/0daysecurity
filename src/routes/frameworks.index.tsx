import { createFileRoute } from '@tanstack/react-router';
import { Suspense } from 'react';
import { FrameworkMarketplace } from '@/components/frameworks/FrameworkMarketplace';
import { Loader2 } from 'lucide-react';

export const Route = createFileRoute('/frameworks/')({
  component: FrameworksPage,
  head: () => ({
    meta: [
      { title: 'Frameworks — ZeroDay Security' },
      { name: 'description', content: 'Compliance frameworks marketplace and management' },
    ],
  }),
});

function FrameworksPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-24 gap-3 animate-fade-up">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">Loading frameworks…</p>
      </div>
    }>
      <FrameworkMarketplace />
    </Suspense>
  );
}
