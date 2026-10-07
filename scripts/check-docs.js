/**
 * scripts/check-docs.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Auditoría completa de la documentación MkDocs del workshop.
 *
 * Qué comprueba:
 *   • HTTP 200 en todas las páginas (ES y EN)
 *   • Presencia de términos clave en cada lab (>10 por página)
 *   • Sidebar MkDocs renderizado
 *   • Al menos 1 bloque de código por lab
 *   • Imágenes no rotas
 *   • Columna ⏱ de duración presente en la portada
 *   • Admonition de duración en cada lab
 *   • Tablas de navegación presentes
 *   • Enlace "Siguiente Paso" en cada lab
 *   • Diagrama Mermaid en las páginas que lo tienen
 *
 * Uso:
 *   node scripts/check-docs.js
 *
 * Requiere MkDocs corriendo en http://127.0.0.1:8001/java-mod-workshop/
 *   mkdocs serve --dev-addr=127.0.0.1:8001
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Reporter, launchBrowser, fetchPage, checkImages } from './_shared.js';

// ── Configuración ─────────────────────────────────────────────────────────────

const BASE    = 'http://127.0.0.1:8001/java-mod-workshop';
const TIMEOUT = 12000;

// Términos clave que deben aparecer en cada página
const LABS_ES = [
  {
    path: '/',
    name: 'Home (ES)',
    required: [
      'Workshop de Modernización Java con AMA',
      'De tWAS a WebSphere Liberty',
      'PedjasApp',
      'Lab 0', 'Lab 1', 'Lab 2', 'Lab 3', 'Lab 4', 'Lab 5', 'Lab 6',
      '⏱',           // columna de duración
      '20–30 min',   // Lab 0 tiempo
      '90–120 min',  // Lab 3 tiempo (el más largo)
    ],
    hasMermaid: true,
    hasNavTable: true,
  },
  {
    path: '/lab0/',
    name: 'Lab 0 (ES)',
    required: [
      'Introducción y Requisitos Previos',
      'IBM Application Modernization Accelerator',
      'Java JDK', 'Apache Maven', 'Podman',
      'git clone', 'mvn clean package',
      'Duración estimada',
      '20–30 minutos',
      'Siguiente',
    ],
    hasMermaid: true,
  },
  {
    path: '/lab1/',
    name: 'Lab 1 (ES)',
    required: [
      'Despliegue de la Aplicación en tWAS',
      'PedjasApp', 'EAR',
      'WebSphere Application Server',
      'icr.io/appcafe/websphere-traditional',
      'podman run', 'podman pull',
      'WSVR0001I',
      'Duración estimada',
      '30–45 minutos',
      'Siguiente',
    ],
  },
  {
    path: '/lab2/',
    name: 'Lab 2 (ES)',
    required: [
      'Análisis con IBM Application Modernization Accelerator',
      'Data Collector',
      'CR-001', 'CR-002', 'CR-003',
      'Jakarta EE',
      'EJB 2.x', 'CMP',
      'ta.binaryAppScanner',
      'Workshop_PedjasApp',
      'Duración estimada',
      '30–45 minutos',
      'Siguiente',
    ],
    hasImages: true,
  },
  {
    path: '/lab3/',
    name: 'Lab 3 (ES)',
    required: [
      'Modernización Manual Guiada por AMA',
      'EJB 2.x', 'JPA', 'EntityBean', '@Entity',
      'ibm-web-bnd.xml', 'com.ibm.websphere',
      '@Resource', 'server.xml',
      'mvn clean package',
      'Duración estimada',
      '90–120 minutos',
      'Siguiente',
    ],
  },
  {
    path: '/lab3b/',
    name: 'Lab 3B (ES)',
    required: [
      'Modernización Asistida con IBM Bob',
      'IBM.bob-java', 'Liberty Modernization',
      'OpenRewrite', 'Premium Package',
      'Duración estimada',
      '20–40 minutos',
      'alternativa',
      'Siguiente',
    ],
  },
  {
    path: '/lab4/',
    name: 'Lab 4 (ES)',
    required: [
      'Despliegue en WebSphere Liberty',
      'server.xml', 'Dockerfile',
      'mpHealth-4.0', 'mpMetrics-5.0',
      'PostgreSQL', 'PEDJASAPP_DB',
      'podman build', 'podman run',
      'admin123', 'pedjas123',
      'Duración estimada',
      '30–45 minutos',
      'Siguiente',
    ],
  },
  {
    path: '/lab5/',
    name: 'Lab 5 (ES)',
    required: [
      'Validación y Siguientes Pasos',
      'admin123',
      'health/live', 'health/ready',
      '/metrics',
      'classloader_loadedClasses_count',
      'jvm_uptime',
      'openapi/ui',
      'Duración estimada',
      '20–30 minutos',
    ],
  },
  {
    path: '/lab6/',
    name: 'Lab 6 (ES)',
    required: [
      'Open Liberty Operator',
      'Kubernetes', 'OpenShift',
      'OpenLibertyApplication',
      'pedjasapp', 'postgres-secret',
      'kubectl apply', 'namespace',
      'Duración estimada',
      '45–60 minutos',
    ],
    hasMermaid: true,
  },
];

const LABS_EN = [
  {
    path: '/en/',
    name: 'Home (EN)',
    required: [
      'Java Modernization Workshop with AMA',
      'From tWAS to WebSphere Liberty',
      'PedjasApp',
      'Lab 0', 'Lab 1', 'Lab 2', 'Lab 3', 'Lab 4', 'Lab 5', 'Lab 6',
      '⏱',
      '20–30 min',
      '90–120 min',
    ],
    hasMermaid: true,
    hasNavTable: true,
  },
  {
    path: '/en/lab0/',
    name: 'Lab 0 (EN)',
    required: [
      'Overview & Prerequisites',
      'IBM Application Modernization Accelerator',
      'Java JDK', 'Apache Maven', 'Podman',
      'git clone', 'mvn clean package',
      'Estimated duration',
      '20–30 minutes',
      'Next',
    ],
    hasMermaid: true,
  },
  {
    path: '/en/lab1/',
    name: 'Lab 1 (EN)',
    required: [
      'Deploying the Application on tWAS',
      'PedjasApp', 'EAR',
      'WebSphere Application Server',
      'icr.io/appcafe/websphere-traditional',
      'podman run', 'podman pull',
      'WSVR0001I',
      'Estimated duration',
      '30–45 minutes',
      'Next',
    ],
  },
  {
    path: '/en/lab2/',
    name: 'Lab 2 (EN)',
    required: [
      'Assessment with IBM Application Modernization Accelerator',
      'Data Collector',
      'CR-001', 'CR-002', 'CR-003',
      'Jakarta EE',
      'EJB 2.x', 'CMP',
      'ta.binaryAppScanner',
      'Workshop_PedjasApp',
      'Estimated duration',
      '30–45 minutes',
      'Next',
    ],
    hasImages: true,
  },
  {
    path: '/en/lab3/',
    name: 'Lab 3 (EN)',
    required: [
      'Manual Modernization Guided by AMA',
      'EJB 2.x', 'JPA', 'EntityBean', '@Entity',
      'ibm-web-bnd.xml', 'com.ibm.websphere',
      '@Resource', 'server.xml',
      'mvn clean package',
      'Estimated duration',
      '90–120 minutes',
      'Next',
    ],
  },
  {
    path: '/en/lab3b/',
    name: 'Lab 3B (EN)',
    required: [
      'AI-Assisted Modernization with IBM Bob',
      'IBM.bob-java', 'Liberty Modernization',
      'OpenRewrite', 'Premium Package',
      'Estimated duration',
      '20–40 minutes',
      'Alternative',
      'Next',
    ],
  },
  {
    path: '/en/lab4/',
    name: 'Lab 4 (EN)',
    required: [
      'Deploying on WebSphere Liberty',
      'server.xml', 'Dockerfile',
      'mpHealth-4.0', 'mpMetrics-5.0',
      'PostgreSQL', 'PEDJASAPP_DB',
      'podman build', 'podman run',
      'admin123', 'pedjas123',
      'Estimated duration',
      '30–45 minutes',
      'Next',
    ],
  },
  {
    path: '/en/lab5/',
    name: 'Lab 5 (EN)',
    required: [
      'Validation and Next Steps',
      'admin123',
      'health/live', 'health/ready',
      '/metrics',
      'classloader_loadedClasses_count',
      'jvm_uptime',
      'openapi/ui',
      'Estimated duration',
      '20–30 minutes',
    ],
  },
  {
    path: '/en/lab6/',
    name: 'Lab 6 (EN)',
    required: [
      'Open Liberty Operator',
      'Kubernetes', 'OpenShift',
      'OpenLibertyApplication',
      'pedjasapp', 'postgres-secret',
      'kubectl apply', 'namespace',
      'Estimated duration',
      '45–60 minutes',
    ],
    hasMermaid: true,
  },
];

// ── Función de auditoría ──────────────────────────────────────────────────────

async function auditLab(page, lab, reporter, base) {
  const url = base + lab.path;
  const p   = await fetchPage(page, url, TIMEOUT);

  // 1. HTTP 200
  if (!p.ok || p.status !== 200) {
    reporter.log(`${lab.name} — HTTP 200`, false, `HTTP ${p.status || 'ERROR'} — ${p.error || ''}`);
    return;
  }
  reporter.log(`${lab.name} — HTTP 200`, true, `"${p.title}"`);

  // 2. Términos clave requeridos (todos en un solo check, lista los que faltan)
  const missing = lab.required.filter(s => !p.body.includes(s));
  reporter.log(
    `${lab.name} — Contenido clave (${lab.required.length} términos)`,
    missing.length === 0,
    missing.length ? `Faltan: ${missing.map(s => `"${s}"`).join(', ')}` : '',
  );

  // 3. Sidebar MkDocs
  const hasSidebar = await page.$('nav.md-nav--primary, .md-sidebar--primary') !== null;
  reporter.log(`${lab.name} — Sidebar MkDocs`, hasSidebar);

  // 4. Bloques de código (≥1)
  const codeCount = await page.locator('pre > code').count();
  reporter.log(`${lab.name} — Bloques código (≥1)`, codeCount >= 1, `${codeCount} bloques`);

  // 5. Imágenes
  if (lab.hasImages) {
    const imgResult = await checkImages(page);
    reporter.log(
      `${lab.name} — Imágenes (${imgResult.total} total, 0 rotas)`,
      imgResult.broken === 0,
      imgResult.broken ? `${imgResult.broken} rota(s)` : '',
    );
  }

  // 6. Diagrama Mermaid
  if (lab.hasMermaid) {
    const mermaidCount = await page.locator('.mermaid, .mermaid-diagram, svg.mermaid-svg').count();
    // MkDocs Material renderiza Mermaid como <div class="mermaid"> o SVG inline
    const hasMermaid = mermaidCount > 0 || p.body.includes('graph ') || p.body.includes('subgraph');
    reporter.log(`${lab.name} — Diagrama Mermaid`, hasMermaid, `${mermaidCount} elementos`);
  }

  // 7. Tabla de navegación (índice del workshop)
  if (lab.hasNavTable) {
    const tableCount = await page.locator('table').count();
    reporter.log(`${lab.name} — Tabla de índice del workshop`, tableCount >= 1, `${tableCount} tabla(s)`);
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

(async () => {
  console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║   CHECK-DOCS — Auditoría completa de documentación MkDocs           ║');
  console.log('║   ES (9 páginas) + EN (9 páginas) · 200+ comprobaciones              ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝');

  const reporter = new Reporter();
  const { browser, page } = await launchBrowser();

  try {
    // ── Español ─────────────────────────────────────────────────────────────
    reporter.section('📚  DOCUMENTACIÓN — ESPAÑOL');
    for (const lab of LABS_ES) {
      await auditLab(page, lab, reporter, BASE);
    }

    // ── Inglés ──────────────────────────────────────────────────────────────
    reporter.section('📚  DOCUMENTATION — ENGLISH');
    for (const lab of LABS_EN) {
      await auditLab(page, lab, reporter, BASE);
    }

    // ── Navegación encadenada ES ─────────────────────────────────────────────
    // Los hrefs de MkDocs son relativos (e.g. "lab0/") — buscamos tanto rutas absolutas
    // como relativas para ser robustos frente a distintas configuraciones de base.
    reporter.section('🔗  NAVEGACIÓN ENCADENADA — ESPAÑOL');
    {
      const routes = ['lab0', 'lab1', 'lab2', 'lab3', 'lab3b', 'lab4', 'lab5', 'lab6'];
      await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
      for (const route of routes) {
        // Buscar enlace que contenga el segmento de ruta, ya sea relativo o absoluto
        const selector = `a[href*="${route}/"]`;
        const link = await page.$(selector);
        if (link) {
          await link.click();
          await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
          const urlHasRoute = page.url().includes(route);
          reporter.log(`Click enlace → /${route}/`, urlHasRoute, page.url());
          await page.goBack();
          await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
        } else {
          reporter.log(`Enlace a /${route}/ en home`, false, 'No encontrado — comprueba el selector');
        }
      }
    }

    // ── Navegación encadenada EN ─────────────────────────────────────────────
    reporter.section('🔗  CHAINED NAVIGATION — ENGLISH');
    {
      const routes = ['/en/lab0/', '/en/lab1/', '/en/lab2/', '/en/lab3/', '/en/lab3b/', '/en/lab4/', '/en/lab5/', '/en/lab6/'];
      await page.goto(BASE + '/en/', { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
      for (const route of routes) {
        const p = await fetchPage(page, BASE + route, TIMEOUT);
        reporter.log(`GET ${route} — HTTP 200`, p.ok && p.status === 200, `Status ${p.status}`);
      }
    }

  } finally {
    await browser.close();
  }

  const failed = reporter.summary();
  process.exit(failed > 0 ? 1 : 0);
})();
