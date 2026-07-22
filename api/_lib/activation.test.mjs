import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PLAN_CATALOG, resolveActivation } from './plan-catalog.mjs';
import { evaluateActivation } from './validate-activation.mjs';

const OK = {
  method: 'POST',
  authenticated: true,
  emailVerified: true,
  testPhaseEnabled: true,
  planId: 'creator',
  billingCycle: 'monthly',
};

test('resolveActivation derives server prices and limits', () => {
  assert.deepEqual(resolveActivation('tester', 'one_time'), {
    planId: 'tester',
    billingCycle: 'one_time',
    priceCents: 990,
    bookLimit: 1,
  });
  assert.equal(resolveActivation('starter', 'monthly').priceCents, 2900);
  assert.equal(resolveActivation('starter', 'annual').priceCents, 30624);
  assert.equal(resolveActivation('creator', 'monthly').priceCents, 5900);
  assert.equal(resolveActivation('creator', 'annual').priceCents, 60180);
  assert.equal(resolveActivation('pro', 'monthly').priceCents, 9900);
  assert.equal(resolveActivation('pro', 'annual').priceCents, 95040);
  assert.equal(resolveActivation('pro', 'annual').bookLimit, 25);
});

test('annual price is twelve monthly instalments minus the tiered discount', () => {
  const expected = { starter: 12, creator: 15, pro: 20 };
  for (const id of ['starter', 'creator', 'pro']) {
    const { monthly, annual } = PLAN_CATALOG[id].cycles;
    const pct = PLAN_CATALOG[id].annualDiscountPercent;
    assert.equal(pct, expected[id], `${id} discount`);
    assert.equal(annual, Math.round(monthly * 12 * (1 - pct / 100)), id);
  }
});

test('annual savings versus twelve monthly instalments are exact', () => {
  assert.equal(2900 * 12 - PLAN_CATALOG.starter.cycles.annual, 4176);
  assert.equal(5900 * 12 - PLAN_CATALOG.creator.cycles.annual, 10620);
  assert.equal(9900 * 12 - PLAN_CATALOG.pro.cycles.annual, 23760);
});

test('the old flat annual prices are gone from the catalog', () => {
  const annuals = ['starter', 'creator', 'pro'].map(
    (id) => PLAN_CATALOG[id].cycles.annual,
  );
  for (const stale of [29000, 59000, 99000])
    assert.ok(!annuals.includes(stale), `stale ${stale}`);
});

test('prices come from the catalog, never from the request body', () => {
  const forged = {
    ...OK,
    planId: 'creator',
    billingCycle: 'annual',
    priceCents: 1,
    bookLimit: 9999,
  };
  const r = evaluateActivation(forged);
  assert.equal(r.activation.priceCents, 60180);
  assert.equal(r.activation.bookLimit, 12);
});

test('resolveActivation rejects invalid plans and combinations', () => {
  assert.equal(resolveActivation('tester', 'monthly'), null);
  assert.equal(resolveActivation('creator', 'one_time'), null);
  assert.equal(resolveActivation('admin', 'monthly'), null);
  assert.equal(resolveActivation('creator', 'weekly'), null);
  assert.equal(resolveActivation(null, undefined), null);
});

test('evaluateActivation accepts a valid request', () => {
  const r = evaluateActivation(OK);
  assert.ok('activation' in r);
  assert.equal(r.activation.priceCents, 5900);
});

test('evaluateActivation rejects non-POST methods', () => {
  assert.equal(evaluateActivation({ ...OK, method: 'GET' }).error.code, 405);
});

test('evaluateActivation rejects when the test phase is disabled', () => {
  assert.equal(
    evaluateActivation({ ...OK, testPhaseEnabled: false }).error.code,
    403,
  );
});

test('evaluateActivation rejects a missing/invalid token', () => {
  assert.equal(
    evaluateActivation({ ...OK, authenticated: false }).error.code,
    401,
  );
});

test('evaluateActivation rejects an unverified e-mail', () => {
  assert.equal(
    evaluateActivation({ ...OK, emailVerified: false }).error.code,
    403,
  );
});

test('evaluateActivation rejects an invalid plan or billing cycle', () => {
  assert.equal(evaluateActivation({ ...OK, planId: 'free' }).error.code, 400);
  assert.equal(
    evaluateActivation({ ...OK, billingCycle: 'weekly' }).error.code,
    400,
  );
  assert.equal(
    evaluateActivation({ ...OK, planId: 'tester', billingCycle: 'monthly' })
      .error.code,
    400,
  );
});
