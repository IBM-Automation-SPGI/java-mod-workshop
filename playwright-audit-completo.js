/**
 * playwright-audit-completo.js  (delegador)
 * ─────────────────────────────────────────────────────────────────────────────
 * Punto de entrada de compatibilidad. Delega en los nuevos scripts modulares:
 *   scripts/check-docs.js  — Documentación MkDocs ES+EN
 *   scripts/check-app.js   — PedjasApp E2E + MicroProfile + AMA
 *
 * Uso equivalente al script anterior:
 *   node playwright-audit-completo.js
 *
 * También puedes usar los scripts directamente:
 *   node scripts/run-all.js              (ambos checks)
 *   node scripts/check-docs.js           (solo documentación)
 *   node scripts/check-app.js            (solo aplicación + AMA)
 *   node scripts/check-app.js --skip-ama (solo aplicación, sin AMA)
 *
 * O con npm:
 *   npm run check           (ambos)
 *   npm run check:docs      (solo docs)
 *   npm run check:app       (solo app)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { spawnSync } from 'child_process';

const skipAma = process.argv.includes('--skip-ama');
const appArgs = skipAma ? ['--skip-ama'] : [];

console.log('\n  → Delegando en scripts/run-all.js ...\n');
const result = spawnSync('node', ['scripts/run-all.js', ...appArgs], { stdio: 'inherit' });
process.exit(result.status ?? 1);
