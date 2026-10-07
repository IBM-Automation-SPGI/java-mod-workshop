/**
 * scripts/_shared.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Utilidades compartidas por todos los scripts Playwright del workshop.
 * Exporta: Reporter, launchBrowser, fetchPage, checkImages, bodyText
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { chromium } from 'playwright';

// ── Reporter ─────────────────────────────────────────────────────────────────

export class Reporter {
  constructor() {
    this.results = [];
    this.currentSection = '';
  }

  section(name) {
    this.currentSection = name;
    console.log(`\n${'─'.repeat(72)}`);
    console.log(`  ${name}`);
    console.log(`${'─'.repeat(72)}`);
  }

  log(testName, passed, detail = '') {
    this.results.push({ section: this.currentSection, testName, passed, detail });
    const mark = passed ? '✅ PASS' : '❌ FAIL';
    const det  = detail ? `  →  ${detail}` : '';
    console.log(`  [${mark}]  ${testName}${det}`);
    return passed;
  }

  summary() {
    const total  = this.results.length;
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;

    const bySection = {};
    for (const r of this.results) {
      if (!bySection[r.section]) bySection[r.section] = { ok: 0, fail: 0 };
      r.passed ? bySection[r.section].ok++ : bySection[r.section].fail++;
    }

    console.log('\n' + '═'.repeat(72));
    console.log('  RESUMEN');
    console.log('═'.repeat(72));
    for (const [sec, counts] of Object.entries(bySection)) {
      const icon = counts.fail === 0 ? '✅' : '⚠️ ';
      console.log(`  ${icon}  ${sec.padEnd(54)} ${String(counts.ok).padStart(3)}✅  ${String(counts.fail).padStart(3)}❌`);
    }
    console.log('─'.repeat(72));
    console.log(`  Total     : ${total}`);
    console.log(`  Pasados   : ${passed}`);
    console.log(`  Fallidos  : ${failed}`);
    if (failed > 0) {
      console.log('\n  ❌  FALLOS:');
      this.results
        .filter(r => !r.passed)
        .forEach(r => console.log(`       • [${r.section}] ${r.testName}${r.detail ? ' → ' + r.detail : ''}`));
    }
    console.log('\n' + (failed === 0
      ? '  🎉  TODAS LAS PRUEBAS PASARON'
      : `  ⚠️   ${failed} PRUEBA(S) FALLARON`));
    console.log('═'.repeat(72) + '\n');
    return failed;
  }
}

// ── Navegador ─────────────────────────────────────────────────────────────────

/** Lanza un navegador Chromium headless con HTTPS ignorado */
export async function launchBrowser() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--ignore-certificate-errors', '--no-sandbox', '--disable-dev-shm-usage'],
  });
  const ctx = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1400, height: 900 },
  });
  return { browser, ctx, page: await ctx.newPage() };
}

// ── Helpers de página ─────────────────────────────────────────────────────────

/** Texto visible del body (innerText) */
export async function bodyText(page) {
  return page.locator('body').innerText().catch(() => '');
}

/** Navega a una URL y devuelve { ok, status, title, body, error } */
export async function fetchPage(page, url, timeout = 12000) {
  try {
    const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout });
    return { ok: true, status: res.status(), title: await page.title(), body: await bodyText(page) };
  } catch (e) {
    return { ok: false, status: 0, title: '', body: '', error: e.message };
  }
}

/** Cuenta imágenes rotas en la página actual */
export async function checkImages(page) {
  const imgs   = await page.$$('img');
  let   broken = 0;
  for (const img of imgs) {
    const complete = await img.evaluate(el => el.complete && el.naturalWidth > 0).catch(() => true);
    if (!complete) broken++;
  }
  return { total: imgs.length, broken };
}
