// Local dev host for the Vercel serverless function, so the browser can reach
// /api/activate-test-plan while the Angular dev server proxies /api here. Point
// the Admin SDK at the emulators via env before running:
//   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
//   ENABLE_TEST_PHASE_PLANS=true FIREBASE_ADMIN_PROJECT_ID=demo-kdp-masterpeace
//   node tools/dev/api-server.mjs

import { createServer } from 'node:http';
import handler from '../../api/activate-test-plan.mjs';

const PORT = Number(process.env.API_PORT ?? 3900);

createServer((req, res) => {
  if (!req.url?.startsWith('/api/activate-test-plan')) {
    res.statusCode = 404;
    res.end('not found');
    return;
  }
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (obj) => {
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(obj));
    return res;
  };
  handler(req, res).catch(() => {
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ error: 'Serverfehler.' }));
  });
}).listen(PORT, () => process.stdout.write(`api-server on ${PORT}\n`));
