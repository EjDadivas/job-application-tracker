import { usePostHog } from '@posthog/react';
import { useCallback, useEffect, useRef } from 'react';
import type { User } from '@workos/authkit-tanstack-react-start';

// PostHog helpers, kept in one module so instrumentation is easy to find.
// usePostHog() always returns a client — when VITE_POSTHOG_API_KEY is unset the
// provider is skipped (see src/router.tsx) and this is a default, uninitialized
// instance whose methods no-op, so the template runs without a PostHog account.

// MARK: PostHog - User Identification
export function usePostHogIdentify(user: User | null | undefined) {
  const posthog = usePostHog();
  const identifiedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user) return;
    if (identifiedRef.current === user.id) return;

    posthog.identify(user.id, {
      email: user.email,
      name: [user.firstName, user.lastName].filter(Boolean).join(' ') || undefined,
      firstName: user.firstName ?? undefined,
      lastName: user.lastName ?? undefined,
    });
    identifiedRef.current = user.id;
  }, [user, posthog]);
}

// MARK: PostHog - Reset Function
export function usePostHogReset() {
  const posthog = usePostHog();
  return useCallback(() => posthog.reset(), [posthog]);
}

// MARK: PostHog - Custom Events
// The template ships no domain events. Add them here as named callbacks so
// every capture in the app is greppable from one file.
export function usePostHogCapture() {
  const posthog = usePostHog();

  const captureEvent = useCallback(
    (name: string, props?: Record<string, unknown>) => posthog.capture(name, props),
    [posthog],
  );

  return { captureEvent };
}
