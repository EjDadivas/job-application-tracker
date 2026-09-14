/// <reference types="vite/client" />
import { convexTest } from 'convex-test';
import schema from './schema';

// convex-test needs a glob of every Convex module so it can load functions in
// the edge-runtime test environment (see vitest.config.ts).
// `import.meta.glob` is a Vite API; convex/tsconfig.json only pulls in node types,
// so the reference above is what keeps `npx convex dev`'s typecheck happy.
export const modules = import.meta.glob('./**/*.*s');

// A bare test instance with the schema wired up. Every fixture builds on this.
export function setupBase() {
  return convexTest(schema, modules);
}

// ---------------------------------------------------------------------------
// Identity constants
//
// Plain JWT-like objects for `t.withIdentity()`. Only `subject` is read by this
// template's auth gate. This project has no tenancy, so they carry no `org_id`
// and B-11's third test is cross-**author**: a second signed-in actor where the
// first one's row is what must not move.
//
// Add `org_id` only if the project actually grows tenancy — until then it
// asserts against a field no function reads.
// ---------------------------------------------------------------------------

// Authenticated, but the system has never seen this subject.
export const newcomerIdentity = {
  subject: 'user_newcomer',
  name: 'Newcomer',
  email: 'newcomer@example.com',
};

// The ordinary signed-in actor — the happy path of the B-11 trio.
export const memberIdentity = {
  subject: 'user_member',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
};

// A different signed-in actor — the "wrong actor" of the B-11 trio.
export const otherMemberIdentity = {
  subject: 'user_other',
  name: 'Grace Hopper',
  email: 'grace@example.com',
};

// ---------------------------------------------------------------------------
// State fixtures
//
// `setupWith<State>()` helpers seed a named starting state and return
// `{ t, ...ids }`. Extend an existing one rather than rebuilding it, so a row's
// shape stays defined in exactly one place:
//
//   export async function setupWithPost() {
//     const t = setupBase();
//     const postId = await t.run(async (ctx) =>
//       ctx.db.insert('posts', { authorSubject: memberIdentity.subject, body: 'hi' }));
//     return { t, postId };
//   }
//
// None yet — the template ships no domain, so it seeds no rows. This file is
// the one place to read for the current names; never copy a list into a note.
// ---------------------------------------------------------------------------
