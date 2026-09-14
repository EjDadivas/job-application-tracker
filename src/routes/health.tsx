import { createFileRoute } from '@tanstack/react-router';
import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { api } from '../../convex/_generated/api';

// The template's smoke test. Load /health after cloning: two answered lines
// mean Convex is reachable, the route tree regenerated, and WorkOS identity is
// readable. Delete this route once the project has real features to load.
export const Route = createFileRoute('/health')({
  component: HealthPage,
  // F-03: the loader prefetches the exact args the component queries with.
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(convexQuery(api.functions.health.ping, {}));
  },
});

function HealthPage() {
  const { data } = useSuspenseQuery(convexQuery(api.functions.health.ping, {}));

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-8">
      <h1 className="text-2xl font-bold tracking-tight">Health</h1>
      <dl className="flex flex-col gap-2 text-sm">
        <div className="flex justify-between border-b pb-2">
          <dt className="text-muted-foreground">Convex server time</dt>
          <dd className="font-medium tabular-nums">{new Date(data.serverTime).toISOString()}</dd>
        </div>
        <div className="flex justify-between border-b pb-2">
          <dt className="text-muted-foreground">WorkOS identity</dt>
          <dd className="font-medium">{data.signedIn ? 'signed in' : 'signed out'}</dd>
        </div>
      </dl>
      <p className="text-muted-foreground text-sm">
        A timestamp here means the backend answered. Signing in flips the second line.
      </p>
    </main>
  );
}
