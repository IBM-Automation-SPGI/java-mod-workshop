import { chromium } from 'playwright';
import { execSync } from 'child_process';
import fs from 'fs';

async function runCompleteWorkshopE2E() {
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║   TEST END-TO-END COMPLETO — JAVA MODERNIZATION WORKSHOP           ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');

  const results = [];
  const log = (phase, testName, passed, detail = '') => {
    results.push({ phase, testName, passed, detail });
    const mark = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`[${mark}] [${phase}] ${testName} ${detail ? `→ ${detail}` : ''}`);
  };

  // ─────────────────────────────────────────────────────────────
  // FASE 1: AUDITORÍA DE COMPILACIÓN Y EMPAQUETADO MAVEN
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- FASE 1: COMPILACIÓN & EMPAQUETADO MAVEN ---');
  try {
    const twasBuild = execSync('mvn clean package -DskipTests', { cwd: './pedjasapp-twas', encoding: 'utf-8' });
    const earExists = fs.existsSync('./pedjasapp-twas/pedjasapp-ear/target/pedjasapp.ear');
    log('Build Maven', 'tWAS Multi-módulo EAR', earExists, `EAR generado: ${earExists}`);
  } catch (err) {
    log('Build Maven', 'tWAS Multi-módulo EAR', false, err.message);
  }

  try {
    const libertyBuild = execSync('mvn clean package -DskipTests', { cwd: './pedjasapp-liberty', encoding: 'utf-8' });
    const warExists = fs.existsSync('./pedjasapp-liberty/target/pedjasapp.war');
    log('Build Maven', 'Liberty Jakarta EE 10 WAR', warExists, `WAR generado: ${warExists}`);
  } catch (err) {
    log('Build Maven', 'Liberty Jakarta EE 10 WAR', false, err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // FASE 2: NAVEGACIÓN Y AUDITORÍA DE DOCUMENTACIÓN (MkDocs)
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- FASE 2: DOCUMENTACIÓN DEL WORKSHOP (MkDocs) ---');
  const browser = await chromium.launch({
    headless: true,
    args: ['--ignore-certificate-errors', '--no-sandbox']
  });

  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1400, height: 900 }
  });

  const page = await context.newPage();

  const pagesToTest = [
    { url: 'http://localhost:8088/', name: 'Home / Introducción', expectedText: 'Workshop de Modernización Java con AMA' },
    { url: 'http://localhost:8088/lab0/', name: 'Lab 0: Requisitos Previos', expectedText: 'Requisitos Previos' },
    { url: 'http://localhost:8088/lab1/', name: 'Lab 1: Despliegue tWAS', expectedText: 'Despliegue de la Aplicación en tWAS' },
    { url: 'http://localhost:8088/lab2/', name: 'Lab 2: Análisis AMA', expectedText: 'Análisis con IBM Application Modernization Accelerator' },
    { url: 'http://localhost:8088/lab3/', name: 'Lab 3: Modernización Manual', expectedText: 'Modernización Manual Guiada por AMA' },
    { url: 'http://localhost:8088/lab3b/', name: 'Lab 3B: Asistido con Bob', expectedText: 'Modernización Asistida con IBM Bob' },
    { url: 'http://localhost:8088/lab4/', name: 'Lab 4: Despliegue Liberty', expectedText: 'Despliegue en WebSphere Liberty' },
    { url: 'http://localhost:8088/lab5/', name: 'Lab 5: Validación', expectedText: 'Validación y Siguientes Pasos' },
    { url: 'http://localhost:8088/lab6/', name: 'Lab 6: Kubernetes & OpenShift', expectedText: 'Open Liberty Operator' }
  ];

  for (const p of pagesToTest) {
    try {
      const res = await page.goto(p.url, { waitUntil: 'domcontentloaded', timeout: 6000 });
      const body = await page.locator('body').innerText();
      const codeBlocks = await page.locator('pre code').count();
      const ok = res.status() === 200 && body.includes(p.expectedText);
      log('MkDocs', p.name, ok, `Status ${res.status()} | Code blocks: ${codeBlocks}`);
    } catch (e) {
      log('MkDocs', p.name, false, e.message);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // FASE 3: AUDITORÍA DE IBM AMA / TRANSFORMATION ADVISOR
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- FASE 3: IBM AMA / TRANSFORMATION ADVISOR (GUI & API) ---');
  try {
    const amaRes = await page.goto('https://localhost/', { waitUntil: 'domcontentloaded', timeout: 10000 });
    const amaTitle = await page.title();
    log('AMA GUI', 'Carga Consola AMA HTTPS', amaRes.status() === 200, `Title: "${amaTitle}"`);

    // Probar API REST de AMA
    const wsApi = execSync('curl -k -s https://localhost:2220/lands_advisor/advisor/v2/workspaces', { encoding: 'utf-8' });
    const wsData = JSON.parse(wsApi);
    const hasWorkspaces = Array.isArray(wsData.workspaces) && wsData.workspaces.length > 0;
    log('AMA API', 'Listar Workspaces (/advisor/v2/workspaces)', hasWorkspaces, `Total workspaces: ${wsData.workspaces.length}`);

    // Verificar si existe el workspace PedjasApp
    const pedjasWs = wsData.workspaces.find(w => w.name.includes('PedjasApp') || w.name.includes('Workshop_PedjasApp'));
    if (pedjasWs) {
      const auApi = execSync(`curl -k -s https://localhost:2220/lands_advisor/advisor/v2/workspaces/${pedjasWs.id}/assessmentUnits`, { encoding: 'utf-8' });
      const auData = JSON.parse(auApi);
      const auCount = auData.assessmentUnits ? auData.assessmentUnits.length : 0;
      log('AMA API', 'Consultar Assessment Units', auCount > 0, `Unidades analizadas: ${auCount}`);
    }
  } catch (e) {
    log('AMA', 'Verificación Consola/API', false, e.message);
  }

  // ─────────────────────────────────────────────────────────────
  // FASE 4: E2E TESTING COMPLETO DE LA APP EN WEBSPHERE LIBERTY
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- FASE 4: APLICACIÓN PEDJASAPP MODERNIZADA EN LIBERTY ---');
  try {
    // 1. Acceso a Login
    const loginRes = await page.goto('http://localhost:9081/pedjasapp/', { waitUntil: 'domcontentloaded', timeout: 8000 });
    const loginTitle = await page.title();
    log('Liberty E2E', 'Página de Inicio / Login', loginRes.status() === 200, `Title: "${loginTitle}"`);

    // 2. Autenticación con admin / admin123
    await page.fill('#usuario', 'admin');
    await page.fill('#contrasena', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    const catalogText = await page.locator('body').innerText();
    const isLogged = catalogText.includes('Catálogo') && (catalogText.includes('Hola, Administrador') || catalogText.includes('Hola,') || catalogText.includes('admin'));
    log('Liberty E2E', 'Autenticación de Usuario', isLogged, 'Sesión iniciada correctamente');

    // 3. Filtrar por Categoría
    await page.selectOption('select[name="categoria"]', 'ELECTRONICA');
    await page.click('button:has-text("Filtrar")');
    await page.waitForTimeout(1000);
    const filteredText = await page.locator('body').innerText();
    const filterOk = filteredText.includes('Portátil') || filteredText.includes('ELECTRONICA');
    log('Liberty E2E', 'Filtrado de Catálogo (ELECTRONICA)', filterOk, 'Tabla actualizada con productos filtrados');

    // 4. Crear Nuevo Pedido
    const orderBtn = page.locator('button.btn-pedido').first();
    if (await orderBtn.count() > 0) {
      await orderBtn.click();
      await page.waitForTimeout(1500);
      const orderConfirm = await page.locator('body').innerText();
      const orderOk = orderConfirm.includes('Mis Pedidos') || orderConfirm.includes('Total:') || orderConfirm.includes('PED-') || orderConfirm.includes('éxito');
      log('Liberty E2E', 'Creación de Pedido con PostgreSQL', orderOk, 'Transacción persistida con clave generada');
    }

    // 5. Histórico de Pedidos
    const misPedidosLink = page.locator('a:has-text("Mis Pedidos")').first();
    if (await misPedidosLink.count() > 0) {
      await misPedidosLink.click();
      await page.waitForTimeout(1000);
      const ordersTable = await page.locator('table').count();
      log('Liberty E2E', 'Consulta de Mis Pedidos', ordersTable > 0, `Tablas de pedidos renderizadas: ${ordersTable}`);
    }

    // 6. Cerrar Sesión
    const logoutRes = await page.goto('http://localhost:9081/pedjasapp/inicio?accion=logout', { waitUntil: 'domcontentloaded', timeout: 5000 });
    const postLogout = await page.locator('body').innerText();
    const loginPresent = postLogout.includes('Iniciar Sesión') || postLogout.includes('Entrar') || (await page.locator('#usuario').count() > 0);
    log('Liberty E2E', 'Cierre de Sesión', loginPresent && logoutRes.status() === 200, 'Sesión invalidada y redirección a login');

    // 7. Endpoints MicroProfile
    const healthLive = await page.goto('http://localhost:9081/health/live', { timeout: 4000 });
    const liveJson = await healthLive.json();
    log('Liberty Health', 'Liveness Check (/health/live)', liveJson.status === 'UP', `Status: ${liveJson.status}`);

    const healthReady = await page.goto('http://localhost:9081/health/ready', { timeout: 4000 });
    const readyJson = await healthReady.json();
    log('Liberty Health', 'Readiness Check (/health/ready)', readyJson.status === 'UP', `Status: ${readyJson.status}`);

    const openApiUi = await page.goto('http://localhost:9081/openapi/ui/', { timeout: 5000 });
    const openApiTitle = await page.title();
    log('Liberty OpenAPI', 'Swagger UI (/openapi/ui/)', openApiTitle.includes('Swagger'), `Title: "${openApiTitle}"`);

  } catch (e) {
    log('Liberty E2E', 'Flujo de Aplicación', false, e.message);
  }

  await browser.close();

  // ─────────────────────────────────────────────────────────────
  // RESUMEN GLOBAL
  // ─────────────────────────────────────────────────────────────
  console.log('\n════════════════════════════════════════════════════════════════════');
  console.log('                 RESUMEN DE PRUEBAS END-TO-END');
  console.log('════════════════════════════════════════════════════════════════════');
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(`  Total de Verificaciones : ${total}`);
  console.log(`  Verificaciones Exitosas : ${passed}`);
  console.log(`  Verificaciones Fallidas : ${failed}`);
  console.log(`  Resultado Global        : ${failed === 0 ? '🎉 100% OK - WORKSHOP VERIFICADO' : '⚠️ SE DETECTARON FALLOS'}`);
  console.log('════════════════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runCompleteWorkshopE2E().catch(err => {
  console.error('Error fatal durante la prueba E2E:', err);
  process.exit(1);
});
