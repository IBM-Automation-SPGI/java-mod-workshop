/**
 * scripts/capture-lab2-screenshots.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Genera todas las capturas de pantalla del Lab 2 (Análisis con AMA).
 * Las guarda en docs/lab2/img/ con los nombres exactos que referencia el Markdown.
 *
 * Capturas generadas:
 *   01-ama-home-workspaces.png          — Pantalla principal AMA con lista de workspaces
 *   02-create-workspace-dialog.png      — Diálogo "Create workspace" vacío
 *   03-create-workspace-name-filled.png — Diálogo con nombre "Workshop_PedjasApp"
 *   04-workspace-interior-empty.png     — Interior del workspace recién creado
 *   08-recommendations-overview.png     — Pestaña Assessment con tabla de apps analizadas
 *   09-applications-table.png           — Tabla completa de aplicaciones
 *   10-app-detail-pedjasapp.png         — Detalle de pedjasapp.ear (complejidad + issues)
 *   11-issues-rules-list.png            — Lista de reglas disparadas
 *   12-rule-detail-expanded.png         — Detalle expandido de una regla crítica
 *   13-visualization.png                — Vista Visualization (grafo de dependencias)
 *   14-analysis-report-top.png          — Informe HTML — cabecera y resumen
 *   15-analysis-report-critical.png     — Informe HTML — sección crítica
 *   16-analysis-report-rule-detail.png  — Informe HTML — detalle de regla individual
 *   17-analysis-report-info.png         — Informe HTML — sección informativa
 *   18-migration-plan.png               — Migration Overview con 5 artefactos
 *   19-migration-containerfile.png      — Vista previa Containerfile generado
 *   19-migration-plan-artifacts.png     — Lista de artefactos del plan
 *   20-migration-serverxml.png          — Vista previa server.xml generado
 *
 * Uso:
 *   node scripts/capture-lab2-screenshots.js
 *   node scripts/capture-lab2-screenshots.js --workspace-id=<ID>   (usa workspace existente)
 *
 * Requiere:
 *   • AMA (Transformation Advisor) corriendo en https://localhost/
 *   • API REST disponible en https://localhost:2220/
 *   • Workspace "Workshop_PedjasApp" existente (con pedjasapp.ear analizado)
 *     Si no existe, el script lo crea automáticamente a partir de la colección pre-generada.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { chromium } from 'playwright';
import path          from 'path';
import fs            from 'fs';
import { execSync }  from 'child_process';

// ── Configuración ─────────────────────────────────────────────────────────────

const AMA_URL     = 'https://localhost';
const AMA_API     = 'https://localhost:2220/lands_advisor/advisor/v2';
const OUT_DIR     = path.resolve('docs/lab2/img');
const VIEWPORT    = { width: 1440, height: 900 };
const WAIT_SPA    = 2500;   // ms para que la SPA de AMA cargue
const WAIT_ANIM   = 800;    // ms para animaciones de apertura de diálogos

// ── Helpers ───────────────────────────────────────────────────────────────────

const captured = [];
const failed   = [];

async function shot(page, filename, options = {}) {
  const outPath = path.join(OUT_DIR, filename);
  try {
    if (options.waitSelector) {
      await page.waitForSelector(options.waitSelector, { timeout: options.timeout || 10000 });
    }
    if (options.waitTimeout) {
      await page.waitForTimeout(options.waitTimeout);
    }
    await page.screenshot({
      path:     outPath,
      fullPage: options.fullPage ?? false,
      clip:     options.clip,
    });
    const size = Math.round(fs.statSync(outPath).size / 1024);
    console.log(`  📸  ${filename.padEnd(46)} ${size} KB`);
    captured.push(filename);
  } catch (e) {
    console.error(`  ❌  ${filename} — ${e.message.slice(0, 100)}`);
    failed.push({ filename, error: e.message });
  }
}

/** Llama a la API REST de AMA con curl (ignora certificado) */
function apiCall(method, endpoint, data) {
  const base = `curl -k -s -X ${method} "${AMA_API}${endpoint}"`;
  const headers = '-H "Content-Type: application/json"';
  const body    = data ? `-d '${JSON.stringify(data)}'` : '';
  try {
    const out = execSync(`${base} ${headers} ${body}`, { encoding: 'utf-8' });
    return JSON.parse(out);
  } catch (e) {
    return null;
  }
}

