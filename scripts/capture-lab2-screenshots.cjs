/**
 * capture-lab2-screenshots.cjs
 * Genera las capturas de pantalla de IBM AMA / Transformation Advisor
 * para ilustrar el Lab 2 del workshop de modernización Java.
 *
 * Uso:
 *   node scripts/capture-lab2-screenshots.cjs
 *
 * Requisitos:
 *   - AMA corriendo en https://localhost
 *   - pedjasapp-collection.zip en la raíz del repositorio
 *   - npx playwright install chromium
 */

const { chromium } = require('playwright');
const path = require('path');
const fs   = require('fs');

// ─── Configuración ────────────────────────────────────────────────────────────
const AMA_URL   = 'https://localhost';
const WS_NAME   = 'Workshop_PedjasApp';
const ZIP_PATH  = path.resolve(__dirname, '..', 'pedjasapp-collection.zip');
const OUT_DIR   = path.resolve(__dirname, '..', 'docs', 'lab2', 'img');
const VIEWPORT  = { width: 1440, height: 900 };

function ensureDir(d) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }
async function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
async function dismissCookieBanner(page) {
  // 1. Intentar clic en "Accept All" si está visible
  try {
    const acceptBtn = page.locator('button:has-text("Accept All"), button:has-text("Accept Cookies"), button:has-text("Accept all")').first();
    if (await acceptBtn.isVisible({ timeout: 2000 })) {
      await acceptBtn.click();
      await wait(500);
    }
  } catch (_) {}

  // 2. Ocultar por CSS cualquier banner/footer de cookies que quede visible
  await page.evaluate(() => {
    const selectors = [
      // Carbon/IBM cookie consent patterns
      '[class*="cookie"]',
      '[id*="cookie"]',
      '[class*="consent"]',
      '[id*="consent"]',
      '[class*="privacy-banner"]',
      '[id*="privacy-banner"]',
      '[class*="truste"]',
      '[id*="truste"]',
      '.bx--modal-footer:not(.bx--btn-set)',  // evitar ocultar otros footers de modales útiles
      // Catch-all: elementos fijos en la parte inferior con texto "cookie"
      ...Array.from(document.querySelectorAll('div, footer, section'))
        .filter(el => {
          const style = window.getComputedStyle(el);
          const isFixed = style.position === 'fixed' || style.position === 'sticky';
          const text = el.textContent || '';
          return isFixed && (
            text.toLowerCase().includes('cookie') ||
            text.toLowerCase().includes('privacy') ||
            text.toLowerCase().includes('consent')
          );
        })
        .map(el => { el.style.display = 'none'; return null; })
        .filter(Boolean),
    ];
    selectors.forEach(sel => {
      if (typeof sel === 'string') {
        document.querySelectorAll(sel).forEach(el => { el.style.display = 'none'; });
      }
    });
  });
}

