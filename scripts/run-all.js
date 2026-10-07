/**
 * scripts/run-all.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Runner principal — ejecuta todos los scripts de comprobación del workshop
 * en el orden correcto y produce un resumen consolidado.
 *
 * Scripts ejecutados (en orden):
 *   1. check-docs.js   — Documentación MkDocs ES+EN (requiere MkDocs en :8001)
 *   2. check-app.js    — PedjasApp E2E + MicroProfile + AMA (requiere Liberty :9081)
 *
 * Uso:
 *   node scripts/run-all.js                    # Ejecuta todos
 *   node scripts/run-all.js --skip-docs        # Omite auditoría de documentación
 *   node scripts/run-all.js --skip-app         # Omite auditoría de la aplicación
 *   node scripts/run-all.js --skip-ama         # Pasa --skip-ama a check-app.js
 *   node scripts/run-all.js --only-docs        # Solo documentación
 *   node scripts/run-all.js --only-app         # Solo aplicación
 *
 * Prerrequisitos:
 *   • MkDocs: mkdocs serve --dev-addr=127.0.0.1:8001
 *   • Liberty: podman start pedjasapp-liberty  (puerto 9081)
 *   • Postgres: podman start pedjasapp-postgres (puerto 5432)
 *   • AMA (opcional): https://localhost/ (pasa --skip-ama si no está activo)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { execSync, spawnSync } from 'child_process';
import path                    from 'path';

const ARGS     = process.argv.slice(2);
const SKIP_DOCS = ARGS.includes('--skip-docs');
const SKIP_APP  = ARGS.includes('--skip-app');
const ONLY_DOCS = ARGS.includes('--only-docs');
const ONLY_APP  = ARGS.includes('--only-app');
const SKIP_AMA  = ARGS.includes('--skip-ama');

const RUN_DOCS = !SKIP_DOCS && !ONLY_APP;
const RUN_APP  = !SKIP_APP  && !ONLY_DOCS;

// ── Helpers ───────────────────────────────────────────────────────────────────

function banner(text) {
  console.log('\n' + '╔' + '═'.repeat(70) + '╗');
  console.log('║  ' + text.padEnd(68) + '║');
  console.log('╚' + '═'.repeat(70) + '╝');
}

function divider(text) {
  console.log('\n' + '┌' + '─'.repeat(70) + '┐');
  console.log('│  ' + text.padEnd(68) + '│');
  console.log('└' + '─'.repeat(70) + '┘');
}

/** Comprueba si un servicio responde con un HEAD rápido */
function isUp(url) {
  try {
    execSync(`curl -sk --max-time 3 --head "${url}" > /dev/null 2>&1`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/** Ejecuta un script Node y devuelve su código de salida */
function runScript(scriptPath, extraArgs = []) {
  const result = spawnSync('node', [scriptPath, ...extraArgs], {
    stdio: 'inherit',
    cwd: path.resolve('.'),
  });
  return result.status ?? 1;
}

// ── Comprobaciones previas de servicios ───────────────────────────────────────

function preflightCheck() {
  divider('🔍  PREFLIGHT — Verificando servicios disponibles');
  const checks = [
    { label: 'MkDocs      http://127.0.0.1:8001', url: 'http://127.0.0.1:8001', needed: RUN_DOCS },
    { label: 'Liberty     http://localhost:9081',  url: 'http://localhost:9081', needed: RUN_APP  },
    { label: 'AMA GUI     https://localhost',      url: 'https://localhost',     needed: RUN_APP && !SKIP_AMA },
  ];

  const results = [];
  for (const c of checks) {
    if (!c.needed) { console.log(`  ⏭  ${c.label}  (omitido)`); continue; }
    const up = isUp(c.url);
    console.log(`  ${up ? '✅' : '❌'}  ${c.label}  ${up ? 'OK' : '⚠ NO DISPONIBLE'}`);
    results.push({ ...c, up });
  }

  // Advertir si un servicio requerido no está disponible (no bloquear — el script lo reportará)
  const down = results.filter(r => r.needed && !r.up);
  if (down.length > 0) {
    console.log('\n  ⚠  Servicios no disponibles:');
    down.forEach(d => console.log(`     • ${d.label}`));
    if (down.some(d => d.url.includes('8001') && RUN_DOCS)) {
      console.log('\n  💡  Para arrancar MkDocs:');
      console.log('       mkdocs serve --dev-addr=127.0.0.1:8001');
    }
    if (down.some(d => d.url.includes('9081') && RUN_APP)) {
      console.log('\n  💡  Para arrancar Liberty:');
      console.log('       podman start pedjasapp-liberty pedjasapp-postgres');
    }
  }
  return results;
}

// ── Main ─────────────────────────────────────────────────────────────────────

(async () => {
  banner('RUN-ALL — Workshop Java Modernization — Suite de comprobaciones');
  console.log(`\n  Opciones activas: ${[
    RUN_DOCS ? '📚 docs' : null,
    RUN_APP  ? '🛒 app'  : null,
    SKIP_AMA ? '⏭ skip-ama' : null,
  ].filter(Boolean).join('  ')}`);

  preflightCheck();

  const exitCodes = {};
  const start = Date.now();

  // ── 1. Documentación ──────────────────────────────────────────────────────
  if (RUN_DOCS) {
    divider('📚  check-docs.js — Documentación MkDocs ES+EN');
    exitCodes.docs = runScript('scripts/check-docs.js');
  }

  // ── 2. Aplicación + MicroProfile + AMA ───────────────────────────────────
  if (RUN_APP) {
    divider('🛒  check-app.js — PedjasApp E2E + MicroProfile + AMA');
    const appArgs = SKIP_AMA ? ['--skip-ama'] : [];
    exitCodes.app = runScript('scripts/check-app.js', appArgs);
  }

  // ── Resumen consolidado ───────────────────────────────────────────────────
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  const allPassed = Object.values(exitCodes).every(c => c === 0);

  console.log('\n' + '═'.repeat(72));
  console.log('  RESUMEN CONSOLIDADO');
  console.log('═'.repeat(72));
  if (exitCodes.docs !== undefined)
    console.log(`  ${exitCodes.docs === 0 ? '✅' : '❌'}  check-docs.js    (exit ${exitCodes.docs})`);
  if (exitCodes.app !== undefined)
    console.log(`  ${exitCodes.app  === 0 ? '✅' : '❌'}  check-app.js     (exit ${exitCodes.app})`);
  console.log(`\n  Tiempo total: ${elapsed}s`);
  console.log('\n' + (allPassed
    ? '  🎉  TODAS LAS SUITES PASARON — Workshop verificado al 100%'
    : '  ⚠️   ALGUNAS SUITES FALLARON — revisa los detalles arriba'));
  console.log('═'.repeat(72) + '\n');

  process.exit(allPassed ? 0 : 1);
})();
