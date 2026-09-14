import { defineSchema } from 'convex/server';

// Aggregate every feature's tables here via spread (B-08). Add a feature by
// importing its `<entity>Tables` from `features/<entity>/schema.ts` and
// spreading it in:
//
//   import { postsTables } from './features/posts/schema';
//   export default defineSchema({ ...postsTables });
//
// Empty on purpose — the template ships no domain.
export default defineSchema({});
