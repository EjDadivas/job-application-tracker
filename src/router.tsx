import { createRouter } from '@tanstack/react-router';
import { ConvexQueryClient } from '@convex-dev/react-query';
import { QueryClient } from '@tanstack/react-query';
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query';
import { ConvexProviderWithAuth, ConvexReactClient } from 'convex/react';
import { AuthKitProvider, useAccessToken, useAuth } from '@workos/authkit-tanstack-react-start/client';
import { PostHogErrorBoundary, PostHogProvider } from '@posthog/react';
import { useCallback, useMemo } from 'react';
import { routeTree } from './routeTree.gen';
import { usePostHogIdentify } from './lib/posthog';
import type { ReactNode } from 'react';

export function getRouter() {
  const CONVEX_URL = (import.meta as any).env.VITE_CONVEX_URL!;
  if (!CONVEX_URL) {
    throw new Error('missing VITE_CONVEX_URL env var');
  }
  const convex = new ConvexReactClient(CONVEX_URL);
  const convexQueryClient = new ConvexQueryClient(convex);

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryKeyHashFn: convexQueryClient.hashFn(),
        queryFn: convexQueryClient.queryFn(),
        gcTime: 5000,
      },
    },
  });
  convexQueryClient.connect(queryClient);

  const router = createRouter({
    routeTree,
    defaultPreload: 'intent',
    scrollRestoration: true,
    defaultPreloadStaleTime: 0, // Let React Query handle all caching
    defaultErrorComponent: ({ error }) => (
      <p>{error instanceof Error ? (error.stack ?? error.message) : String(error)}</p>
    ),
    defaultNotFoundComponent: () => <p>not found</p>,
    context: { queryClient, convexClient: convex, convexQueryClient },
    // AuthKitProvider uses TanStack Router hooks internally, so it must
    // render inside router context. InnerWrap renders inside the router.
    InnerWrap: ({ children }) => (
      <AnalyticsProvider>
        <AuthKitProvider>
          {/* MARK: PostHog - Identify User (app-wide, whenever a WorkOS user is present) */}
          <PostHogIdentifier />
          <ConvexProviderWithAuth client={convexQueryClient.convexClient} useAuth={useAuthFromWorkOS}>
            {children}
          </ConvexProviderWithAuth>
        </AuthKitProvider>
      </AnalyticsProvider>
    ),
  });
  setupRouterSsrQueryIntegration({ router, queryClient });

  return router;
}

// MARK: PostHog - Provider Setup
// PostHog is optional: with no VITE_POSTHOG_API_KEY the provider is skipped and
// every posthog hook no-ops, so the template runs without a PostHog account.
const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_API_KEY as string | undefined;
const POSTHOG_HOST = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) || 'https://us.i.posthog.com';

function AnalyticsProvider({ children }: { children: ReactNode }) {
  if (!POSTHOG_KEY) return <>{children}</>;

  return (
    <PostHogProvider
      apiKey={POSTHOG_KEY}
      options={{
        api_host: POSTHOG_HOST,
        // Automatic error tracking.
        capture_exceptions: {
          capture_unhandled_errors: true,
          capture_unhandled_rejections: true,
          capture_console_errors: false,
        },
      }}
    >
      <PostHogErrorBoundary fallback={<div className="p-8">Something went wrong.</div>}>
        {children}
      </PostHogErrorBoundary>
    </PostHogProvider>
  );
}

function PostHogIdentifier() {
  const { user } = useAuth();
  usePostHogIdentify(user);
  return null;
}

function useAuthFromWorkOS() {
  const { loading, user } = useAuth();
  const { getAccessToken, refresh } = useAccessToken();

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      if (!user) {
        return null;
      }

      if (forceRefreshToken) {
        return (await refresh()) ?? null;
      }

      return (await getAccessToken()) ?? null;
    },
    [user, refresh, getAccessToken],
  );

  return useMemo(
    () => ({
      isLoading: loading,
      isAuthenticated: !!user,
      fetchAccessToken,
    }),
    [loading, user, fetchAccessToken],
  );
}
