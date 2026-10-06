/**
 * Playwright — Workshop Navigation Test
 * Recorre todas las páginas del workshop y verifica contenido, navegación y recursos.
 *
 * Uso:
 *   node playwright-workshop-test.js
 */

const { chromium } = require('playwright');

// ── helpers ──────────────────────────────────────────────────────────────────

function pass(msg) { console.log(`  ✅  ${msg}`); }
function fail(msg) { console.error(`  ❌  ${msg}`); }
function info(msg) { console.log(`  ℹ️   ${msg}`); }

let totalChecks = 0;
let failedChecks = 0;

function check(ok, msgOk, msgFail) {
  totalChecks++;
  if (ok) { pass(msgOk); }
  else { fail(msgFail); failedChecks++; }
  return ok;
}

async function checkResources(tab) {
  const failedReqs = [];
  tab.on('response', r => {
    // Ignore external GitHub API calls (e.g. repo stats/releases) which may return 404/403 if repo doesn't have releases yet
    if (r.status() >= 400 && !r.url().includes('api.github.com')) {
      failedReqs.push(`${r.status()} ${r.url()}`);
    }
  });
  await tab.reload({ waitUntil: 'domcontentloaded', timeout: 15000 });
  totalChecks++;
  if (failedReqs.length === 0) pass('Sin recursos rotos');
  else { failedChecks++; failedReqs.forEach(r => fail(`Recurso roto: ${r}`)); }
}

async function checkImages(tab) {
  const images = await tab.$$('img');
  let broken = 0;
  for (const img of images) {
    const ok = await img.evaluate(el => el.complete && el.naturalWidth > 0);
    if (!ok) { fail(`Imagen rota: ${await img.getAttribute('src')}`); broken++; failedChecks++; totalChecks++; }
  }
  if (images.length > 0) check(broken === 0, `Imágenes OK (${images.length})`, '');
  else info('Sin imágenes');
}

async function checkNav(tab) {
  const nav = await tab.$('nav.md-nav--primary, .md-sidebar--primary');
  check(nav !== null, 'Sidebar MkDocs presente', 'Sidebar NO encontrado');
}

async function checkStrings(tab, required) {
  const body = await tab.innerText('body');
  for (const s of required) check(body.includes(s), `Contiene "${s}"`, `FALTA "${s}"`);
}

