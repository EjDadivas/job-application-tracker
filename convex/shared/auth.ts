import { ConvexError } from 'convex/values';
import type { MutationCtx, QueryCtx } from '../_generated/server';

// requireAuth — the three-tier auth gate for public write functions (per B-05).
// Throws a ConvexError whose stable `code` ('unauthenticated') is what tests and
// the frontend branch on (per B-12), never the human-readable message.
export async function requireAuth(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError({ code: 'unauthenticated', message: 'You must be signed in to do that.' });
  }
  return identity;
}
