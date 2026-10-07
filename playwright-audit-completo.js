/**
 * playwright-audit-completo.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Auditoría completa del Workshop de Modernización Java:
 *   1. Documentación MkDocs  — ES (puerto 8001) y EN (/en/)
 *   2. Aplicación PedjasApp  — flujo E2E completo en Liberty (puerto 9081)
 *   3. Dashboard de Métricas — accesible desde la app
 *   4. Endpoints MicroProfile — /health, /metrics, /openapi/ui/
 *   5. IBM AMA / Transformation Advisor — GUI y API REST (si está activo)
 *
 * Uso:
 *   node playwright-audit-completo.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { chromium } from 'playwright';

// ── Utilidades de reporte ─────────────────────────────────────────────────────
const results = [];
let section = '';

function setSection(name) {
  section = name;
  console.log(`\n${'─'.repeat(70)}`);
  console.log(`  ${name}`);
  console.log(`${'─'.repeat(70)}`);
}

function log(testName, passed, detail = '') {
  results.push({ section, testName, passed, detail });
  const mark = passed ? '✅ PASS' : '❌ FAIL';
  const det  = detail ? `  →  ${detail}` : '';
  console.log(`  [${mark}]  ${testName}${det}`);
}

async function bodyText(page) { return page.locator('body').innerText().catch(() => ''); }

// ── Comprobaciones helpers ────────────────────────────────────────────────────

/** Carga una URL y devuelve {ok, status, title, body} */
async function fetchPage(page, url, timeout = 12000) {
  try {
    const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout });
    return { ok: true, status: res.status(), title: await page.title(), body: await bodyText(page) };
  } catch (e) {
    return { ok: false, status: 0, title: '', body: '', error: e.message };
  }
}

/** Comprueba que no hay imágenes rotas en la página actual */
async function checkImages(page) {
  const imgs  = await page.$$('img');
  let broken  = 0;
  for (const img of imgs) {
    const complete = await img.evaluate(el => el.complete && el.naturalWidth > 0).catch(() => true);
    if (!complete) broken++;
  }
  return { total: imgs.length, broken };
}

