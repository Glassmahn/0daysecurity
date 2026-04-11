import { createFileRoute, Link } from '@tanstack/react-router';
import { IncidentWorkbench } from '@/components/incidents/IncidentWorkbench';

export const Route = createFileRoute('/incidents_/$incidentId/')({
  component: IncidentDetailPage,
  head: () => ({
    meta: [
      { title: 'Incident Detail — WatchDog Security' },
      { name: 'description', content: 'Incident workbench with timeline, evidence, and response checklist' },
    ],
  }),
});

function IncidentDetailPage() {
  const { incidentId } = Route.useParams();
  return <IncidentWorkbench incidentId={incidentId} />;
}
