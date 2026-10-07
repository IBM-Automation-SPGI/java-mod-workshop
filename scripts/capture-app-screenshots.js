/**
 * scripts/capture-app-screenshots.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Genera capturas de pantalla de la aplicación PedjasApp Liberty.
 * Las guarda en docs/lab4/img/ y docs/lab5/img/ para ilustrar los labs 4 y 5.
 *
 * Capturas generadas:
 *
 *   docs/lab4/img/
 *     01-login.png                   — Página de inicio de sesión
 *     02-catalogo-completo.png       — Catálogo con los 14 productos cargados
 *     03-catalogo-filtrado.png       — Catálogo filtrado por ELECTRONICA
 *     04-crear-pedido.png            — Confirmación de pedido creado
 *     05-lista-pedidos.png           — Lista de pedidos del usuario
 *     06-info-servidor.png           — Página de información del servidor Liberty
 *     07-metrics-dashboard.png       — Dashboard de métricas (KPIs y gráficas)
 *     08-logout.png                  — Pantalla post-logout (vuelta al login)
 *
 *   docs/lab5/img/
 *     01-health-endpoint.png         — GET /health → JSON con status UP
 *     02-health-live.png             — GET /health/live → Liveness UP
 *     03-health-ready.png            — GET /health/ready → Readiness UP
 *     04-metrics-prometheus.png      — GET /metrics → texto Prometheus
 *     05-openapi-ui.png              — GET /openapi/ui/ → Swagger UI
 *     06-api-productos.png           — GET /api/v1/productos → JSON array
 *
 * Uso:
 *   node scripts/capture-app-screenshots.js
 *
 * Requiere:
 *   • pedjasapp-liberty container corriendo en puerto 9081
 *   • pedjasapp-postgres container corriendo en puerto 5432
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { chromium } from 'playwright';
import path          from 'path';
import fs            from 'fs';

// ── Configuración ─────────────────────────────────────────────────────────────

const APP_BASE  = 'http://localhost:9081/pedjasapp';
const MP_BASE   = 'http://localhost:9081';
const OUT_LAB4  = path.resolve('docs/lab4/img');
const OUT_LAB5  = path.resolve('docs/lab5/img');
const VIEWPORT  = { width: 1400, height: 900 };

// ── Helpers ───────────────────────────────────────────────────────────────────

const captured = [];
const failed   = [];

async function shot(page, outDir, filename, options = {}) {
  const outPath = path.join(outDir, filename);
  try {
    if (options.waitSelector) {
      await page.waitForSelector(options.waitSelector, { timeout: options.timeout || 10000 }).catch(() => {});
    }
    if (options.waitTimeout) {
      await page.waitForTimeout(options.waitTimeout);
    }
    if (options.scrollTo) {
      await page.evaluate(selector => {
        const el = document.querySelector(selector);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, options.scrollTo).catch(() => {});
      await page.waitForTimeout(500);
    }
    await page.screenshot({
      path:     outPath,
      fullPage: options.fullPage ?? false,
      clip:     options.clip,
    });
    const size = Math.round(fs.statSync(outPath).size / 1024);
    console.log(`  📸  ${filename.padEnd(40)} → ${path.relative(process.cwd(), outDir).padEnd(12)} ${size} KB`);
    captured.push(filename);
  } catch (e) {
    console.error(`  ❌  ${filename} — ${e.message.slice(0, 100)}`);
    failed.push({ filename, error: e.message });
  }
}

// Shorthand para lab4 y lab5
const s4 = (page, name, opts) => shot(page, OUT_LAB4, name, opts);
const s5 = (page, name, opts) => shot(page, OUT_LAB5, name, opts);

// ── Capturas Lab 4 — Aplicación Liberty ───────────────────────────────────────

async function captureLabApp(page) {
  console.log('\n── Lab 4: Aplicación PedjasApp Liberty ──────────────────────────────');

  // 1. Login
  await page.goto(`${APP_BASE}/inicio`, { waitUntil: 'domcontentloaded', timeout: 12000 });
  await page.waitForTimeout(800);
  await s4(page, '01-login.png');

  // Autenticar
  await page.fill('#usuario',    'admin');
  await page.fill('#contrasena', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/catalogo|inicio/, { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(800);

  // 2. Catálogo completo (todos los productos)
  await page.goto(`${APP_BASE}/catalogo`, { waitUntil: 'domcontentloaded', timeout: 10000 });
  await page.waitForTimeout(600);
  await s4(page, '02-catalogo-completo.png');

  // 3. Catálogo filtrado por ELECTRONICA
  const selectEl = await page.$('select[name="categoria"]');
  if (selectEl) {
    await page.selectOption('select[name="categoria"]', 'ELECTRONICA');
    await page.click('button:has-text("Filtrar")');
    await page.waitForTimeout(800);
    await s4(page, '03-catalogo-filtrado.png');
  } else {
    // Copiar la captura del catálogo como sustituto
    fs.copyFileSync(
      path.join(OUT_LAB4, '02-catalogo-completo.png'),
      path.join(OUT_LAB4, '03-catalogo-filtrado.png')
    );
    console.log('  ⚠  Select categoría no encontrado — usando captura del catálogo completo como sustituto');
    captured.push('03-catalogo-filtrado.png (sustituto)');
  }

  // 4. Crear pedido — hacer clic en el primer botón "Realizar pedido"
  await page.goto(`${APP_BASE}/catalogo`, { waitUntil: 'domcontentloaded', timeout: 10000 });
  await page.waitForTimeout(600);
  const pedidoBtn = page.locator('button.btn-pedido').first();
  if (await pedidoBtn.count() > 0) {
    await pedidoBtn.click();
    await page.waitForURL(/pedidos|catalogo/, { timeout: 6000 }).catch(() => {});
    await page.waitForTimeout(1000);
    await s4(page, '04-crear-pedido.png');
  } else {
    await s4(page, '04-crear-pedido.png');
    console.log('  ⚠  Botón btn-pedido no encontrado — captura de pantalla actual guardada');
  }

  // 5. Lista de pedidos
  await page.goto(`${APP_BASE}/pedidos/lista`, { waitUntil: 'domcontentloaded', timeout: 10000 });
  await page.waitForTimeout(600);
  await s4(page, '05-lista-pedidos.png');

  // 6. Información del servidor
  await page.goto(`${APP_BASE}/info`, { waitUntil: 'domcontentloaded', timeout: 10000 });
  await page.waitForTimeout(600);
  await s4(page, '06-info-servidor.png');

  // 7. Dashboard de métricas
  await page.goto(`${APP_BASE}/metrics-dashboard`, { waitUntil: 'domcontentloaded', timeout: 10000 });
  await page.waitForTimeout(2000); // esperar auto-refresh inicial
  await s4(page, '07-metrics-dashboard.png');

  // 8. Logout → pantalla de login
  await page.goto(`${APP_BASE}/inicio?accion=logout`, { waitUntil: 'domcontentloaded', timeout: 8000 });
  await page.waitForTimeout(600);
  await s4(page, '08-logout.png');
}

// ── Capturas Lab 5 — MicroProfile Endpoints ──────────────────────────────────

async function captureLabMicroProfile(page) {
  console.log('\n── Lab 5: Endpoints MicroProfile ────────────────────────────────────');

  // 1. GET /health
  await page.goto(`${MP_BASE}/health`, { waitUntil: 'domcontentloaded', timeout: 10000 });
  await page.waitForTimeout(600);
  await s5(page, '01-health-endpoint.png');

  // 2. GET /health/live
  await page.goto(`${MP_BASE}/health/live`, { waitUntil: 'domcontentloaded', timeout: 10000 });
  await page.waitForTimeout(600);
  await s5(page, '02-health-live.png');

  // 3. GET /health/ready
  await page.goto(`${MP_BASE}/health/ready`, { waitUntil: 'domcontentloaded', timeout: 10000 });
  await page.waitForTimeout(600);
  await s5(page, '03-health-ready.png');

  // 4. GET /metrics (formato Prometheus — puede ser largo; mostrar sólo la parte superior)
  await page.goto(`${MP_BASE}/metrics`, { waitUntil: 'domcontentloaded', timeout: 10000 });
  await page.waitForTimeout(600);
  await s5(page, '04-metrics-prometheus.png', { clip: { x: 0, y: 0, width: 1400, height: 900 } });

  // 5. GET /openapi/ui/ — Swagger UI (esperar que cargue el JS)
  await page.goto(`${MP_BASE}/openapi/ui/`, { waitUntil: 'domcontentloaded', timeout: 12000 });
  await page.waitForTimeout(2500); // Swagger UI es JS-heavy
  await s5(page, '05-openapi-ui.png');

  // 6. GET /api/v1/productos — JSON array
  await page.goto(`${MP_BASE}/pedjasapp/api/v1/productos`, { waitUntil: 'domcontentloaded', timeout: 10000 });
  await page.waitForTimeout(600);
  await s5(page, '06-api-productos.png');
}

// ── Main ─────────────────────────────────────────────────────────────────────

(async () => {
  console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║   CAPTURE-APP-SCREENSHOTS — Capturas de la aplicación Liberty       ║');
  console.log('║   Lab 4 (8 capturas) + Lab 5 (6 capturas) → docs/lab4|5/img/        ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝');

  // Garantizar directorios de salida
  fs.mkdirSync(OUT_LAB4, { recursive: true });
  fs.mkdirSync(OUT_LAB5, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    args: ['--ignore-certificate-errors', '--no-sandbox', '--disable-dev-shm-usage'],
  });
  const ctx  = await browser.newContext({ ignoreHTTPSErrors: true, viewport: VIEWPORT });
  const page = await ctx.newPage();

  try {
    await captureLabApp(page);
    await captureLabMicroProfile(page);
  } finally {
    await browser.close();
  }

  // ── Resumen ──────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(72));
  console.log('  RESUMEN DE CAPTURAS — App Liberty');
  console.log('═'.repeat(72));
  console.log(`  ✅  Capturadas con éxito : ${captured.length}`);
  if (failed.length > 0) {
    console.log(`  ❌  Con error           : ${failed.length}`);
    failed.forEach(f => console.log(`       • ${f.filename}: ${f.error.slice(0, 80)}`));
  }
  console.log(`\n  Lab 4 → ${OUT_LAB4}`);
  console.log(`  Lab 5 → ${OUT_LAB5}`);
  console.log('═'.repeat(72) + '\n');
  process.exit(failed.length > 0 ? 1 : 0);
})();
