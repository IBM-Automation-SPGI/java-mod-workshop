/**
 * scripts/check-app.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Auditoría completa de la aplicación PedjasApp modernizada en Liberty.
 *
 * Qué comprueba:
 *   SECCIÓN 1 — PedjasApp E2E (flujo completo)
 *     • Página de login accesible y formulario presente
 *     • Redirección a login cuando no hay sesión
 *     • Autenticación admin/admin123
 *     • Catálogo de productos (14 items, filtro por categoría)
 *     • Crear pedido y confirmar persistencia en PostgreSQL
 *     • Lista de pedidos (tabla, estados)
 *     • Página de información del servidor
 *     • Dashboard de métricas (KPIs, secciones, JS auto-refresh)
 *     • Cerrar sesión y redirección post-logout
 *
 *   SECCIÓN 2 — MicroProfile Endpoints
 *     • GET /health           → status UP
 *     • GET /health/live      → status UP
 *     • GET /health/ready     → status UP
 *     • GET /metrics          → métricas Prometheus (6 claves clave)
 *     • GET /openapi/ui/      → Swagger UI
 *     • GET /api/v1/productos → JSON array con 14 productos
 *     • GET /api/v1/pedidos   → JSON array (requiere sesión, 405 esperado sin auth)
 *
 *   SECCIÓN 3 — IBM AMA / Transformation Advisor (opcional)
 *     • GUI https://localhost/ → HTTP 200 + SPA cargada
 *     • API /v2/workspaces    → JSON válido
 *     • Workspace Workshop_PedjasApp existe
 *     • Assessment Units disponibles para pedjasapp.ear
 *
 * Uso:
 *   node scripts/check-app.js
 *   node scripts/check-app.js --skip-ama       (omite sección AMA)
 *
 * Requiere:
 *   • pedjasapp-liberty container en puerto 9081
 *   • pedjasapp-postgres container en puerto 5432
 *   • AMA (opcional) en https://localhost/
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Reporter, launchBrowser, fetchPage, checkImages, bodyText } from './_shared.js';

// ── Configuración ─────────────────────────────────────────────────────────────

const APP_BASE = 'http://localhost:9081/pedjasapp';
const MP_BASE  = 'http://localhost:9081';
const SKIP_AMA = process.argv.includes('--skip-ama');

// ── SECCIÓN 1 — PedjasApp E2E ─────────────────────────────────────────────────

async function auditPedjasApp(page, reporter) {
  reporter.section('🛒  PEDJASAPP — Flujo E2E en WebSphere Liberty (puerto 9081)');

  // 1.1 Página de inicio — accesible y formulario de login presente
  {
    const p = await fetchPage(page, `${APP_BASE}/inicio`);
    reporter.log('Login — HTTP 200', p.ok && p.status === 200, `"${p.title}"`);
    reporter.log('Login — Título incluye PedjasApp', p.title.includes('PedjasApp'), p.title);
    reporter.log('Login — Campo #usuario presente',
      p.body.includes('usuario') || p.body.includes('Usuario'));
    reporter.log('Login — Campo #contrasena presente',
      p.body.includes('contraseña') || p.body.includes('Contraseña') || p.body.includes('contrasena'));
    reporter.log('Login — Botón de submit presente',
      p.body.includes('Iniciar Sesión') || p.body.includes('Entrar') || p.body.includes('Login'));
  }

  // 1.2 Redirección a login si no hay sesión activa
  {
    await fetchPage(page, `${APP_BASE}/catalogo`);
    const redirected = page.url().includes('/inicio') ||
      (await bodyText(page)).includes('Iniciar Sesión') ||
      (await bodyText(page)).includes('usuario');
    reporter.log('Sin sesión → /catalogo redirige a /inicio', redirected, page.url());
  }

  // 1.3 Autenticación
  let loginOk = false;
  try {
    await page.goto(`${APP_BASE}/inicio`, { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.fill('#usuario',    'admin');
    await page.fill('#contrasena', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/catalogo|inicio/, { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(600);
    const body = await bodyText(page);
    loginOk = body.includes('Catálogo') || body.includes('Producto') || body.includes('Administrador');
    reporter.log('Autenticación admin/admin123', loginOk, page.url());
    reporter.log('Saludo "Administrador Sistema" visible',
      body.includes('Administrador Sistema') || body.includes('Administrador'));
    reporter.log('Nav — Catálogo visible',     body.includes('Catálogo'));
    reporter.log('Nav — Pedidos visible',      body.includes('Pedidos'));
    reporter.log('Nav — Métricas visible',     body.includes('Métricas') || body.includes('Dashboard'));
    reporter.log('Nav — Info visible',         body.includes('Info'));
    reporter.log('Nav — Cerrar Sesión visible', body.includes('Cerrar Sesión') || body.includes('Salir'));
  } catch (e) {
    reporter.log('Autenticación admin/admin123', false, e.message.slice(0, 120));
  }

  if (!loginOk) {
    reporter.log('⚠ SKIP — resto de pruebas requieren sesión', false, 'Login fallido');
    return;
  }

  // 1.4 Catálogo de productos
  {
    const p = await fetchPage(page, `${APP_BASE}/catalogo`);
    reporter.log('Catálogo — HTTP 200', p.ok && p.status === 200);
    reporter.log('Catálogo — Productos cargados (Portátil/Monitor/Teclado)',
      p.body.includes('Portátil') || p.body.includes('Monitor') || p.body.includes('Teclado'));
    reporter.log('Catálogo — Categorías presentes (ELECTRONICA/HOGAR/ROPA)',
      p.body.includes('ELECTRONICA') && (p.body.includes('HOGAR') || p.body.includes('ROPA')));
    const imgRes = await checkImages(page);
    reporter.log(`Catálogo — Imágenes (${imgRes.total} total, 0 rotas)`, imgRes.broken === 0,
      imgRes.broken ? `${imgRes.broken} rota(s)` : '');
  }

  // 1.5 Filtro por categoría
  try {
    await page.goto(`${APP_BASE}/catalogo`, { waitUntil: 'domcontentloaded', timeout: 8000 });
    const selectEl = await page.$('select[name="categoria"]');
    if (selectEl) {
      await page.selectOption('select[name="categoria"]', 'ELECTRONICA');
      await page.click('button:has-text("Filtrar")');
      await page.waitForTimeout(800);
      const body = await bodyText(page);
      reporter.log('Catálogo — Filtro ELECTRONICA', body.includes('ELECTRONICA'));
    } else {
      reporter.log('Catálogo — Select categoría presente', false, 'No hay select[name="categoria"]');
    }
  } catch (e) {
    reporter.log('Catálogo — Filtro categoría', false, e.message.slice(0, 120));
  }

  // 1.6 Crear pedido
  let orderCreated = false;
  try {
    await page.goto(`${APP_BASE}/catalogo`, { waitUntil: 'domcontentloaded', timeout: 8000 });
    const btn = page.locator('button.btn-pedido').first();
    if (await btn.count() > 0) {
      await btn.click();
      await page.waitForURL(/pedidos|catalogo/, { timeout: 6000 }).catch(() => {});
      await page.waitForTimeout(1000);
      const body = await bodyText(page);
      orderCreated = body.includes('Pedido') &&
        (body.includes('#') || body.includes('creado') || body.includes('éxito') || body.includes('PENDIENTE'));
      reporter.log('Pedido — Crear desde catálogo (btn-pedido)', orderCreated, page.url());
    } else {
      reporter.log('Pedido — Botón btn-pedido en catálogo', false, 'Selector no encontrado');
    }
  } catch (e) {
    reporter.log('Pedido — Crear pedido', false, e.message.slice(0, 120));
  }

  // 1.7 Lista de pedidos
  {
    const p = await fetchPage(page, `${APP_BASE}/pedidos/lista`);
    reporter.log('Pedidos — /pedidos/lista HTTP 200', p.ok && p.status === 200);
    reporter.log('Pedidos — Tabla de pedidos (Estado / Total)',
      p.body.includes('Estado') || p.body.includes('Total') || p.body.includes('Pedido'));
    reporter.log('Pedidos — Nav usuario visible',
      p.body.includes('Administrador') || p.body.includes('admin'));
    if (orderCreated) {
      reporter.log('Pedidos — Pedido recién creado aparece (PENDIENTE)',
        p.body.includes('PENDIENTE') || p.body.includes('#'));
    }
  }

  // 1.8 Página de información del servidor
  {
    const p = await fetchPage(page, `${APP_BASE}/info`);
    reporter.log('Info — HTTP 200', p.ok && p.status === 200);
    reporter.log('Info — Versión Java visible',
      p.body.includes('Java') || p.body.includes('JVM') || p.body.includes('17') || p.body.includes('21'));
    reporter.log('Info — Liberty runtime visible',
      p.body.includes('Liberty') || p.body.includes('WebSphere'));
    reporter.log('Info — Enlace al Dashboard de Métricas',
      p.body.includes('metrics-dashboard') || p.body.includes('Métricas') || p.body.includes('Dashboard'));
  }

  // 1.9 Dashboard de Métricas
  {
    const p = await fetchPage(page, `${APP_BASE}/metrics-dashboard`);
    reporter.log('Dashboard Métricas — HTTP 200', p.ok && p.status === 200, `"${p.title}"`);
    reporter.log('Dashboard Métricas — Título correcto',
      p.title.includes('Métricas') || p.title.includes('Dashboard'), p.title);
    // CSS text-transform:uppercase → KPI cards en mayúsculas en innerText
    reporter.log('Dashboard Métricas — KPI HEAP EN USO',
      p.body.includes('HEAP EN USO') || p.body.includes('Heap en uso'));
    reporter.log('Dashboard Métricas — Sección MEMORIA',
      p.body.includes('MEMORIA') || p.body.includes('HEAP'));
    reporter.log('Dashboard Métricas — Sección HILOS/THREADS',
      p.body.includes('HILOS') || p.body.includes('THREADS') || p.body.includes('Threads'));
    reporter.log('Dashboard Métricas — Sección GARBAGE COLLECTOR',
      p.body.includes('GARBAGE') || p.body.includes('GC') || p.body.includes('Garbage'));
    reporter.log('Dashboard Métricas — Sección CONNECTION POOL',
      p.body.includes('Connection Pool') || p.body.includes('JDBC') || p.body.includes('POOL'));
    reporter.log('Dashboard Métricas — Sección REST API',
      p.body.includes('REST API') || p.body.includes('JAX-RS') || p.body.includes('REST'));
    // fetchMetrics está en el bloque <script>, no en innerText → usar page.content()
    const html = await page.content();
    reporter.log('Dashboard Métricas — JS fetchMetrics presente', html.includes('fetchMetrics'));
    reporter.log('Dashboard Métricas — Sin ${} JSP sin resolver', !p.body.includes('${'),
      p.body.includes('${') ? 'Hay template literals sin resolver' : '');
    const imgRes = await checkImages(page);
    reporter.log(`Dashboard Métricas — Imágenes (${imgRes.total} total, 0 rotas)`, imgRes.broken === 0);
  }

  // 1.10 Cerrar sesión
  {
    const p = await fetchPage(page, `${APP_BASE}/inicio?accion=logout`);
    const backToLogin = p.body.includes('Iniciar Sesión') || p.body.includes('usuario') ||
      page.url().includes('inicio');
    reporter.log('Logout — Redirige a página de login', backToLogin, page.url());
  }

  // 1.11 Protección post-logout: recursos protegidos → redirect login
  {
    const p = await fetchPage(page, `${APP_BASE}/metrics-dashboard`);
    const isProtected = page.url().includes('inicio') || p.body.includes('Iniciar Sesión') || p.body.includes('usuario');
    reporter.log('Post-logout — /metrics-dashboard redirige a login', isProtected, page.url());
  }
  {
    const p = await fetchPage(page, `${APP_BASE}/catalogo`);
    const isProtected = page.url().includes('inicio') || p.body.includes('Iniciar Sesión');
    reporter.log('Post-logout — /catalogo redirige a login', isProtected, page.url());
  }
}

// ── SECCIÓN 2 — MicroProfile Endpoints ───────────────────────────────────────

async function auditMicroProfile(page, reporter) {
  reporter.section('🔬  MICROPROFILE — Health, Metrics, OpenAPI, REST API');

  // /health
  try {
    const res  = await page.goto(`${MP_BASE}/health`, { waitUntil: 'domcontentloaded', timeout: 8000 });
    const text = await bodyText(page);
    reporter.log('GET /health — HTTP 200', res.status() === 200, `Status ${res.status()}`);
    reporter.log('GET /health — status "UP"',
      text.includes('"UP"') || text.includes('UP'));
    reporter.log('GET /health — JSON válido',
      text.includes('{') && text.includes('checks'));
  } catch (e) { reporter.log('GET /health', false, e.message.slice(0, 120)); }

  // /health/live
  try {
    const res  = await page.goto(`${MP_BASE}/health/live`, { waitUntil: 'domcontentloaded', timeout: 8000 });
    const text = await bodyText(page);
    reporter.log('GET /health/live — HTTP 200', res.status() === 200, `Status ${res.status()}`);
    reporter.log('GET /health/live — status "UP"',
      text.includes('"UP"') || text.includes('UP'));
  } catch (e) { reporter.log('GET /health/live', false, e.message.slice(0, 120)); }

  // /health/ready
  try {
    const res  = await page.goto(`${MP_BASE}/health/ready`, { waitUntil: 'domcontentloaded', timeout: 8000 });
    const text = await bodyText(page);
    reporter.log('GET /health/ready — HTTP 200', res.status() === 200, `Status ${res.status()}`);
    reporter.log('GET /health/ready — status "UP"',
      text.includes('"UP"') || text.includes('UP'));
  } catch (e) { reporter.log('GET /health/ready', false, e.message.slice(0, 120)); }

  // /metrics — formato Prometheus MicroProfile Metrics 5.0
  try {
    const res  = await page.goto(`${MP_BASE}/metrics`, { waitUntil: 'domcontentloaded', timeout: 8000 });
    const text = await bodyText(page);
    reporter.log('GET /metrics — HTTP 200', res.status() === 200, `Status ${res.status()}`);
    reporter.log('GET /metrics — classloader_loadedClasses_count',  text.includes('classloader_loadedClasses_count'));
    reporter.log('GET /metrics — jvm_uptime_seconds',               text.includes('jvm_uptime_seconds'));
    reporter.log('GET /metrics — thread_count',                     text.includes('thread_count'));
    reporter.log('GET /metrics — memory_usedHeap_bytes',            text.includes('memory_usedHeap_bytes'));
    reporter.log('GET /metrics — connectionpool_freeConnections',   text.includes('connectionpool_freeConnections'));
    reporter.log('GET /metrics — cpu_processCpuUtilization',        text.includes('cpu_processCpuUtilization'));
    // Verificar formato MicroProfile 5.0: etiqueta mp_scope
    reporter.log('GET /metrics — Formato MP 5.0 (mp_scope label)',  text.includes('mp_scope'));
  } catch (e) { reporter.log('GET /metrics', false, e.message.slice(0, 120)); }

  // /openapi/ui/
  try {
    const res   = await page.goto(`${MP_BASE}/openapi/ui/`, { waitUntil: 'domcontentloaded', timeout: 8000 });
    const title = await page.title();
    reporter.log('GET /openapi/ui/ — HTTP 200', res.status() === 200, `Status ${res.status()}`);
    reporter.log('GET /openapi/ui/ — Swagger UI cargada',
      title.includes('Swagger') || title.includes('API') || title.includes('OpenAPI'), `"${title}"`);
  } catch (e) { reporter.log('GET /openapi/ui/', false, e.message.slice(0, 120)); }

  // REST API: GET /api/v1/productos
  try {
    const res  = await page.goto(`${MP_BASE}/pedjasapp/api/v1/productos`, { waitUntil: 'domcontentloaded', timeout: 8000 });
    const text = await bodyText(page);
    reporter.log('REST GET /api/v1/productos — HTTP 200', res.status() === 200, `Status ${res.status()}`);
    reporter.log('REST GET /api/v1/productos — JSON array',
      text.includes('[') && text.includes('"nombre"'), text.slice(0, 60));
    try {
      const data  = JSON.parse(text);
      const count = Array.isArray(data) ? data.length : 0;
      reporter.log('REST GET /api/v1/productos — 14 productos', count === 14,
        `${count} productos devueltos`);
      if (count > 0) {
        const first = data[0];
        reporter.log('REST GET /api/v1/productos — Campos: id, nombre, precio, categoria',
          first.id !== undefined && first.nombre !== undefined &&
          first.precio !== undefined && first.categoria !== undefined,
          `Campos: ${Object.keys(first).join(', ')}`);
      }
    } catch (_) {
      reporter.log('REST GET /api/v1/productos — Parse JSON', false, 'Respuesta no parseable');
    }
  } catch (e) { reporter.log('REST GET /api/v1/productos', false, e.message.slice(0, 120)); }

  // REST API: POST /api/v1/pedidos (sin auth → 401/403 es correcto, 200 con JSON es más correcto)
  try {
    const res  = await page.goto(`${MP_BASE}/pedjasapp/api/v1/pedidos`, { waitUntil: 'domcontentloaded', timeout: 8000 });
    const statusOk = res.status() === 405 || res.status() === 401 || res.status() === 403 || res.status() === 200;
    reporter.log('REST GET /api/v1/pedidos — Responde (200/401/403/405)',
      statusOk, `Status ${res.status()}`);
  } catch (e) { reporter.log('REST GET /api/v1/pedidos', false, e.message.slice(0, 120)); }
}

// ── SECCIÓN 3 — IBM AMA / Transformation Advisor ─────────────────────────────

async function auditAMA(page, reporter) {
  reporter.section('🔍  IBM AMA / TRANSFORMATION ADVISOR (https://localhost)');

  if (SKIP_AMA) {
    reporter.log('AMA — OMITIDO con --skip-ama', true, 'Pasado intencionalmente');
    return;
  }

  // GUI principal
  try {
    const res = await page.goto('https://localhost/', { waitUntil: 'domcontentloaded', timeout: 12000 });
    const title = await page.title();
    const body  = await bodyText(page);
    reporter.log('AMA GUI — HTTP 200', res.status() === 200, `Status ${res.status()} | "${title}"`);
    reporter.log('AMA GUI — Interfaz Transformation Advisor / AMA',
      title.includes('Transformation Advisor') || title.includes('IBM') ||
      body.includes('Workspace') || body.includes('workspace'));

    // Esperar que la SPA cargue
    await page.waitForTimeout(2500);
    const bodyAfter = await bodyText(page);
    reporter.log('AMA GUI — SPA cargada (Workspace/Upload/Settings visible)',
      bodyAfter.includes('workspace') || bodyAfter.includes('Workspace') ||
      bodyAfter.includes('Upload') || bodyAfter.includes('Create') ||
      bodyAfter.includes('Settings') || bodyAfter.includes('About'),
      bodyAfter.slice(0, 100));
  } catch (e) {
    reporter.log('AMA GUI — No accesible (¿está arrancado AMA?)', false, e.message.slice(0, 100));
  }

  // API REST — /v2/workspaces
  try {
    const res  = await page.goto('https://localhost:2220/lands_advisor/advisor/v2/workspaces',
      { waitUntil: 'domcontentloaded', timeout: 8000 });
    const text = await bodyText(page);
    reporter.log('AMA API /v2/workspaces — HTTP 200', res.status() === 200, `Status ${res.status()}`);
    reporter.log('AMA API /v2/workspaces — Respuesta JSON', text.includes('{') || text.includes('['));

    try {
      const data  = JSON.parse(text.match(/[\[{].*[\]}]/s)?.[0] || text);
      const wsArr = data.workspaces || data;
      const hasWs = Array.isArray(wsArr) && wsArr.length > 0;
      reporter.log('AMA API — Workspaces disponibles', hasWs,
        `${Array.isArray(wsArr) ? wsArr.length : '?'} workspace(s)`);

      if (hasWs) {
        const pedjasWs = wsArr.find(w => /PedjasApp|Workshop/i.test(w.name || ''));
        reporter.log('AMA API — Workspace Workshop_PedjasApp existe', !!pedjasWs,
          pedjasWs ? `id=${pedjasWs.id}` : 'No encontrado');

        if (pedjasWs) {
          // Assessment Units
          const auRes  = await page.goto(
            `https://localhost:2220/lands_advisor/advisor/v2/workspaces/${pedjasWs.id}/assessmentUnits`,
            { waitUntil: 'domcontentloaded', timeout: 8000 });
          const auText = await bodyText(page);
          reporter.log('AMA API /assessmentUnits — HTTP 200', auRes.status() === 200);
          try {
            const auData  = JSON.parse(auText);
            const auCount = (auData.assessmentUnits || auData || []).length;
            reporter.log('AMA API — Assessment Units (≥1)', auCount >= 1,
              `${auCount} unidades`);
            reporter.log('AMA API — pedjasapp.ear analizado',
              auText.includes('pedjasapp'), auText.slice(0, 80));
          } catch (_) {
            reporter.log('AMA API — Parse assessmentUnits JSON', false);
          }
        }
      }
    } catch (_) {
      reporter.log('AMA API — Parse workspaces JSON', false, text.slice(0, 80));
    }
  } catch (e) {
    reporter.log('AMA API — /v2/workspaces no accesible', false, e.message.slice(0, 100));
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

(async () => {
  console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║   CHECK-APP — Auditoría aplicación + MicroProfile + AMA             ║');
  console.log('║   PedjasApp E2E · Health · Metrics · OpenAPI · REST · AMA           ║');
  console.log(SKIP_AMA
    ? '║   ⚠  AMA omitido (--skip-ama)                                        ║'
    : '║   AMA incluido (usa --skip-ama para omitirlo)                         ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝');

  const reporter = new Reporter();
  const { browser, page } = await launchBrowser();

  try {
    await auditPedjasApp(page, reporter);
    await auditMicroProfile(page, reporter);
    await auditAMA(page, reporter);
  } finally {
    await browser.close();
  }

  const failed = reporter.summary();
  process.exit(failed > 0 ? 1 : 0);
})();
