// Integration test for the activation endpoint against the Firebase emulators.
// Drives the real handler (mock req/res) via the Admin SDK: valid activation
// writes a server-derived entitlement keyed by the TOKEN's uid; the body cannot
// inject uid/price/status; a plan change updates the same doc and preserves
// activatedAt; and GET / missing-token / invalid-plan / invalid-combo /
// disabled-test-phase are rejected. Usage: node tools/e2e/activate-endpoint.mjs

process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099';
process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';
process.env.FIREBASE_ADMIN_PROJECT_ID ??= 'demo-kdp-masterpeace';
process.env.ENABLE_TEST_PHASE_PLANS = 'true';

import admin from 'firebase-admin';

const PW = 'Test1234!';
let failures = 0;

/** Records a check result. */
function check(label, cond) {
  process.stdout.write(`${cond ? 'PASS' : 'FAIL'}  ${label}\n`);
  if (!cond) failures += 1;
}

admin.initializeApp({ projectId: process.env.FIREBASE_ADMIN_PROJECT_ID });

const email = `endpoint-${Date.now()}@example.com`;
const user = await admin
  .auth()
  .createUser({ email, password: PW, emailVerified: true });
const uid = user.uid;

/** Signs in via REST and returns an ID token. */
async function idToken() {
  const res = await fetch(
    'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: PW, returnSecureToken: true }),
    },
  );
  return (await res.json()).idToken;
}

const token = await idToken();
const { default: handler } = await import('../../api/activate-test-plan.mjs');

/** Builds a Vercel-like response mock. */
function mockRes() {
  const res = { statusCode: 0, body: null };
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (obj) => {
    res.body = obj;
    return res;
  };
  return res;
}

/** Invokes the handler with a mock request. */
async function call({ method = 'POST', tok, body = {} }) {
  const req = {
    method,
    headers: tok ? { authorization: `Bearer ${tok}` } : {},
    body,
  };
  const res = mockRes();
  await handler(req, res);
  return res;
}

/** Reads the entitlement document for the test user. */
async function ent() {
  const snap = await admin.firestore().doc(`entitlements/${uid}`).get();
  return snap.exists ? snap.data() : null;
}

let res = await call({
  tok: token,
  body: { planId: 'creator', billingCycle: 'monthly' },
});
check('valid activation → 200', res.statusCode === 200);
let e = await ent();
check(
  'writes active/creator/monthly with server price+limit, source test_phase',
  !!e &&
    e.status === 'active' &&
    e.planId === 'creator' &&
    e.billingCycle === 'monthly' &&
    e.priceCents === 5900 &&
    e.bookLimit === 12 &&
    e.source === 'test_phase' &&
    e.testMode === true,
);
const firstActivatedAt = JSON.stringify(e.activatedAt);

check(
  'GET → 405',
  (await call({ method: 'GET', tok: token })).statusCode === 405,
);
check(
  'missing token → 401',
  (await call({ body: { planId: 'creator', billingCycle: 'monthly' } }))
    .statusCode === 401,
);
check(
  'invalid plan → 400',
  (
    await call({
      tok: token,
      body: { planId: 'free', billingCycle: 'monthly' },
    })
  ).statusCode === 400,
);
check(
  'invalid plan/billing combo → 400',
  (
    await call({
      tok: token,
      body: { planId: 'tester', billingCycle: 'monthly' },
    })
  ).statusCode === 400,
);

res = await call({
  tok: token,
  body: {
    planId: 'creator',
    billingCycle: 'annual',
    uid: 'attacker',
    priceCents: 1,
    status: 'active',
  },
});
e = await ent();
check(
  'plan change updates same doc; body cannot inject uid/price; activatedAt kept',
  res.statusCode === 200 &&
    e.billingCycle === 'annual' &&
    e.priceCents === 59000 &&
    JSON.stringify(e.activatedAt) === firstActivatedAt,
);

process.env.ENABLE_TEST_PHASE_PLANS = 'false';
check(
  'disabled test phase → 403',
  (
    await call({
      tok: token,
      body: { planId: 'creator', billingCycle: 'monthly' },
    })
  ).statusCode === 403,
);

process.stdout.write(failures ? `\n${failures} FAILURE(S)\n` : '\nALL PASS\n');
process.exit(failures ? 1 : 0);
