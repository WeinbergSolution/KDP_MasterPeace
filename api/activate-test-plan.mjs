import admin from 'firebase-admin';
import { evaluateActivation } from './_lib/validate-activation.mjs';

// Protected serverless endpoint (Vercel) for the test phase. It verifies the
// Firebase ID token, requires a verified e-mail, validates the plan/billing
// combination and — only when ENABLE_TEST_PHASE_PLANS === 'true' — writes an
// entitlement via the Admin SDK (which bypasses the "client cannot write"
// Firestore rule). It never trusts the request body for uid, e-mail
// verification, prices or limits, and never logs tokens or secrets.

/** Initialises the Admin SDK once (emulator locally, service account in prod). */
function initAdmin() {
  if (admin.apps.length) return;
  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID ??
    process.env.GCLOUD_PROJECT ??
    'demo-kdp-masterpeace';
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    admin.initializeApp({ projectId });
    return;
  }
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_ADMIN_PRIVATE_KEY ?? '').replace(
        /\\n/g,
        '\n',
      ),
    }),
  });
}

/**
 * Reads the bearer ID token from the Authorization header.
 *
 * @param {object} req The request.
 * @returns {string} The token, or an empty string.
 */
function bearer(req) {
  const header = req.headers?.authorization ?? '';
  return header.startsWith('Bearer ') ? header.slice(7).trim() : '';
}

/**
 * Reads the parsed JSON body (Vercel parses it; fall back to a raw read).
 *
 * @param {object} req The request.
 * @returns {Promise<Record<string, unknown>>} The body object.
 */
async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return {};
  }
}

/**
 * Writes/updates the entitlement, preserving activatedAt on a plan change.
 *
 * @param {string} uid The verified user id.
 * @param {object} activation The server-resolved activation values.
 */
async function writeEntitlement(uid, activation) {
  const db = admin.firestore();
  const ref = db.doc(`entitlements/${uid}`);
  const now = admin.firestore.FieldValue.serverTimestamp();
  const existing = await ref.get();
  await ref.set(
    {
      status: 'active',
      planId: activation.planId,
      billingCycle: activation.billingCycle,
      source: 'test_phase',
      testMode: true,
      priceCents: activation.priceCents,
      bookLimit: activation.bookLimit,
      activatedAt: existing.get('activatedAt') ?? now,
      updatedAt: now,
    },
    { merge: true },
  );
}

/**
 * Vercel serverless handler for POST /api/activate-test-plan.
 *
 * @param {object} req The request.
 * @param {object} res The response.
 */
export default async function handler(req, res) {
  initAdmin();
  const token = bearer(req);
  let decoded = null;
  if (token) {
    try {
      decoded = await admin.auth().verifyIdToken(token);
    } catch {
      decoded = null;
    }
  }
  const body = await readBody(req);
  const result = evaluateActivation({
    method: req.method,
    authenticated: !!decoded,
    emailVerified: decoded?.email_verified === true,
    testPhaseEnabled: process.env.ENABLE_TEST_PHASE_PLANS === 'true',
    planId: body.planId,
    billingCycle: body.billingCycle,
  });
  if ('error' in result)
    return res.status(result.error.code).json({ error: result.error.message });
  await writeEntitlement(decoded.uid, result.activation);
  return res.status(200).json({
    ok: true,
    planId: result.activation.planId,
    billingCycle: result.activation.billingCycle,
  });
}
