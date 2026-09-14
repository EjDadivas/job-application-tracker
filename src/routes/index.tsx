import { Link, createFileRoute } from '@tanstack/react-router';
import { useAuth } from '@workos/authkit-tanstack-react-start/client';
import { getAuth } from '@workos/authkit-tanstack-react-start';
import { ArrowRightIcon, LogOutIcon } from 'lucide-react';
import { usePostHogReset } from '../lib/posthog';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import type { User } from '@workos/authkit-tanstack-react-start';

export const Route = createFileRoute('/')({
  component: Home,
  loader: async () => {
    const { user } = await getAuth();
    return { user };
  },
});

function Home() {
  const { user } = Route.useLoaderData();

  return (
    <>
      <header className="bg-background/80 sticky top-0 z-10 flex flex-row items-center justify-between border-b px-6 py-3 backdrop-blur">
        <span className="font-semibold">Two Tabs Starter</span>
        {user ? (
          <UserMenu user={user} />
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <a href="/sign-in">Sign in</a>
            </Button>
            <Button size="sm" asChild>
              <a href="/sign-up">Sign up</a>
            </Button>
          </div>
        )}
      </header>

      <main className="mx-auto flex max-w-2xl flex-col gap-8 p-8">
        <div className="flex flex-col gap-3 text-center">
          <h1 className="text-4xl font-bold tracking-tight">TanStack Start + Convex + WorkOS</h1>
          <p className="text-muted-foreground">
            A Two Tabs starter template — TanStack Start routing, a Convex backend, WorkOS auth and PostHog
            instrumentation, with no domain of its own. Build yours on top.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Health</CardTitle>
            <CardDescription>
              The smoke test. It proves Convex is reachable and WorkOS identity is readable — the two things
              that are tedious to debug once a real feature is on top of them.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-start gap-3">
            <Button asChild>
              <Link to="/health">
                Check the stack
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </Button>
            {!user && (
              <p className="text-muted-foreground text-sm">
                <a href="/sign-in" className="underline underline-offset-4 hover:no-underline">
                  Sign in
                </a>{' '}
                to see the identity line flip.
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}

function UserMenu({ user }: { user: User }) {
  const { signOut } = useAuth();
  const resetPostHog = usePostHogReset();
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          {user.email}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          {name && <span>{name}</span>}
          <span className="text-muted-foreground text-xs font-normal">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => {
            // MARK: PostHog - Reset on sign out
            resetPostHog();
            void signOut();
          }}
        >
          <LogOutIcon />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
