// Tests for the runtime env.js renderer (node --test). Covers full config,
// missing config, admin-secret exclusion, and safe escaping.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  FIREBASE_PUBLIC_KEYS,
  missingKeys,
  renderEnvJs,
} from './render-env-js.mjs';

/**
 * Parses the object literal out of an env.js source string.
 *
 * @param source The env.js JavaScript source.
 * @returns The parsed window.__env object.
 */
function parseEnvJs(source) {
  return JSON.parse(source.replace('window.__env = ', '').replace(/;\s*$/, ''));
}

test('full config renders all six public keys', () => {
  const env = Object.fromEntries(
    FIREBASE_PUBLIC_KEYS.map((k, i) => [k, `v${i}`]),
  );
  const obj = parseEnvJs(renderEnvJs(env));
  for (const key of FIREBASE_PUBLIC_KEYS) assert.equal(obj[key], env[key]);
  assert.equal(missingKeys(env).length, 0);
});

test('missing config yields empty strings and reports all missing', () => {
  const obj = parseEnvJs(renderEnvJs({}));
  assert.equal(obj.FIREBASE_API_KEY, '');
  assert.equal(missingKeys({}).length, 6);
});

test('never emits admin secrets into the client file', () => {
  const env = {
    FIREBASE_ADMIN_PRIVATE_KEY: 'TOP_SECRET_KEY',
    FIREBASE_ADMIN_CLIENT_EMAIL: 'admin@example.com',
    FIREBASE_API_KEY: 'public-ok',
  };
  const source = renderEnvJs(env);
  assert.ok(!source.includes('TOP_SECRET_KEY'));
  assert.ok(!source.includes('ADMIN'));
  assert.ok(source.includes('"FIREBASE_API_KEY":"public-ok"'));
});

test('escapes values safely for JavaScript', () => {
  const obj = parseEnvJs(renderEnvJs({ FIREBASE_API_KEY: 'a"b\\c\n</x>' }));
  assert.equal(obj.FIREBASE_API_KEY, 'a"b\\c\n</x>');
});
