import { query } from '../../_generated/server';

// The template's smoke test. It carries no domain on purpose: its whole job is
// to prove the wiring — Convex reachable, function deployed, auth identity
// readable — without inventing an entity every real project then has to delete.
//
// Reads no table. Public per B-05, so the signed-out case is observable.
export const ping = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    // Server clock, so a stale value is visibly stale — a constant would look
    // identical whether the round-trip happened or the cache answered.
    return { serverTime: Date.now(), signedIn: identity !== null };
  },
});