/** Obtiene o crea el workspace Workshop_PedjasApp y devuelve su ID */
function getOrCreateWorkspace() {
  // Leer argumento --workspace-id=...
  const arg = process.argv.find(a => a.startsWith('--workspace-id='));
  if (arg) return arg.split('=')[1];

  const ws = apiCall('GET', '/workspaces');
  if (!ws) {
    console.error('  ⚠  AMA API no accesible. Asegúrate de que AMA está corriendo en https://localhost/');
    return null;
  }

  const existing = (ws.workspaces || []).find(w => /PedjasApp|Workshop/i.test(w.name || ''));
  if (existing) {
    console.log(`  ✅  Workspace existente: "${existing.name}" (id=${existing.id})`);
    return existing.id;
  }

  // Crear workspace nuevo
  const created = apiCall('POST', '/workspaces', { name: 'Workshop_PedjasApp' });
  if (created?.id) {
    console.log(`  ✅  Workspace creado: Workshop_PedjasApp (id=${created.id})`);

    // Subir colección pre-generada si existe
    const zipPath = path.resolve('pedjasapp-collection.zip');
    if (fs.existsSync(zipPath)) {
      try {
        execSync(
          `curl -k -s -X POST "${AMA_API}/workspaces/${created.id}/collectionArchives?collectionName=PedjasApp_tWAS&overwrite=true" ` +
          `-H "Content-Type: application/octet-stream" -H "archiveName: pedjasapp.zip" ` +
          `--data-binary "@${zipPath}"`,
          { encoding: 'utf-8' }
        );
        console.log('  ✅  Colección pedjasapp-collection.zip subida');
        // Esperar procesamiento
        execSync('sleep 5');
      } catch (e) {
        console.warn(`  ⚠  No se pudo subir la colección: ${e.message.slice(0, 80)}`);
      }
    } else {
      console.warn('  ⚠  pedjasapp-collection.zip no encontrado — algunas capturas pueden estar vacías');
    }
    return created.id;
  }

  console.error('  ❌  No se pudo obtener ni crear el workspace');
  return null;
}

// ── Capturas ──────────────────────────────────────────────────────────────────