// ── main ─────────────────────────────────────────────────────────────────────

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });

  try {
    // ── Página de inicio ────────────────────────────────────────────────────
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📄  Página de inicio');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    {
      const tab = await ctx.newPage();
      const r = await tab.goto('http://127.0.0.1:8001/', { waitUntil: 'domcontentloaded', timeout: 15000 });
      check(r.status() === 200, 'HTTP 200 OK', `HTTP ${r.status()}`);
      await checkStrings(tab, ['Workshop de Modernización Java con AMA', 'De tWAS a WebSphere Liberty',
        'PedjasApp', 'Lab 0', 'Lab 1', 'Lab 2', 'Lab 3', 'Lab 4', 'Lab 5']);
      for (const spec of [
        { text: /Lab 0/i, href: /lab0/ }, { text: /Lab 1/i, href: /lab1/ },
        { text: /Lab 2/i, href: /lab2/ }, { text: /Lab 3/i, href: /lab3/ },
        { text: /Lab 4/i, href: /lab4/ }, { text: /Lab 5/i, href: /lab5/ },
      ]) {
        let found = false;
        for (const a of await tab.$$('a')) {
          if (spec.text.test((await a.innerText()) || '') && spec.href.test((await a.getAttribute('href')) || '')) { found = true; break; }
        }
        check(found, `Nav "${spec.text}" OK`, `Nav "${spec.text}" NO encontrado`);
      }
      await checkResources(tab); await checkNav(tab); await checkImages(tab);
      info(`Bloques código: ${(await tab.$$('pre > code')).length}`);
      await tab.close();
    }

    // ── Lab 0 ───────────────────────────────────────────────────────────────
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📄  Lab 0 — Requisitos Previos');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    {
      const tab = await ctx.newPage();
      const r = await tab.goto('http://127.0.0.1:8001/lab0/', { waitUntil: 'domcontentloaded', timeout: 15000 });
      check(r.status() === 200, 'HTTP 200 OK', `HTTP ${r.status()}`);
      await checkStrings(tab, ['Lab 0', 'Requisitos Previos', 'IBM Application Modernization Accelerator',
        'Java JDK', 'Apache Maven', 'Docker', 'git clone', 'mvn clean package']);
      await checkResources(tab); await checkNav(tab); await checkImages(tab);
      info(`Bloques código: ${(await tab.$$('pre > code')).length}`);
      await tab.close();
    }

    // ── Lab 1 ───────────────────────────────────────────────────────────────
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📄  Lab 1 — Despliegue tWAS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    {
      const tab = await ctx.newPage();
      const r = await tab.goto('http://127.0.0.1:8001/lab1/', { waitUntil: 'domcontentloaded', timeout: 15000 });
      check(r.status() === 200, 'HTTP 200 OK', `HTTP ${r.status()}`);
      await checkStrings(tab, ['Lab 1', 'tWAS']);
      await checkResources(tab); await checkNav(tab); await checkImages(tab);
      info(`Bloques código: ${(await tab.$$('pre > code')).length}`);
      await tab.close();
    }

    // ── Lab 2 ───────────────────────────────────────────────────────────────
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📄  Lab 2 — Análisis AMA');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    {
      const tab = await ctx.newPage();
      const r = await tab.goto('http://127.0.0.1:8001/lab2/', { waitUntil: 'domcontentloaded', timeout: 15000 });
      check(r.status() === 200, 'HTTP 200 OK', `HTTP ${r.status()}`);
      await checkStrings(tab, ['Lab 2', 'AMA']);
      await checkResources(tab); await checkNav(tab); await checkImages(tab);
      info(`Bloques código: ${(await tab.$$('pre > code')).length}`);
      await tab.close();
    }

    // ── Lab 3 ───────────────────────────────────────────────────────────────
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📄  Lab 3 — Modernización Manual');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    {
      const tab = await ctx.newPage();
      const r = await tab.goto('http://127.0.0.1:8001/lab3/', { waitUntil: 'domcontentloaded', timeout: 15000 });
      check(r.status() === 200, 'HTTP 200 OK', `HTTP ${r.status()}`);
      await checkStrings(tab, ['Lab 3']);
      await checkResources(tab); await checkNav(tab); await checkImages(tab);
      info(`Bloques código: ${(await tab.$$('pre > code')).length}`);
      await tab.close();
    }

    // ── Lab 3B ──────────────────────────────────────────────────────────────
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📄  Lab 3B — Modernización con Bob');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    {
      const tab = await ctx.newPage();
      const r = await tab.goto('http://127.0.0.1:8001/lab3b/', { waitUntil: 'domcontentloaded', timeout: 15000 });
      check(r.status() === 200, 'HTTP 200 OK', `HTTP ${r.status()}`);
      await checkStrings(tab, ['Lab 3', 'Bob']);
      await checkResources(tab); await checkNav(tab); await checkImages(tab);
      info(`Bloques código: ${(await tab.$$('pre > code')).length}`);
      await tab.close();
    }

    // ── Lab 4 ───────────────────────────────────────────────────────────────
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📄  Lab 4 — Despliegue Liberty');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    {
      const tab = await ctx.newPage();
      const r = await tab.goto('http://127.0.0.1:8001/lab4/', { waitUntil: 'domcontentloaded', timeout: 15000 });
      check(r.status() === 200, 'HTTP 200 OK', `HTTP ${r.status()}`);
      await checkStrings(tab, ['Lab 4', 'Liberty']);
      await checkResources(tab); await checkNav(tab); await checkImages(tab);
      info(`Bloques código: ${(await tab.$$('pre > code')).length}`);
      await tab.close();
    }

    // ── Lab 5 ───────────────────────────────────────────────────────────────
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📄  Lab 5 — Validación');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    {
      const tab = await ctx.newPage();
      const r = await tab.goto('http://127.0.0.1:8001/lab5/', { waitUntil: 'domcontentloaded', timeout: 15000 });
      check(r.status() === 200, 'HTTP 200 OK', `HTTP ${r.status()}`);
      await checkStrings(tab, ['Lab 5']);
      await checkResources(tab); await checkNav(tab); await checkImages(tab);
      info(`Bloques código: ${(await tab.$$('pre > code')).length}`);
      await tab.close();
    }

    // ── Navegación encadenada ────────────────────────────────────────────────
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔗  Navegación encadenada (click enlace → back)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    {
      const tab = await ctx.newPage();
      await tab.goto('http://127.0.0.1:8001/', { waitUntil: 'domcontentloaded', timeout: 15000 });
      for (const route of ['/lab0/', '/lab1/', '/lab2/', '/lab3/', '/lab3b/', '/lab4/', '/lab5/']) {
        // Re-query the link after each goBack() to avoid stale element handles
        const selector = `a[href*="${route}"]`;
        const exists = await tab.$(selector);
        if (exists) {
          await tab.click(selector);
          await tab.waitForLoadState('domcontentloaded', { timeout: 10000 });
          const cur = tab.url();
          check(cur.includes(route), `Navegó a ${route}`, `No navegó a ${route} (actual: ${cur})`);
          await tab.goBack();
          await tab.waitForLoadState('domcontentloaded', { timeout: 10000 });
        } else {
          info(`Sin enlace a ${route} en home (verificado individualmente)`);
        }
      }
      await tab.close();
    }

  } finally {
    await browser.close();
  }

  // ── Resumen ───────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(52));
  console.log('📊  RESULTADO FINAL');
  console.log('═'.repeat(52));
  console.log(`  Total checks : ${totalChecks}`);
  console.log(`  Pasados      : ${totalChecks - failedChecks}`);
  console.log(`  Fallidos     : ${failedChecks}`);
  console.log(failedChecks === 0
    ? '\n🎉  TODAS LAS PRUEBAS PASARON — el workshop está OK'
    : '\n⚠️   ALGUNAS PRUEBAS FALLARON — revisa los errores arriba');
  console.log('═'.repeat(52) + '\n');

  process.exit(failedChecks > 0 ? 1 : 0);
})();