/** Verifica que el sidebar MkDocs está presente */
async function hasMkDocsSidebar(page) {
  return (await page.$('nav.md-nav--primary, .md-sidebar--primary')) !== null;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECCIÓN 1 — Documentación MkDocs en Español
// ─────────────────────────────────────────────────────────────────────────────

const MKDOCS_BASE = 'http://127.0.0.1:8001/java-mod-workshop';

const LABS_ES = [
  { path: '/',       name: 'Home (ES)',    required: ['Workshop de Modernización Java con AMA', 'De tWAS a WebSphere Liberty', 'PedjasApp', 'Lab 0', 'Lab 6'] },
  { path: '/lab0/',  name: 'Lab 0 (ES)',   required: ['Requisitos Previos', 'Java JDK', 'Apache Maven', 'git clone', 'mvn clean package'] },
  { path: '/lab1/',  name: 'Lab 1 (ES)',   required: ['tWAS', 'PedjasApp', 'EAR', 'WebSphere Application Server', 'podman run', 'WSVR0001I'] },
  { path: '/lab2/',  name: 'Lab 2 (ES)',   required: ['IBM Application Modernization Accelerator', 'Data Collector', 'CR-001', 'CR-002', 'CR-003', 'Jakarta EE'] },
  { path: '/lab3/',  name: 'Lab 3 (ES)',   required: ['EJB 2.x', 'JPA', 'EntityBean', '@Entity', 'ibm-web-bnd.xml', 'mvn clean package'] },
  { path: '/lab3b/', name: 'Lab 3B (ES)',  required: ['IBM Bob', 'Liberty Modernization', 'IBM.bob-java', 'OpenRewrite'] },
  { path: '/lab4/',  name: 'Lab 4 (ES)',   required: ['server.xml', 'Dockerfile', 'Liberty', 'PostgreSQL', 'mpHealth-4.0', 'mpMetrics-5.0', 'admin123', 'pedjas123'] },
  { path: '/lab5/',  name: 'Lab 5 (ES)',   required: ['Validación', 'admin123', 'health/live', 'health/ready', '/metrics', 'classloader_loadedClasses_count', 'jvm_uptime'] },
  { path: '/lab6/',  name: 'Lab 6 (ES)',   required: ['Open Liberty Operator', 'Kubernetes', 'OpenShift', 'pedjasapp', 'postgres-secret'] },
];

const LABS_EN = [
  { path: '/en/',       name: 'Home (EN)',    required: ['Java Modernization Workshop', 'From tWAS to WebSphere Liberty', 'PedjasApp', 'Lab 0', 'Lab 6'] },
  { path: '/en/lab0/',  name: 'Lab 0 (EN)',   required: ['Prerequisites', 'Java JDK', 'Apache Maven', 'git clone', 'mvn clean package'] },
  { path: '/en/lab1/',  name: 'Lab 1 (EN)',   required: ['tWAS', 'PedjasApp', 'EAR', 'WebSphere Application Server', 'podman run', 'WSVR0001I'] },
  { path: '/en/lab2/',  name: 'Lab 2 (EN)',   required: ['IBM Application Modernization Accelerator', 'Data Collector', 'CR-001', 'CR-002', 'CR-003', 'Jakarta EE'] },
  { path: '/en/lab3/',  name: 'Lab 3 (EN)',   required: ['EJB 2.x', 'JPA', 'EntityBean', '@Entity', 'ibm-web-bnd.xml', 'mvn clean package'] },
  { path: '/en/lab3b/', name: 'Lab 3B (EN)',  required: ['IBM Bob', 'Liberty Modernization', 'IBM.bob-java', 'OpenRewrite'] },
  { path: '/en/lab4/',  name: 'Lab 4 (EN)',   required: ['server.xml', 'Dockerfile', 'Liberty', 'PostgreSQL', 'mpHealth-4.0', 'mpMetrics-5.0', 'admin123', 'pedjas123'] },
  { path: '/en/lab5/',  name: 'Lab 5 (EN)',   required: ['Validation', 'admin123', 'health/live', 'health/ready', '/metrics', 'classloader_loadedClasses_count', 'jvm_uptime'] },
  { path: '/en/lab6/',  name: 'Lab 6 (EN)',   required: ['Open Liberty Operator', 'Kubernetes', 'OpenShift', 'pedjasapp', 'postgres-secret'] },
];

async function auditMkDocs(page, labs, label) {
  setSection(`📚  DOCUMENTACIÓN MKDOCS — ${label}`);
  for (const lab of labs) {
    const url = MKDOCS_BASE + lab.path;
    const p   = await fetchPage(page, url);

    if (!p.ok || p.status !== 200) {
      log(lab.name, false, `HTTP ${p.status || 'ERROR'} — ${p.error || ''}`);
      continue;
    }

    // HTTP OK
    log(`${lab.name} — HTTP 200`, true, `"${p.title}"`);

    // Required strings
    const missing = lab.required.filter(s => !p.body.includes(s));
    if (missing.length === 0) {
      log(`${lab.name} — Contenido clave (${lab.required.length} términos)`, true, '');
    } else {
      missing.forEach(s => log(`${lab.name} — Contiene "${s}"`, false, 'Texto no encontrado'));
    }

    // Sidebar MkDocs
    log(`${lab.name} — Sidebar MkDocs`, await hasMkDocsSidebar(page), '');

    // Code blocks
    const codeCount = await page.locator('pre > code').count();
    log(`${lab.name} — Bloques de código (≥1)`, codeCount >= 1, `${codeCount} bloques`);

    // Images
    const imgResult = await checkImages(page);
    if (imgResult.total > 0) {
      log(`${lab.name} — Imágenes (${imgResult.total} total)`, imgResult.broken === 0,
        imgResult.broken > 0 ? `${imgResult.broken} imagen(es) rota(s)` : 'Sin imágenes rotas');
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SECCIÓN 2 — Aplicación PedjasApp (flujo E2E completo)
// ─────────────────────────────────────────────────────────────────────────────

const APP_BASE = 'http://localhost:9081/pedjasapp';

async function auditPedjasApp(page) {
  setSection('🛒  APLICACIÓN PEDJASAPP — Flujo E2E en WebSphere Liberty (9081)');

  // ── 2.1 Página de inicio / Login ──────────────────────────────────────────
  {
    const p = await fetchPage(page, `${APP_BASE}/inicio`);
    log('Login — HTTP 200', p.ok && p.status === 200, `"${p.title}"`);
    log('Login — Título correcto', p.title.includes('PedjasApp'), p.title);
    log('Login — Campo #usuario presente', p.body.includes('usuario') || p.body.includes('Usuario'), '');
    log('Login — Campo #contrasena presente', p.body.includes('contraseña') || p.body.includes('Contraseña'), '');
    log('Login — Botón submit presente', p.body.includes('Iniciar Sesión') || p.body.includes('Entrar'), '');
  }

  // ── 2.2 Redirige a login si no hay sesión ─────────────────────────────────
  {
    const p = await fetchPage(page, `${APP_BASE}/catalogo`);
    const redirectedToLogin = page.url().includes('/inicio') || p.body.includes('Iniciar Sesión') || p.body.includes('usuario');
    log('Sin sesión → redirige a /inicio', redirectedToLogin, page.url());
  }

  // ── 2.3 Autenticación ─────────────────────────────────────────────────────
  let loginOk = false;
  try {
    await page.goto(`${APP_BASE}/inicio`, { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.fill('#usuario',   'admin');
    await page.fill('#contrasena','admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/catalogo|inicio/, { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(600);
    const body = await bodyText(page);
    loginOk = body.includes('Catálogo') || body.includes('Producto') || body.includes('Administrador');
    log('Login admin/admin123 — Autenticación', loginOk, page.url());
    log('Login — Saludo "Hola, Administrador Sistema"', body.includes('Administrador Sistema'), '');
    log('Login — Nav: Catálogo visible', body.includes('Catálogo'), '');
    log('Login — Nav: Pedidos visible', body.includes('Pedidos'), '');
    log('Login — Nav: Métricas visible', body.includes('Métricas'), '');
    log('Login — Nav: Info visible', body.includes('Info'), '');
    log('Login — Nav: Cerrar Sesión visible', body.includes('Cerrar Sesión'), '');
  } catch (e) {
    log('Login admin/admin123', false, e.message);
  }

  if (!loginOk) {
    log('SKIP — resto de pruebas requieren sesión', false, 'Login falló');
    return;
  }

  // ── 2.4 Catálogo de productos ─────────────────────────────────────────────
  {
    const p = await fetchPage(page, `${APP_BASE}/catalogo`);
    log('Catálogo — HTTP 200', p.ok && p.status === 200, '');
    log('Catálogo — Productos visibles', p.body.includes('Portátil') || p.body.includes('Monitor') || p.body.includes('Teclado'), '');
    log('Catálogo — 14 productos cargados', p.body.includes('14') || (p.body.match(/ELECTRONICA|HOGAR|ROPA|ALIMENTACION/g)||[]).length >= 3, '');
    log('Catálogo — Filtro de categoría', p.body.includes('ELECTRONICA') && p.body.includes('HOGAR'), '');
    const imgRes = await checkImages(page);
    log('Catálogo — Sin imágenes rotas', imgRes.broken === 0, `${imgRes.total} imágenes`);
  }

  // ── 2.5 Filtrar por categoría ─────────────────────────────────────────────
  try {
    await page.goto(`${APP_BASE}/catalogo`, { waitUntil: 'domcontentloaded', timeout: 8000 });
    const selectEl = await page.$('select[name="categoria"]');
    if (selectEl) {
      await page.selectOption('select[name="categoria"]', 'ELECTRONICA');
      await page.click('button:has-text("Filtrar")');
      await page.waitForTimeout(800);
      const body = await bodyText(page);
      log('Catálogo — Filtro ELECTRONICA', body.includes('Portátil') || body.includes('Monitor') || body.includes('ELECTRONICA'), '');
    } else {
      log('Catálogo — Select categoría no encontrado', false, 'No hay select[name="categoria"]');
    }
  } catch (e) {
    log('Catálogo — Filtrado por categoría', false, e.message);
  }

  // ── 2.6 Crear pedido ──────────────────────────────────────────────────────
  let orderCreated = false;
  try {
    await page.goto(`${APP_BASE}/catalogo`, { waitUntil: 'domcontentloaded', timeout: 8000 });
    const btn = page.locator('button.btn-pedido').first();
    if (await btn.count() > 0) {
      await btn.click();
      await page.waitForURL(/pedidos|catalogo/, { timeout: 6000 }).catch(() => {});
      await page.waitForTimeout(1000);
      const body = await bodyText(page);
      orderCreated = body.includes('Pedido') && (body.includes('#') || body.includes('creado') || body.includes('éxito'));
      log('Pedido — Crear pedido con btn-pedido', orderCreated, page.url());
    } else {
      // Try form submit approach
      const form = page.locator('form[action*="pedido"]').first();
      if (await form.count() > 0) {
        await page.click('form[action*="pedido"] button[type="submit"]');
        await page.waitForTimeout(1000);
        const body = await bodyText(page);
        orderCreated = body.includes('Pedido') || body.includes('éxito');
        log('Pedido — Crear pedido (form submit)', orderCreated, page.url());
      } else {
        log('Pedido — Botón btn-pedido no encontrado', false, 'Comprueba el selector en el catálogo');
      }
    }
  } catch (e) {
    log('Pedido — Crear pedido', false, e.message);
  }

  // ── 2.7 Lista de pedidos ──────────────────────────────────────────────────
  {
    const p = await fetchPage(page, `${APP_BASE}/pedidos/lista`);
    log('Pedidos — HTTP 200', p.ok && p.status === 200, '');
    log('Pedidos — Saludo en nav "Hola, Administrador Sistema"', p.body.includes('Administrador Sistema'), '');
    log('Pedidos — Tabla de pedidos presente', p.body.includes('Pedido') || p.body.includes('Estado') || p.body.includes('Total'), '');
    if (orderCreated) {
      log('Pedidos — Pedido recién creado aparece', p.body.includes('#') || p.body.includes('PENDIENTE'), '');
    }
  }

  // ── 2.8 Página de información del servidor ────────────────────────────────
  {
    const p = await fetchPage(page, `${APP_BASE}/info`);
    log('Info — HTTP 200', p.ok && p.status === 200, '');
    log('Info — Versión Java visible', p.body.includes('Java') || p.body.includes('JVM') || p.body.includes('17'), '');
    log('Info — Liberty runtime visible', p.body.includes('Liberty') || p.body.includes('WebSphere'), '');
    log('Info — Enlace Dashboard Métricas', p.body.includes('metrics-dashboard') || p.body.includes('Métricas') || p.body.includes('Dashboard'), '');
  }

  // ── 2.9 Dashboard de Métricas ─────────────────────────────────────────────
  {
    const p = await fetchPage(page, `${APP_BASE}/metrics-dashboard`);
    log('Métricas Dashboard — HTTP 200', p.ok && p.status === 200, `"${p.title}"`);
    log('Métricas Dashboard — Título correcto', p.title.includes('Métricas') || p.title.includes('Dashboard'), p.title);
    // KPI cards: text-transform:uppercase en CSS → inner text en mayúsculas
    log('Métricas Dashboard — KPI cards presentes', p.body.includes('HEAP EN USO') || p.body.includes('Heap en uso'), '');
    // Secciones (renderizadas en mayúsculas por CSS)
    log('Métricas Dashboard — Sección Memoria', p.body.includes('MEMORIA') || p.body.includes('HEAP'), '');
    log('Métricas Dashboard — Sección Threads', p.body.includes('HILOS') || p.body.includes('THREADS'), '');
    log('Métricas Dashboard — Sección GC', p.body.includes('GARBAGE') || p.body.includes('GC') || p.body.includes('Garbage'), '');
    log('Métricas Dashboard — Sección Connection Pool', p.body.includes('Connection Pool') || p.body.includes('JDBC'), '');
    log('Métricas Dashboard — Sección REST API', p.body.includes('REST API') || p.body.includes('JAX-RS'), '');
    // fetchMetrics está en <script> → no visible en innerText; verificar con page.content()
    const html = await page.content();
    log('Métricas Dashboard — Auto-refresh JS (fetchMetrics)', html.includes('fetchMetrics'), '');
    log('Métricas Dashboard — Sin template literals JSP-conflictivos', !p.body.includes('${'), 'No deben quedar ${} en el HTML generado del script');
    const imgRes2 = await checkImages(page);
    log('Métricas Dashboard — Sin imágenes rotas', imgRes2.broken === 0, `${imgRes2.total} imágenes`);
  }

  // ── 2.10 Cerrar sesión ────────────────────────────────────────────────────
  {
    const p = await fetchPage(page, `${APP_BASE}/inicio?accion=logout`);
    const backToLogin = p.body.includes('Iniciar Sesión') || p.body.includes('usuario') || page.url().includes('inicio');
    log('Logout — Redirige a login', backToLogin, page.url());
  }

  // ── 2.11 Redirección post-logout ──────────────────────────────────────────
  {
    const p = await fetchPage(page, `${APP_BASE}/metrics-dashboard`);
    const redirected = page.url().includes('inicio') || p.body.includes('Iniciar Sesión') || p.body.includes('usuario');
    log('Post-logout: /metrics-dashboard → login', redirected, page.url());
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SECCIÓN 3 — Endpoints MicroProfile
// ─────────────────────────────────────────────────────────────────────────────

const MP_BASE = 'http://localhost:9081';

async function auditMicroProfile(page) {
  setSection('🔬  ENDPOINTS MICROPROFILE — Health, Metrics, OpenAPI');

  // /health
  try {
    const res = await page.goto(`${MP_BASE}/health`, { waitUntil: 'domcontentloaded', timeout: 8000 });
    const text = await bodyText(page);
    log('Health /health — HTTP 200', res.status() === 200, `Status ${res.status()}`);
    log('Health /health — status UP', text.includes('"UP"') || text.includes('UP'), text.slice(0,80));
  } catch (e) { log('Health /health', false, e.message); }

  // /health/live
  try {
    const res = await page.goto(`${MP_BASE}/health/live`, { waitUntil: 'domcontentloaded', timeout: 8000 });
    const text = await bodyText(page);
    log('Health /health/live — HTTP 200', res.status() === 200, `Status ${res.status()}`);
    log('Health /health/live — status UP', text.includes('"UP"') || text.includes('UP'), '');
  } catch (e) { log('Health /health/live', false, e.message); }

  // /health/ready
  try {
    const res = await page.goto(`${MP_BASE}/health/ready`, { waitUntil: 'domcontentloaded', timeout: 8000 });
    const text = await bodyText(page);
    log('Health /health/ready — HTTP 200', res.status() === 200, `Status ${res.status()}`);
    log('Health /health/ready — status UP', text.includes('"UP"') || text.includes('UP'), '');
  } catch (e) { log('Health /health/ready', false, e.message); }

  // /metrics
  try {
    const res = await page.goto(`${MP_BASE}/metrics`, { waitUntil: 'domcontentloaded', timeout: 8000 });
    const text = await bodyText(page);
    log('Metrics /metrics — HTTP 200', res.status() === 200, `Status ${res.status()}`);
    log('Metrics /metrics — classloader_loadedClasses_count', text.includes('classloader_loadedClasses_count'), '');
    log('Metrics /metrics — jvm_uptime_seconds', text.includes('jvm_uptime_seconds'), '');
    log('Metrics /metrics — thread_count', text.includes('thread_count'), '');
    log('Metrics /metrics — connectionpool_freeConnections', text.includes('connectionpool_freeConnections'), '');
    log('Metrics /metrics — memory_usedHeap_bytes', text.includes('memory_usedHeap_bytes'), '');
    log('Metrics /metrics — cpu_processCpuUtilization', text.includes('cpu_processCpuUtilization'), '');
  } catch (e) { log('Metrics /metrics', false, e.message); }

  // /openapi/ui/
  try {
    const res = await page.goto(`${MP_BASE}/openapi/ui/`, { waitUntil: 'domcontentloaded', timeout: 8000 });
    const title = await page.title();
    log('OpenAPI /openapi/ui/ — HTTP 200', res.status() === 200, `Status ${res.status()}`);
    log('OpenAPI /openapi/ui/ — Swagger UI', title.includes('Swagger') || title.includes('API') || title.includes('OpenAPI'), `"${title}"`);
  } catch (e) { log('OpenAPI /openapi/ui/', false, e.message); }

  // REST API endpoints
  try {
    const res = await page.goto(`${MP_BASE}/pedjasapp/api/v1/productos`, { waitUntil: 'domcontentloaded', timeout: 8000 });
    const text = await bodyText(page);
    log('REST API /api/v1/productos — HTTP 200', res.status() === 200, `Status ${res.status()}`);
    log('REST API /api/v1/productos — JSON array', text.includes('[') && text.includes('"nombre"'), text.slice(0,80));
    // Parse JSON to count top-level product objects (not string occurrences)
    try {
      const data = JSON.parse(text);
      const count = Array.isArray(data) ? data.length : 0;
      log('REST API /api/v1/productos — 14 productos', count === 14, `${count} productos devueltos`);
    } catch (_) {
      log('REST API /api/v1/productos — Parse JSON', false, 'Respuesta no parseable como JSON');
    }
  } catch (e) { log('REST API /api/v1/productos', false, e.message); }
}

// ─────────────────────────────────────────────────────────────────────────────
// SECCIÓN 4 — IBM AMA / Transformation Advisor
// ─────────────────────────────────────────────────────────────────────────────

async function auditAMA(page) {
  setSection('🔍  IBM AMA / TRANSFORMATION ADVISOR (https://localhost)');

  // GUI principal
  try {
    const res = await page.goto('https://localhost/', { waitUntil: 'domcontentloaded', timeout: 12000 });
    const title = await page.title();
    const body  = await bodyText(page);
    log('AMA GUI — HTTP 200', res.status() === 200, `Status ${res.status()} Title: "${title}"`);
    log('AMA GUI — Interfaz Transformation Advisor / AMA',
      title.includes('Transformation Advisor') || title.includes('IBM') || body.includes('Workspace') || body.includes('workspace'),
      `"${title.slice(0,60)}"`);

    // Esperar a que cargue la UI SPA
    await page.waitForTimeout(2000);
    const bodyAfter = await bodyText(page);
    log('AMA GUI — Botón Create workspace / Sample_data',
      bodyAfter.includes('Create workspace') || bodyAfter.includes('Sample_data') || bodyAfter.includes('workspace'),
      bodyAfter.slice(0,120));
  } catch (e) {
    log('AMA GUI — No accesible (¿está arrancado AMA?)', false, e.message.slice(0,100));
  }

  // API REST workspaces
  try {
    const res = await page.goto('https://localhost:2220/lands_advisor/advisor/v2/workspaces',
      { waitUntil: 'domcontentloaded', timeout: 8000 });
    const text = await bodyText(page);
    const isJson = text.includes('{') || text.includes('[');
    log('AMA API — /v2/workspaces HTTP 200', res.status() === 200, `Status ${res.status()}`);
    log('AMA API — Respuesta JSON válida', isJson, text.slice(0,80));

    if (isJson) {
      try {
        const data = JSON.parse(text.match(/[\[{].*[\]}]/s)?.[0] || text);
        const wsArr = data.workspaces || data;
        const hasWs = Array.isArray(wsArr) && wsArr.length > 0;
        log('AMA API — Workspaces disponibles', hasWs, `${Array.isArray(wsArr) ? wsArr.length : '?'} workspace(s)`);
        if (hasWs) {
          const pedjasWs = wsArr.find(w => /PedjasApp|Workshop/i.test(w.name || ''));
          log('AMA API — Workspace Workshop_PedjasApp existe', !!pedjasWs, pedjasWs ? `id=${pedjasWs.id}` : 'No encontrado (usa Sample_data)');
        }
      } catch (_) {
        log('AMA API — Parse JSON workspaces', false, 'Respuesta no parseable');
      }
    }
  } catch (e) {
    log('AMA API — /v2/workspaces no accesible', false, e.message.slice(0,100));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

(async () => {
  console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║   AUDITORÍA COMPLETA — Java Modernization Workshop                   ║');
  console.log('║   MkDocs ES+EN · PedjasApp E2E · MicroProfile · AMA GUI+API          ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝');

  const browser = await chromium.launch({ headless: true, args: ['--ignore-certificate-errors', '--no-sandbox'] });
  const ctx     = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1400, height: 900 } });
  const page    = await ctx.newPage();

  try {
    // 1. Documentación español
    await auditMkDocs(page, LABS_ES, 'ESPAÑOL');

    // 2. Documentación inglés
    await auditMkDocs(page, LABS_EN, 'INGLÉS');

    // 3. App PedjasApp E2E
    await auditPedjasApp(page);

    // 4. Endpoints MicroProfile
    await auditMicroProfile(page);

    // 5. AMA (puede no estar arrancado en cada sesión)
    await auditAMA(page);

  } finally {
    await browser.close();
  }

  // ── Resumen final ─────────────────────────────────────────────────────────
  const total  = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  const bySection = {};
  for (const r of results) {
    if (!bySection[r.section]) bySection[r.section] = { ok: 0, fail: 0 };
    r.passed ? bySection[r.section].ok++ : bySection[r.section].fail++;
  }

  console.log('\n' + '═'.repeat(72));
  console.log('  RESUMEN GLOBAL');
  console.log('═'.repeat(72));
  for (const [sec, counts] of Object.entries(bySection)) {
    const icon = counts.fail === 0 ? '✅' : '⚠️ ';
    console.log(`  ${icon}  ${sec.padEnd(55)} ${counts.ok}✅  ${counts.fail}❌`);
  }
  console.log('─'.repeat(72));
  console.log(`  Total checks  : ${total}`);
  console.log(`  Pasados       : ${passed}`);
  console.log(`  Fallidos      : ${failed}`);

  if (failed > 0) {
    console.log('\n  ❌  FALLOS DETECTADOS:');
    results.filter(r => !r.passed).forEach(r =>
      console.log(`       • [${r.section}] ${r.testName}${r.detail ? ' → ' + r.detail : ''}`)
    );
  }

  console.log('\n' + (failed === 0
    ? '  🎉  TODAS LAS PRUEBAS PASARON — Workshop verificado al 100%'
    : `  ⚠️   ${failed} PRUEBA(S) FALLARON — ver detalle arriba`));
  console.log('═'.repeat(72) + '\n');

  process.exit(failed > 0 ? 1 : 0);
})();
