import { describe, expect, it } from 'vitest';
import { api } from '../../../_generated/api';
import { memberIdentity, setupBase } from '../../../test.setup';

// If this file fails, the problem is the template's wiring, not a feature.
describe('health.ping', () => {
  it('answers without a session — reads are public (B-05)', async () => {
    const t = setupBase();
    const result = await t.query(api.functions.health.ping, {});
    expect(result.signedIn).toBe(false);
    expect(result.serverTime).toBeGreaterThan(0);
  });

  it('sees the identity when one is present', async () => {
    const t = setupBase();
    const result = await t.withIdentity(memberIdentity).query(api.functions.health.ping, {});
    expect(result.signedIn).toBe(true);
  });
});
