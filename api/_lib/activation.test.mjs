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
  assert.equal(resolveActivation('creator', 'annual').priceCents, 59000);
  assert.equal(resolveActivation('starter', 'monthly').priceCents, 2900);
  assert.equal(resolveActivation('pro', 'annual').bookLimit, 25);
});

test('annual equals ten monthly instalments for paid plans', () => {
  for (const id of ['starter', 'creator', 'pro']) {
    const { monthly, annual } = PLAN_CATALOG[id].cycles;
    assert.equal(annual, monthly * 10, id);
  }
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