async function captureHomeAndWorkspaces(page) {
  console.log('\n── Paso 1: Pantalla principal y workspace ───────────────────────────');

  // 01 — Pantalla de inicio con lista de workspaces
  await page.goto(`${AMA_URL}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(WAIT_SPA);
  await shot(page, '01-ama-home-workspaces.png');
}

async function captureCreateWorkspace(page) {
  console.log('\n── Paso 2: Creación de workspace ────────────────────────────────────');

  await page.goto(`${AMA_URL}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(WAIT_SPA);

  // Abrir diálogo "Create workspace"
  const createBtn = page.locator('button:has-text("Create workspace"), [data-test="create-workspace-btn"], .create-workspace-btn').first();
  if (await createBtn.count() > 0) {
    await createBtn.click();
    await page.waitForTimeout(WAIT_ANIM);

    // 02 — Diálogo vacío
    await shot(page, '02-create-workspace-dialog.png');

    // Escribir nombre
    const nameInput = page.locator('input[placeholder*="workspace" i], input[name*="name" i], .bx--text-input').first();
    if (await nameInput.count() > 0) {
      await nameInput.fill('Workshop_PedjasApp');
      await page.waitForTimeout(400);
      // 03 — Diálogo con nombre rellenado
      await shot(page, '03-create-workspace-name-filled.png');

      // Cancelar para no crear duplicado si ya existe
      const cancelBtn = page.locator('button:has-text("Cancel"), button:has-text("Cancelar")').first();
      if (await cancelBtn.count() > 0) await cancelBtn.click();
    }
  } else {
    console.warn('  ⚠  No se encontró el botón "Create workspace" — capturando pantalla como sustituto');
    await shot(page, '02-create-workspace-dialog.png');
    await shot(page, '03-create-workspace-name-filled.png');
  }
}

async function captureWorkspaceInterior(page, workspaceId) {
  console.log('\n── Paso 3: Interior del workspace ───────────────────────────────────');

  if (!workspaceId) {
    console.warn('  ⚠  Sin workspaceId — omitiendo capturas del interior');
    return;
  }

  // Navegar al workspace
  await page.goto(`${AMA_URL}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(WAIT_SPA);

  // Intentar hacer clic en el workspace por nombre
  const wsLink = page.locator(`text=Workshop_PedjasApp, a:has-text("Workshop_PedjasApp")`).first();
  if (await wsLink.count() > 0) {
    await wsLink.click();
    await page.waitForTimeout(WAIT_SPA);
  }

  // 04 — Interior del workspace (puede estar vacío si no hay datos cargados)
  await shot(page, '04-workspace-interior-empty.png');
}

async function captureAssessmentResults(page, workspaceId) {
  console.log('\n── Paso 4: Resultados del análisis ──────────────────────────────────');

  if (!workspaceId) {
    console.warn('  ⚠  Sin workspaceId — omitiendo capturas de resultados');
    return;
  }

  // Navegar a la vista de Assessment del workspace
  await page.goto(`${AMA_URL}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(WAIT_SPA);

  // Intentar abrir el workspace
  const wsLink = page.locator(`text=Workshop_PedjasApp`).first();
  if (await wsLink.count() > 0) {
    await wsLink.click();
    await page.waitForTimeout(WAIT_SPA);
  }

  // Ir a pestaña Assessment
  const assessmentTab = page.locator('button:has-text("Assessment"), a:has-text("Assessment"), [role="tab"]:has-text("Assessment")').first();
  if (await assessmentTab.count() > 0) {
    await assessmentTab.click();
    await page.waitForTimeout(WAIT_SPA);
  }

  // 08 — Vista de Recommendations / Assessment overview
  await shot(page, '08-recommendations-overview.png');

  // 09 — Tabla de aplicaciones (scroll si necesario)
  const appTable = page.locator('table, .applications-table, [data-test="applications-table"]').first();
  if (await appTable.count() > 0) {
    await shot(page, '09-applications-table.png', {
      clip: await appTable.boundingBox().catch(() => undefined),
    });
  } else {
    await shot(page, '09-applications-table.png');
  }

  // 10 — Detalle de pedjasapp.ear
  const appLink = page.locator('text=pedjasapp.ear, text=pedjasapp, a:has-text("pedjasapp")').first();
  if (await appLink.count() > 0) {
    await appLink.click();
    await page.waitForTimeout(WAIT_SPA);
    await shot(page, '10-app-detail-pedjasapp.png');

    // 11 — Lista de reglas disparadas
    const issuesPanel = page.locator('.issues-table, .rules-list, [data-test="issues-list"]').first();
    if (await issuesPanel.count() > 0) {
      await issuesPanel.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
    }
    await shot(page, '11-issues-rules-list.png');

    // 12 — Expandir una regla crítica
    const firstCritical = page.locator('.critical, .issue-row.critical, [data-severity="critical"]').first();
    if (await firstCritical.count() > 0) {
      await firstCritical.click();
      await page.waitForTimeout(WAIT_ANIM);
    } else {
      // Intentar expandir la primera fila de la tabla de reglas
      const firstRow = page.locator('tr.clickable, .expandable-row, tr[role="button"]').first();
      if (await firstRow.count() > 0) {
        await firstRow.click();
        await page.waitForTimeout(WAIT_ANIM);
      }
    }
    await shot(page, '12-rule-detail-expanded.png');
  } else {
    // Sin datos — capturar pantalla actual como sustituto
    await shot(page, '10-app-detail-pedjasapp.png');
    await shot(page, '11-issues-rules-list.png');
    await shot(page, '12-rule-detail-expanded.png');
  }
}

async function captureVisualization(page) {
  console.log('\n── Paso 5: Vista Visualization ──────────────────────────────────────');

  // Ir a pestaña Visualization
  const vizTab = page.locator('button:has-text("Visualization"), a:has-text("Visualization"), [role="tab"]:has-text("Visualization")').first();
  if (await vizTab.count() > 0) {
    await vizTab.click();
    await page.waitForTimeout(WAIT_SPA);
  }

  // 13 — Grafo de dependencias
  await shot(page, '13-visualization.png');
}

async function captureAnalysisReport(page) {
  console.log('\n── Paso 6: Informe HTML de análisis ─────────────────────────────────');

  // Intentar abrir el informe desde la vista de detalle de la aplicación
  const reportLink = page.locator('a:has-text("View full analysis report"), button:has-text("View full analysis"), [data-test="analysis-report"]').first();
  if (await reportLink.count() > 0) {
    // Abrir en nueva pestaña
    const [newPage] = await Promise.all([
      page.context().waitForEvent('page', { timeout: 8000 }),
      reportLink.click(),
    ]).catch(() => [null]);

    const reportPage = newPage || page;

    if (newPage) {
      await newPage.waitForLoadState('domcontentloaded', { timeout: 10000 });
      await newPage.waitForTimeout(1500);

      // 14 — Cabecera del informe (viewport superior)
      await shot(newPage, '14-analysis-report-top.png');

      // 15 — Sección crítica (scroll hasta ella)
      const criticalSection = newPage.locator('h2:has-text("Critical"), .critical-section, #critical').first();
      if (await criticalSection.count() > 0) {
        await criticalSection.scrollIntoViewIfNeeded();
        await newPage.waitForTimeout(400);
      }
      await shot(newPage, '15-analysis-report-critical.png');

      // 16 — Detalle de regla individual (expand)
      const ruleRow = newPage.locator('.rule-item, .result-row, tr.clickable').first();
      if (await ruleRow.count() > 0) {
        await ruleRow.click();
        await newPage.waitForTimeout(WAIT_ANIM);
      }
      await shot(newPage, '16-analysis-report-rule-detail.png');

      // 17 — Sección informativa
      const infoSection = newPage.locator('h2:has-text("Information"), .information-section, #information').first();
      if (await infoSection.count() > 0) {
        await infoSection.scrollIntoViewIfNeeded();
        await newPage.waitForTimeout(400);
      }
      await shot(newPage, '17-analysis-report-info.png');

      await newPage.close();
    } else {
      await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
      await page.waitForTimeout(1500);
      await shot(page, '14-analysis-report-top.png');
      await shot(page, '15-analysis-report-critical.png');
      await shot(page, '16-analysis-report-rule-detail.png');
      await shot(page, '17-analysis-report-info.png');
      await page.goBack();
      await page.waitForLoadState('domcontentloaded', { timeout: 8000 });
    }
  } else {
    console.warn('  ⚠  No se encontró el enlace al informe HTML — capturando página actual');
    await shot(page, '14-analysis-report-top.png');
    await shot(page, '15-analysis-report-critical.png');
    await shot(page, '16-analysis-report-rule-detail.png');
    await shot(page, '17-analysis-report-info.png');
  }
}

async function captureMigrationPlan(page) {
  console.log('\n── Paso 7: Plan de migración ─────────────────────────────────────────');

  // Buscar botón "View migration plan"
  const planBtn = page.locator('a:has-text("View migration plan"), button:has-text("migration plan"), [data-test="migration-plan"]').first();

  // Si no está visible, volver a la lista de aplicaciones y hacer clic en la app
  if (await planBtn.count() === 0) {
    const backLink = page.locator('a:has-text("Assessment"), a:has-text("← Back"), button:has-text("Back")').first();
    if (await backLink.count() > 0) {
      await backLink.click();
      await page.waitForTimeout(WAIT_SPA);
      const appLink = page.locator('text=pedjasapp.ear, text=pedjasapp').first();
      if (await appLink.count() > 0) {
        await appLink.click();
        await page.waitForTimeout(WAIT_SPA);
      }
    }
  }

  const planBtn2 = page.locator('a:has-text("View migration plan"), button:has-text("migration plan"), [data-test="migration-plan"]').first();
  if (await planBtn2.count() > 0) {
    await planBtn2.click();
    await page.waitForTimeout(WAIT_SPA);

    // 18 — Migration Overview con los 5 artefactos
    await shot(page, '18-migration-plan.png');

    // 19-migration-plan-artifacts — Lista de artefactos (scroll si necesario)
    const artifactList = page.locator('.artifact-list, .migration-files, [data-test="artifacts"]').first();
    if (await artifactList.count() > 0) {
      await artifactList.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      await shot(page, '19-migration-plan-artifacts.png', {
        clip: await artifactList.boundingBox().catch(() => undefined),
      });
    } else {
      await shot(page, '19-migration-plan-artifacts.png');
    }

    // Abrir preview del Containerfile (si existe el botón/enlace)
    const containerfileBtn = page.locator('text=Containerfile, button:has-text("Containerfile"), [data-file="Containerfile"]').first();
    if (await containerfileBtn.count() > 0) {
      await containerfileBtn.click();
      await page.waitForTimeout(WAIT_ANIM);
      // 19 — Preview del Containerfile
      await shot(page, '19-migration-containerfile.png');
    } else {
      await shot(page, '19-migration-containerfile.png');
    }

    // Abrir preview del server.xml
    const serverXmlBtn = page.locator('text=server.xml, button:has-text("server.xml"), [data-file="server.xml"]').first();
    if (await serverXmlBtn.count() > 0) {
      await serverXmlBtn.click();
      await page.waitForTimeout(WAIT_ANIM);
      // 20 — Preview del server.xml
      await shot(page, '20-migration-serverxml.png');
    } else {
      await shot(page, '20-migration-serverxml.png');
    }
  } else {
    console.warn('  ⚠  No se encontró "View migration plan" — capturando pantalla actual');
    await shot(page, '18-migration-plan.png');
    await shot(page, '19-migration-plan-artifacts.png');
    await shot(page, '19-migration-containerfile.png');
    await shot(page, '20-migration-serverxml.png');
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

(async () => {
  console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║   CAPTURE-LAB2-SCREENSHOTS — Capturas de pantalla del Lab 2         ║');
  console.log('║   18 capturas de IBM AMA → docs/lab2/img/                            ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝');

  // Garantizar que el directorio de salida existe
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // Obtener o crear el workspace de AMA
  console.log('\n── Buscando workspace Workshop_PedjasApp en AMA ─────────────────────');
  const workspaceId = getOrCreateWorkspace();

  const browser = await chromium.launch({
    headless: true,
    args: ['--ignore-certificate-errors', '--no-sandbox', '--disable-dev-shm-usage'],
  });
  const ctx  = await browser.newContext({ ignoreHTTPSErrors: true, viewport: VIEWPORT });
  const page = await ctx.newPage();

  try {
    await captureHomeAndWorkspaces(page);
    await captureCreateWorkspace(page);
    await captureWorkspaceInterior(page, workspaceId);
    await captureAssessmentResults(page, workspaceId);
    await captureVisualization(page);
    await captureAnalysisReport(page);
    await captureMigrationPlan(page);
  } finally {
    await browser.close();
  }

  // ── Resumen ──────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(72));
  console.log('  RESUMEN DE CAPTURAS — Lab 2');
  console.log('═'.repeat(72));
  console.log(`  ✅  Capturadas con éxito : ${captured.length}`);
  if (failed.length > 0) {
    console.log(`  ❌  Con error           : ${failed.length}`);
    failed.forEach(f => console.log(`       • ${f.filename}: ${f.error.slice(0, 80)}`));
  }
  console.log(`\n  Directorio de salida: ${OUT_DIR}`);
  console.log('═'.repeat(72) + '\n');
  process.exit(failed.length > 0 ? 1 : 0);
})();