async function shot(page, name) {
  await dismissCookieBanner(page);
  const file = path.join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`  📸  ${name}.png`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  ensureDir(OUT_DIR);

  if (!fs.existsSync(ZIP_PATH)) {
    console.error(`\n❌  ZIP no encontrado: ${ZIP_PATH}\n`);
    process.exit(1);
  }

  console.log('\n🚀  Capturando pantallas de AMA para el Lab 2…\n');

  const browser = await chromium.launch({ headless: true });
  const ctx     = await browser.newContext({
    viewport: VIEWPORT,
    ignoreHTTPSErrors: true,
    acceptDownloads: true,
  });
  const page = await ctx.newPage();
  page.setDefaultNavigationTimeout(30_000);
  page.setDefaultTimeout(15_000);

  // ══════════════════════════════════════════════════════════════════════════
  // 01 — Home de AMA con lista de workspaces
  // ══════════════════════════════════════════════════════════════════════════
  console.log('01. Home AMA — lista de workspaces');
  await page.goto(AMA_URL, { waitUntil: 'networkidle' });
  await wait(800);
  await shot(page, '01-ama-home-workspaces');

  // ══════════════════════════════════════════════════════════════════════════
  // 02 — Diálogo "Create a new workspace" (sólo captura, sin crear)
  // ══════════════════════════════════════════════════════════════════════════
  console.log('02. Diálogo — crear nuevo workspace');
  const createWsBtn = page.locator('button:has-text("Create workspace")');
  await createWsBtn.waitFor({ state: 'visible' });
  await createWsBtn.click();
  await wait(600);
  // Captura con el diálogo abierto y el input vacío
  await shot(page, '02-create-workspace-dialog');

  // Rellenar con un nombre diferente para la captura — evita el error "ya existe"
  // que aparece si se escribe el nombre del workspace existente.
  const wsInput = page.locator('input[placeholder="Workspace name"]');
  await wsInput.fill('MiNuevoWorkspace');
  await wait(600);
  await shot(page, '03-create-workspace-name-filled');

  // Cerrar el modal via JS directo — más fiable que localizar el botón Cancel
  await page.evaluate(() => {
    // Quitar la clase is-visible del modal de workspace para cerrarlo
    document.querySelectorAll('.addWsModal, .cds--modal.is-visible, .bx--modal.is-visible')
      .forEach(el => {
        el.classList.remove('is-visible');
        el.style.display = 'none';
      });
    // Restaurar el scroll del body por si el modal lo bloqueó
    document.body.style.overflow = '';
    document.body.classList.remove('bx--body--with-modal-open', 'cds--body--with-modal-open');
  });
  await wait(600);

  // ══════════════════════════════════════════════════════════════════════════
  // 03 — Abrir el workspace Workshop_PedjasApp
  // ══════════════════════════════════════════════════════════════════════════
  console.log('03. Entrar al workspace Workshop_PedjasApp');
  // Hacer scroll hacia abajo para localizar la tarjeta del workspace
  await page.evaluate(() => window.scrollTo(0, 500));
  await wait(400);

  // Clic en la flecha → de la tarjeta Workshop_PedjasApp
  const wsCard = page.locator(`text="${WS_NAME}"`).first();
  await wsCard.waitFor({ state: 'visible' });
  // Buscar el botón → dentro de la misma fila
  const wsArrow = page.locator(`div:has(h3:has-text("${WS_NAME}")) button, 
    div:has(p:has-text("${WS_NAME}")) a[aria-label],
    [aria-label="Go to workspace ${WS_NAME}"],
    article:has-text("${WS_NAME}") a`).first();
  try {
    await wsArrow.click({ timeout: 4000 });
  } catch (_) {
    // Alternativa: clic directo sobre el texto del workspace
    await wsCard.click();
  }
  await page.waitForLoadState('networkidle');
  await wait(1000);
  await shot(page, '04-workspace-interior-empty');

  // ══════════════════════════════════════════════════════════════════════════
  // 04 — Navegar a Assessment para mostrar la tabla de aplicaciones
  // ══════════════════════════════════════════════════════════════════════════
  console.log('04. Pestaña Assessment — vista de tabla de aplicaciones');
  try {
    const assessTab = page.locator([
      '[role="tab"]:has-text("Assessment")',
      'a:has-text("Assessment")',
      'button:has-text("Assessment")',
    ].join(', ')).first();
    if (await assessTab.isVisible({ timeout: 4000 })) {
      await assessTab.click();
      await page.waitForLoadState('networkidle');
      await wait(1200);
    }
  } catch (_) {}
  await page.evaluate(() => window.scrollTo(0, 0));
  await wait(400);
  await shot(page, '08-recommendations-overview');

  // ══════════════════════════════════════════════════════════════════════════
  // 06 — Tabla de aplicaciones (scroll para ver detalles)
  // ══════════════════════════════════════════════════════════════════════════
  console.log('06. Tabla de aplicaciones analizadas');
  await page.evaluate(() => window.scrollTo(0, 350));
  await wait(600);
  await shot(page, '09-applications-table');

  // ══════════════════════════════════════════════════════════════════════════
  // 07 — Detalle de pedjasapp: scroll a la fila de la app con sus métricas
  // ══════════════════════════════════════════════════════════════════════════
  console.log('07. Detalle de pedjasapp.ear — fila con métricas');
  // Intentar navegar al detalle si existe enlace
  let inAppDetail = false;
  try {
    const appLink = page.locator([
      'a:has-text("pedjasapp")',
      'td:has-text("pedjasapp") a',
      'button:has-text("pedjasapp")',
    ].join(', ')).first();
    if (await appLink.isVisible({ timeout: 5000 })) {
      await appLink.click();
      await page.waitForLoadState('networkidle');
      await wait(1200);
      inAppDetail = true;
    }
  } catch (_) {}
  // Si no navegó, hacer scroll a la fila de la aplicación para que sea visible
  if (!inAppDetail) {
    await page.evaluate(() => window.scrollTo(0, 200));
    await wait(400);
  }
  await shot(page, '10-app-detail-pedjasapp');

  // ══════════════════════════════════════════════════════════════════════════
  // 08 — Lista de Issues / Rules: volver atrás si es necesario y hacer scroll
  // ══════════════════════════════════════════════════════════════════════════
  console.log('08. Lista de Issues / Rules');
  // Si estamos en el detalle de la app, volver a la vista de Assessment
  if (inAppDetail) {
    try {
      await page.goBack({ waitUntil: 'networkidle' });
      await wait(800);
    } catch (_) {}
  }
  // Intentar clic en pestaña Issues/Rules si existe
  try {
    const issuesTab = page.locator([
      '[role="tab"]:has-text("Issues")',
      '[role="tab"]:has-text("Rules")',
      'a:has-text("Issues")',
    ].join(', ')).first();
    if (await issuesTab.isVisible({ timeout: 3000 })) {
      await issuesTab.click();
      await wait(1000);
    }
  } catch (_) {}
  // Scroll hacia abajo para mostrar las reglas/issues (zona diferente al detalle de app)
  await page.evaluate(() => window.scrollTo(0, 500));
  await wait(600);
  await shot(page, '11-issues-rules-list');

  // ══════════════════════════════════════════════════════════════════════════
  // 09 — Expandir una regla crítica
  // ══════════════════════════════════════════════════════════════════════════
  console.log('09. Detalle de regla crítica');
  try {
    const firstIssueRow = page.locator([
      'tr[class*="critical"] td:first-child',
      'tr:has([data-severity="critical"]) td',
      '.bx--table-row:first-child td',
      'tbody tr:first-child',
    ].join(', ')).first();
    if (await firstIssueRow.isVisible({ timeout: 4000 })) {
      await firstIssueRow.click();
      await wait(1000);
      await shot(page, '12-rule-detail-expanded');
    }
  } catch (_) {}

  // ══════════════════════════════════════════════════════════════════════════
  // 10 — Vista Visualization
  // ══════════════════════════════════════════════════════════════════════════
  console.log('10. Vista Visualization');
  try {
    // Volver atrás si estamos en detalle de app
    const vizLink = page.locator([
      '[role="tab"]:has-text("Visualization")',
      'a:has-text("Visualization")',
      'button:has-text("Visualization")',
    ].join(', ')).first();
    if (!(await vizLink.isVisible({ timeout: 3000 }))) {
      await page.goBack({ waitUntil: 'networkidle' });
      await wait(800);
    }
    const vizTab = page.locator([
      '[role="tab"]:has-text("Visualization")',
      'a:has-text("Visualization")',
    ].join(', ')).first();
    if (await vizTab.isVisible({ timeout: 4000 })) {
      await vizTab.click();
      await page.waitForLoadState('networkidle');
      await wait(2000);
      await shot(page, '13-visualization');
    }
  } catch (e) {
    console.warn('  ⚠️  Visualization no disponible:', e.message);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 11 — Migration Plan
  // ══════════════════════════════════════════════════════════════════════════
  console.log('11. Migration Plan');
  try {
    const migBtn = page.locator([
      'a:has-text("Migration plan")',
      'button:has-text("Migration plan")',
      'a:has-text("View migration plan")',
      '[role="tab"]:has-text("Migration plan")',
    ].join(', ')).first();
    if (await migBtn.isVisible({ timeout: 4000 })) {
      await migBtn.click();
      await page.waitForLoadState('networkidle');
      await wait(1200);
      await shot(page, '14-migration-plan');
    }
  } catch (_) {}

  // ─────────────────────────────────────────────────────────────────────────
  await browser.close();

  const generated = fs.readdirSync(OUT_DIR).filter(f => f.endsWith('.png')).sort();
  console.log(`\n✅  ${generated.length} capturas en docs/lab2/img/:\n`);
  generated.forEach(f => console.log(`   • ${f}`));
  console.log('');
})();
