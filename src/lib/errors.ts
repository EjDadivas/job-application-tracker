import { ConvexError } from 'convex/values';

// Convex wraps a thrown payload's JSON into `.message`, so reading `err.message`
// leaks internals into the UI. Backend errors carry `{ code, message }` (B-12) —
// pull the human-readable half out of `.data` and fall back for everything else.
//
// Extraction only, no rendering: a shared helper that fires its own toast/banner
// produces duplicates when several call sites hit the same error. Display belongs
// at the call site (vault/architecture/frontend/toast-notifications.md).
export function convexErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (error instanceof ConvexError) {
    const data = error.data as { message?: string } | string;
    if (typeof data === 'string') return data;
    if (data.message) return data.message;
  }
  return fallback;
}

// Branch on the stable `code` (B-12) when the UI needs to react differently —
// e.g. prompting sign-in on 'unauthenticated' rather than just showing the message.
export function convexErrorCode(error: unknown): string | undefined {
  if (error instanceof ConvexError) {
    const data = error.data as { code?: string } | string;
    if (typeof data !== 'string') return data.code;
  }
  return undefined;
}
