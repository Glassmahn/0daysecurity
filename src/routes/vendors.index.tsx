import { createFileRoute } from '@tanstack/react-router';
import { VendorsPage } from '@/components/vendors/VendorsPage';
import { zodValidator, fallback } from '@tanstack/zod-adapter';
import { z } from 'zod';

const vendorsSearchSchema = z.object({
  riskTier: fallback(z.string(), 'all').default('all'),
  status: fallback(z.string(), 'all').default('all'),
  q: fallback(z.string(), '').default(''),
  tab: fallback(z.string(), 'directory').default('directory'),
});

export const Route = createFileRoute('/vendors/')({
  component: VendorsIndexPage,
  validateSearch: zodValidator(vendorsSearchSchema),
});

function VendorsIndexPage() {
  const searchParams = Route.useSearch();
  return <VendorsPage searchParams={searchParams} />;
}
