---
name: ux-ui-java-workshop
description: >
  Mejora integral de UX/UI de la aplicación PedjasApp Liberty (JSP + Jakarta EE 10).
  Audita automáticamente toda la base de código, aplica estándares WCAG 2.2 AA, Material Design,
  Nielsen heurísticas, design tokens centralizados, modo oscuro, accesibilidad completa,
  consistencia visual entre todas las vistas y genera un reporte final de cambios.
  Úsala cuando quieras mejorar la interfaz, corregir problemas de accesibilidad, unificar estilos,
  crear la hoja de tokens CSS centralizada o cuando el usuario diga "mejora la UI", "audita la UX",
  "accesibilidad", "design tokens", "modo oscuro", "estilo consistente" o "refactoriza los JSP".
---

# Skill: Mejora UX/UI Integral — PedjasApp Liberty

## Contexto de la aplicación

**Stack detectado:**
- Back-end: Jakarta EE 10, Open Liberty, JSP 3.1 + JSTL 3.0
- Vistas: `inicio.jsp`, `catalogo.jsp`, `pedidos.jsp`, `error404.jsp`, `error500.jsp`
  — todas en `pedjasapp-liberty/src/main/webapp/views/`
- Estilos de la app: CSS inline en cada JSP (sin hoja compartida)
- Estilos de documentación: `docs/styles/custom.css` y `docs/styles/override-print.css`
- Tipografía: IBM Plex Sans (Google Fonts)
- Paleta base: IBM Carbon (azul `#0f62fe`, gris `#161616`, verde `#198038`, rojo `#da1e28`)
- Documentación: MkDocs Material

---

## Paso 0 — Auditoría inicial automática

Ejecuta el script de diagnóstico para obtener el inventario completo del estado actual:

```bash
bash .bob/skills/ux-ui-java-workshop/audit-ux.sh
```

Lee la salida completa del script. A continuación realiza también estas comprobaciones manuales
con las herramientas de lectura:

1. Lee cada JSP con `read_file` para verificar:
   - Si existe un `<link>` a una hoja CSS compartida (actualmente NO existe)
   - Si todos los tokens CSS `:root {}` son idénticos o divergen entre vistas
   - Si hay atributos `aria-*` y `role=` en elementos interactivos
   - Si existe un enlace de "saltar al contenido" (`skip to content`) al inicio del `<body>`
   - Si los botones de formulario tienen `type="submit"` explícito
   - Si las imágenes decorativas tienen `alt=""`

2. Genera la **tabla de diagnóstico** con este formato antes de aplicar cambios:

| Vista / Fichero | Problema | Estándar vulnerado | Severidad |
|---|---|---|---|
| `pedidos.jsp` | CSS completamente diferente, sin tokens | Design Tokens / Consistencia | 🔴 Alta |
| `error404.jsp` | Arial en lugar de IBM Plex Sans, sin sistema de diseño | Consistencia / Marca | 🔴 Alta |
| `error500.jsp` | Igual que error404, sin accesibilidad | WCAG 1.3.1, Consistencia | 🔴 Alta |
| Todas las vistas | CSS duplicado (±300 líneas repetidas por fichero) | Mantenibilidad / DRY | 🔴 Alta |
| `catalogo.jsp` | Emojis como iconos sin `aria-hidden="true"` | WCAG 1.1.1 | 🟡 Media |
| `inicio.jsp` | Sin `autocomplete` en campo contraseña correcto | WCAG 1.3.5 | 🟡 Media |
| Todas las vistas | Sin `prefers-color-scheme` (modo oscuro) | Accesibilidad / UX moderno | 🟡 Media |
| Todas las vistas | Sin `focus-visible` explícito para teclado | WCAG 2.4.7 | 🔴 Alta |
| Todas las vistas | Sin `:focus-visible` ring en botones y enlaces | WCAG 2.4.11 (2.2) | 🔴 Alta |
| `pedidos.jsp` | Estados de pedido con colores sin contraste suficiente (`#f1c21b` sobre blanco) | WCAG 1.4.3 | 🔴 Alta |
| `catalogo.jsp` | Input de cantidad sin `<label>` visible (solo `aria-label`) | WCAG 1.3.1 | 🟡 Media |
| Todas las vistas | Sin `<main>` landmark semántico | WCAG 1.3.6 / ARIA | 🟡 Media |
| Todas las vistas | Sin skip-to-content | WCAG 2.4.1 | 🔴 Alta |

---

## Paso 1 — Crear el fichero de design tokens centralizado

### 1.1 Crear la hoja de tokens

Crea el fichero `pedjasapp-liberty/src/main/webapp/styles/tokens.css` con el siguiente contenido
**completo**. Este será el único origen de verdad para todos los tokens de diseño:

```css
/* =========================================================
   PedjasApp Liberty — Design Tokens Centralizados
   Basados en IBM Carbon Design System + WCAG 2.2 AA
   =========================================================
   Cómo usarlo: <link rel="stylesheet" href="../styles/tokens.css">
   en cada JSP (ruta relativa desde /views/)
   ========================================================= */

/* ── Modo claro (por defecto) ─────────────────────────── */
:root {
  /* Colores primarios — IBM Carbon Blue */
  --color-primary-60:  #0043ce;
  --color-primary-50:  #0f62fe;
  --color-primary-40:  #4589ff;
  --color-primary-30:  #a6c8ff;
  --color-primary-10:  #edf5ff;

  /* Grises IBM Carbon */
  --color-gray-100: #161616;
  --color-gray-90:  #262626;
  --color-gray-80:  #393939;
  --color-gray-70:  #525252;
  --color-gray-50:  #8d8d8d;
  --color-gray-30:  #c6c6c6;
  --color-gray-20:  #e0e0e0;
  --color-gray-10:  #f4f4f4;

  /* Semánticos — Estado */
  --color-success-60: #0e6027;
  --color-success-50: #198038;
  --color-success-40: #24a148;
  --color-success-10: #defbe6;

  --color-danger-60:  #a2191f;
  --color-danger-50:  #da1e28;
  --color-danger-10:  #fff1f1;

  --color-warning-50: #f1c21b;
  --color-warning-10: #fdf6dd;

  --color-info-50:    #0043ce;
  --color-info-10:    #edf5ff;

  /* Superficies */
  --surface-page:        #f4f7fb;
  --surface-card:        #ffffff;
  --surface-overlay:     rgba(22, 22, 22, 0.5);
  --surface-header:      #161616;
  --surface-footer:      #ffffff;
  --surface-input:       #ffffff;
  --surface-input-hover: #f4f7fb;

  /* Texto */
  --text-primary:   #161616;
  --text-secondary: #525252;
  --text-disabled:  #8d8d8d;
  --text-on-dark:   #ffffff;
  --text-on-primary:#ffffff;
  --text-link:      var(--color-primary-50);
  --text-link-hover:var(--color-primary-60);

  /* Bordes */
  --border-subtle:  #e0e0e0;
  --border-strong:  #8d8d8d;
  --border-focus:   var(--color-primary-50);
  --border-input:   #d1d5db;
  --border-radius-sm: 4px;
  --border-radius-md: 6px;
  --border-radius-lg: 10px;
  --border-radius-xl: 12px;
  --border-radius-pill: 9999px;

  /* Sombras */
  --shadow-sm:  0 2px 6px rgba(0,0,0,0.05);
  --shadow-md:  0 4px 16px rgba(0,0,0,0.08);
  --shadow-lg:  0 10px 25px -5px rgba(15,98,254,0.12), 0 8px 10px -6px rgba(0,0,0,0.05);
  --shadow-focus: 0 0 0 3px rgba(15,98,254,0.35);

  /* Tipografía — escala modular (ratio 1.25) */
  --font-family-sans:  'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-family-mono:  'IBM Plex Mono', 'Fira Code', 'Courier New', monospace;

  --font-size-xs:   0.75rem;   /*  12px */
  --font-size-sm:   0.875rem;  /*  14px */
  --font-size-base: 1rem;      /*  16px */
  --font-size-lg:   1.125rem;  /*  18px */
  --font-size-xl:   1.25rem;   /*  20px */
  --font-size-2xl:  1.5rem;    /*  24px */
  --font-size-3xl:  1.875rem;  /*  30px */
  --font-size-4xl:  2.25rem;   /*  36px */

  --font-weight-regular: 400;
  --font-weight-medium:  500;
  --font-weight-semibold:600;
  --font-weight-bold:    700;

  --line-height-tight:  1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed:1.75;

  /* Espaciado — escala de 4px */
  --space-1:  0.25rem;  /*  4px */
  --space-2:  0.5rem;   /*  8px */
  --space-3:  0.75rem;  /* 12px */
  --space-4:  1rem;     /* 16px */
  --space-5:  1.25rem;  /* 20px */
  --space-6:  1.5rem;   /* 24px */
  --space-8:  2rem;     /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */

  /* Layout */
  --content-max-width: 1200px;
  --card-max-width:    440px;

  /* Animaciones */
  --transition-fast:   0.15s ease-in-out;
  --transition-normal: 0.2s ease-in-out;
  --transition-slow:   0.3s ease-in-out;

  /* z-index */
  --z-dropdown: 100;
  --z-modal:    1000;
  --z-toast:    1100;
  --z-skip:     9999;
}

/* ── Modo oscuro ──────────────────────────────────────── */
@media (prefers-color-scheme: dark) {
  :root {
    --surface-page:        #161616;
    --surface-card:        #262626;
    --surface-header:      #0a0a0a;
    --surface-footer:      #262626;
    --surface-input:       #393939;
    --surface-input-hover: #474747;

    --text-primary:   #f4f4f4;
    --text-secondary: #c6c6c6;
    --text-disabled:  #6f6f6f;

    --border-subtle:  #393939;
    --border-strong:  #6f6f6f;
    --border-input:   #6f6f6f;

    --color-primary-50: #78a9ff;
    --color-primary-40: #a6c8ff;
    --color-primary-10: #1c2f4d;

    --shadow-sm:  0 2px 6px rgba(0,0,0,0.3);
    --shadow-md:  0 4px 16px rgba(0,0,0,0.4);
    --shadow-lg:  0 10px 25px -5px rgba(0,0,0,0.5);
  }
}

/* ── Reset y base ─────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; }

/* Skip-to-content: WCAG 2.4.1 */
.skip-to-content {
  position: absolute;
  top: var(--space-2);
  left: var(--space-2);
  background: var(--color-primary-50);
  color: var(--text-on-primary);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  text-decoration: none;
  z-index: var(--z-skip);
  transform: translateY(-200%);
  transition: transform var(--transition-fast);
}
.skip-to-content:focus {
  transform: translateY(0);
}

/* Focus visible global: WCAG 2.4.7 + 2.4.11 */
:focus-visible {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
}
:focus:not(:focus-visible) {
  outline: none;
}

/* ── Componentes compartidos ─────────────────────────── */

/* Header */
.app-header {
  background: linear-gradient(90deg, var(--surface-header) 0%, var(--color-primary-60) 100%);
  color: var(--text-on-dark);
  padding: var(--space-4) var(--space-10);
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0,0,0,0.15);
  gap: var(--space-4);
}

.app-header__brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  color: var(--text-on-dark);
  text-decoration: none;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  letter-spacing: -0.3px;
  transition: opacity var(--transition-normal);
}
.app-header__brand:hover { opacity: 0.88; }
.app-header__brand:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 3px;
  border-radius: var(--border-radius-sm);
}

.app-header__brand svg {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
}

.app-badge {
  display: inline-flex;
  align-items: center;
  background: rgba(36, 161, 72, 0.22);
  color: #42be65;
  border: 1px solid rgba(36, 161, 72, 0.5);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--border-radius-pill);
  letter-spacing: 0.5px;
  text-transform: uppercase;
  line-height: 1;
}

/* Navegación del header */
.app-nav {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.app-nav__greeting {
  color: var(--color-primary-30);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.app-nav__greeting svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  aria-hidden: true;
}

.app-nav__link {
  color: var(--text-on-dark);
  text-decoration: none;
  font-size: var(--font-size-sm);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--border-radius-md);
  background: rgba(255,255,255,0.10);
  transition: background var(--transition-normal), transform var(--transition-fast);
  font-weight: var(--font-weight-medium);
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}
.app-nav__link:hover {
  background: rgba(255,255,255,0.20);
  transform: translateY(-1px);
}
.app-nav__link:active { transform: translateY(0); }
.app-nav__link:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 2px;
}

.app-nav__link--danger {
  background: rgba(218, 30, 40, 0.28);
  border: 1px solid rgba(218, 30, 40, 0.45);
}
.app-nav__link--danger:hover { background: rgba(218, 30, 40, 0.50); }

/* Contenido principal */
.app-main {
  max-width: var(--content-max-width);
  width: 100%;
  margin: var(--space-8) auto;
  padding: 0 var(--space-6);
  flex: 1;
}

/* Pie de página */
.app-footer {
  text-align: center;
  padding: var(--space-4);
  color: var(--text-secondary);
  font-size: var(--font-size-xs);
  border-top: 1px solid var(--border-subtle);
  background: var(--surface-footer);
  margin-top: var(--space-8);
}

/* Tarjeta genérica */
.card {
  background: var(--surface-card);
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-subtle);
  overflow: hidden;
}

/* Alertas / notificaciones */
.alert {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-4);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  margin-bottom: var(--space-5);
}
.alert svg { width: 18px; height: 18px; flex-shrink: 0; margin-top: 1px; }

.alert--error {
  background: var(--color-danger-10);
  color: var(--color-danger-50);
  border-left: 4px solid var(--color-danger-50);
}
.alert--success {
  background: var(--color-success-10);
  color: var(--color-success-60);
  border-left: 4px solid var(--color-success-50);
}
.alert--warning {
  background: var(--color-warning-10);
  color: #7a5200; /* contraste AA sobre fondo amarillo claro */
  border-left: 4px solid var(--color-warning-50);
}
.alert--info {
  background: var(--color-info-10);
  color: var(--color-info-50);
  border-left: 4px solid var(--color-info-50);
}

/* Formularios */
.form-group { margin-bottom: var(--space-5); }

.form-label {
  display: block;
  margin-bottom: var(--space-2);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
}

.form-input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1.5px solid var(--border-input);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-base);
  font-family: var(--font-family-sans);
  background: var(--surface-input);
  color: var(--text-primary);
  transition: border-color var(--transition-normal), box-shadow var(--transition-normal);
}
.form-input:hover { border-color: var(--border-strong); }
.form-input:focus {
  outline: none;
  border-color: var(--border-focus);
  box-shadow: var(--shadow-focus);
  background: var(--surface-card);
}
.form-input::placeholder { color: var(--text-disabled); }
.form-input:disabled {
  background: var(--surface-input-hover);
  cursor: not-allowed;
  opacity: 0.65;
}

/* Botones */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border: none;
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-family-sans);
  cursor: pointer;
  transition: all var(--transition-normal);
  text-decoration: none;
  white-space: nowrap;
  line-height: 1;
}
.btn:focus-visible { outline: 2px solid var(--border-focus); outline-offset: 2px; }
.btn:disabled { opacity: 0.55; cursor: not-allowed; pointer-events: none; }

.btn--primary {
  background: var(--color-primary-50);
  color: var(--text-on-primary);
  box-shadow: 0 2px 8px rgba(15,98,254,0.25);
}
.btn--primary:hover {
  background: var(--color-primary-60);
  box-shadow: 0 4px 14px rgba(15,98,254,0.35);
  transform: translateY(-1px);
}
.btn--primary:active { transform: translateY(0); box-shadow: none; }

.btn--success {
  background: var(--color-success-50);
  color: var(--text-on-primary);
  box-shadow: 0 2px 6px rgba(25,128,56,0.22);
}
.btn--success:hover {
  background: var(--color-success-60);
  box-shadow: 0 4px 10px rgba(25,128,56,0.32);
  transform: translateY(-1px);
}
.btn--success:active { transform: translateY(0); }

.btn--sm {
  padding: var(--space-2) var(--space-3);
  font-size: var(--font-size-sm);
  height: 34px;
}

.btn--full { width: 100%; }

/* Tablas */
.data-table-wrap {
  background: var(--surface-card);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-subtle);
  overflow: hidden;
  margin-top: var(--space-4);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.data-table th {
  background: var(--surface-page);
  color: var(--text-secondary);
  padding: var(--space-3) var(--space-5);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.6px;
  border-bottom: 2px solid var(--border-subtle);
}

.data-table td {
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--border-subtle);
  font-size: var(--font-size-sm);
  vertical-align: middle;
  color: var(--text-primary);
}

.data-table tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover td { background: var(--color-primary-10); }

/* Empty state (estado vacío) */
.empty-state {
  text-align: center;
  padding: var(--space-12) var(--space-8);
  color: var(--text-secondary);
}
.empty-state__icon { font-size: var(--font-size-4xl); margin-bottom: var(--space-4); line-height: 1; }
.empty-state__icon svg { width: 48px; height: 48px; opacity: 0.4; }
.empty-state__text { font-size: var(--font-size-base); margin-top: var(--space-2); }

/* Badges de categoría */
.tag {
  display: inline-flex;
  align-items: center;
  background: var(--color-primary-10);
  color: var(--color-primary-60);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--border-radius-pill);
  border: 1px solid var(--color-primary-30);
  letter-spacing: 0.2px;
}

/* Badges de stock */
.stock-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-xs);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--border-radius-pill);
}
.stock-badge--ok    { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
.stock-badge--low   { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
.stock-badge--out   { background: var(--color-gray-10); color: var(--text-secondary); border: 1px solid var(--border-subtle); }

/* Estados de pedido — contraste AA garantizado */
.estado-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--border-radius-pill);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.3px;
}
.estado-badge--PENDIENTE  { background: #fdf6dd; color: #7a5200; border: 1px solid #f1c21b; }
.estado-badge--PROCESADO  { background: var(--color-primary-10); color: var(--color-primary-60); border: 1px solid var(--color-primary-30); }
.estado-badge--ENVIADO    { background: #f5f0ff; color: #5b21b6; border: 1px solid #c4b5fd; }
.estado-badge--ENTREGADO  { background: var(--color-success-10); color: var(--color-success-60); border: 1px solid #86efac; }
.estado-badge--CANCELADO  { background: var(--color-danger-10); color: var(--color-danger-60); border: 1px solid #fca5a5; }

/* ── Páginas de error ─────────────────────────────────── */
.error-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: var(--space-12) var(--space-6);
  text-align: center;
}
.error-page__code {
  font-size: clamp(4rem, 10vw, 6rem);
  font-weight: var(--font-weight-bold);
  line-height: 1;
  margin-bottom: var(--space-4);
  color: var(--color-primary-50);
}
.error-page__code--danger { color: var(--color-danger-50); }
.error-page__title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); margin-bottom: var(--space-3); }
.error-page__desc  { color: var(--text-secondary); font-size: var(--font-size-base); max-width: 480px; margin: 0 auto var(--space-8); }

/* ── Utilidades de accesibilidad ─────────────────────── */
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* ── Responsive ──────────────────────────────────────── */
@media (max-width: 768px) {
  .app-header {
    padding: var(--space-3) var(--space-4);
    flex-wrap: wrap;
  }
  .app-nav { gap: var(--space-2); }
  .app-nav__greeting { display: none; }
  .app-main { padding: 0 var(--space-4); margin: var(--space-6) auto; }

  .data-table th,
  .data-table td { padding: var(--space-3) var(--space-3); }

  .data-table .prod-desc { display: none; } /* oculta descripción en móvil */
}

@media (max-width: 480px) {
  .app-nav__link { padding: var(--space-2); font-size: var(--font-size-xs); }
  .data-table .prod-id { display: none; }
}
```

### 1.2 Registrar el `<link>` en cada JSP

Añade en el `<head>` de **todos** los JSP, justo antes del `<style>` inline existente (o sustituyendo los estilos inline si se hace la refactorización completa):

```html
<link rel="stylesheet" href="${pageContext.request.contextPath}/styles/tokens.css">
```

> **Nota de ruta:** El servlet de Liberty sirve recursos estáticos desde `webapp/`. El fichero
> `webapp/styles/tokens.css` quedará accesible en `/[contexto]/styles/tokens.css`.

---

## Paso 2 — Refactorizar `pedidos.jsp` (prioridad alta)

Esta es la vista con mayor divergencia estilística. Aplica estos cambios exactos:

### Cambios obligatorios:

1. Añadir `<meta name="viewport">` (actualmente ausente).
2. Añadir `<link>` a `tokens.css`.
3. Reemplazar todos los estilos inline por clases del sistema de tokens.
4. Añadir `<main id="main-content">` como landmark ARIA.
5. Añadir skip-to-content link.
6. Reemplazar los `span.estado-*` por `span.estado-badge estado-badge--ESTADO`.
7. Tabla: añadir `scope="col"` a cada `<th>` y `class="data-table"`.
8. Estado vacío: usar clase `.empty-state` con enlace al catálogo.
9. Notificación de éxito: usar clase `.alert alert--success` con SVG accesible.
10. Añadir `role="status"` al div de éxito para que los lectores de pantalla lo anuncien.
11. Añadir columna de desglose de líneas (opcional, solo si el modelo de datos `Pedido` lo expone).

---

## Paso 3 — Refactorizar `error404.jsp` y `error500.jsp` (prioridad alta)

Reemplazar el CSS independiente por tokens.css y aplicar la clase `.error-page`:

```jsp
<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PedjasApp Liberty — [404 Página no encontrada | 500 Error interno]</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${pageContext.request.contextPath}/styles/tokens.css">
  <style>
    body {
      font-family: var(--font-family-sans);
      background: var(--surface-page);
      color: var(--text-primary);
      margin: 0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
  </style>
</head>
<body>
  <a href="#main-content" class="skip-to-content">Saltar al contenido principal</a>
  <header class="app-header" role="banner">
    <a href="${pageContext.request.contextPath}/catalogo" class="app-header__brand">
      <!-- SVG del carrito aquí -->
      PedjasApp
      <span class="app-badge">Liberty</span>
    </a>
  </header>
  <main id="main-content" class="error-page">
    <div class="error-page__code [error-page__code--danger para 500]">[404|500]</div>
    <h1 class="error-page__title">[Página no encontrada | Error interno del servidor]</h1>
    <p class="error-page__desc">[Mensaje descriptivo]</p>
    <a href="${pageContext.request.contextPath}/catalogo" class="btn btn--primary">
      Volver al catálogo
    </a>
  </main>
  <footer class="app-footer" role="contentinfo">
    Java Modernization Workshop — WebSphere Liberty 26.0.0.9 &amp; Jakarta EE 10
  </footer>
</body>
</html>
```

---

## Paso 4 — Mejoras en `inicio.jsp` y `catalogo.jsp`

### Para ambas vistas:
- Añadir `<a href="#main-content" class="skip-to-content">` como primer elemento dentro de `<body>`.
- Añadir `<main id="main-content" ...>` como wrapper semántico.
- Añadir `role="banner"` al `<header>` y `role="contentinfo"` al `<footer>`.
- Sustituir emojis de iconos por SVGs con `aria-hidden="true"` (ver íconos en Paso 6).
- Eliminar los bloques `:root {}` locales y el CSS duplicado, dejando solo el `<link>` a `tokens.css`.
- Añadir `<link>` a Google Fonts **solo** si no estará ya cargado vía tokens (considera extraerlo a un fragmento compartido).

### Para `inicio.jsp` específicamente:
- El botón de submit: añadir `aria-live="polite"` en el contenedor del formulario para anunciar errores dinámicamente.
- El bloque de error: añadir `role="alert"` para lectores de pantalla.
- El `<input>` de contraseña: ya tiene `autocomplete="current-password"` ✅, mantenerlo.
- Añadir `<button type="submit" id="btnEntrar" ... aria-describedby="loginHint">`.
- Añadir `<p id="loginHint" class="visually-hidden">Introduce tus credenciales de acceso</p>`.

### Para `catalogo.jsp` específicamente:
- Añadir `<caption class="visually-hidden">` a la tabla con texto descriptivo.
- Añadir `scope="col"` a todos los `<th>`.
- El `<select>` de categorías: ya tiene `id` y `for` ✅, mantenerlo.
- El formulario de filtros: añadir `role="search"` y `aria-label="Filtrar productos por categoría"`.
- Los inputs de cantidad: ya tienen `aria-label` ✅, verificar que se mantiene.

---

## Paso 5 — Reemplazar emojis por SVGs accesibles

Los emojis usados como iconos de UI carecen de alternativa textual y no son controlables por CSS.
Sustituirlos por SVGs inline con `aria-hidden="true"` o `<title>` accesible.

### SVGs mínimos para la aplicación:

**Carrito (brand):**
```html
<svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 32 32" fill="currentColor" width="22" height="22">
  <path d="M11 25a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm12 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>
  <path d="M31 4H6.74L6 1H1v2h3.26L10 20.74 9 24H29v-2H10.86l.86-3H27z"/>
</svg>
```

**Usuario (navegación):**
```html
<svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 32 32" fill="currentColor" width="16" height="16">
  <path d="M16 4a6 6 0 1 1 0 12A6 6 0 0 1 16 4zm0 14c6.627 0 12 2.686 12 6v2H4v-2c0-3.314 5.373-6 12-6z"/>
</svg>
```

**Alerta/Error:**
```html
<svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 32 32" fill="currentColor" width="18" height="18">
  <path d="M16 2L2 28h28L16 2zm-1 10h2v8h-2V12zm1 12a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
</svg>
```

**Check / Éxito:**
```html
<svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 32 32" fill="currentColor" width="18" height="18">
  <path d="M13 24L4 15l1.4-1.4L13 21.2 26.6 7.6 28 9z"/>
</svg>
```

**Paquete / Pedidos:**
```html
<svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 32 32" fill="currentColor" width="16" height="16">
  <path d="M29 7.586L16 1 3 7.586V23l13 7 13-7V7.586zM16 3.236L26.764 8.5 16 13.764 5.236 8.5 16 3.236zM5 10.264l10 5.382V26.72L5 21.338V10.264zm12 5.382l10-5.382v11.074L17 26.72V15.646z"/>
</svg>
```

---

## Paso 6 — Auditoría de contraste WCAG 1.4.3

Verifica estos pares críticos (ratio mínimo 4.5:1 para texto normal, 3:1 para texto grande):

| Par | Ratio aproximado | Estado WCAG AA |
|---|---|---|
| `#42be65` sobre `rgba(36,161,72,0.25)` (badge Liberty header) | ~2.3:1 | ❌ Falla — cambiar texto a `#ffffff` o fondo más oscuro |
| `#f1c21b` (amarillo) sobre `#ffffff` — estado PENDIENTE (original) | ~1.8:1 | ❌ Falla — usar `.estado-badge--PENDIENTE` del tokens.css |
| `#15803d` sobre `#f0fdf4` — stock ok | ~5.8:1 | ✅ Pasa |
| `#b91c1c` sobre `#fef2f2` — stock bajo | ~5.1:1 | ✅ Pasa |
| `#0f62fe` sobre `#ffffff` — texto primario | ~4.7:1 | ✅ Pasa |
| `#64748b` sobre `#ffffff` — texto secundario | ~4.6:1 | ✅ Pasa (justo) |
| `#d0e2ff` sobre gradiente header | ~3.2:1 | ⚠️  Solo pasa para texto grande (18px+) — cambiar a `#fff` |

**Acción:** El badge del header (`#42be65` sobre fondo semitransparente) debe cambiar el color de
texto a blanco o el fondo a `rgba(36, 161, 72, 0.6)` para garantizar contraste.

---

## Paso 7 — Validación final

Ejecuta el script de auditoría de nuevo para verificar que los cambios corrigen los problemas:

```bash
bash .bob/skills/ux-ui-java-workshop/audit-ux.sh
```

Luego verifica manualmente:

1. **Navegación solo con teclado:** Tab a través de todos los elementos interactivos, verificar
   `focus-visible` visible en todos.
2. **Skip link:** Tab desde el inicio de la página en `inicio.jsp`, debe aparecer el skip link.
3. **ARIA landmarks:** abrir DevTools → Accessibility tree → confirmar `banner`, `main`, `contentinfo`.
4. **Contraste:** con las DevTools de Chrome (Lighthouse > Accessibility) o axe extension.
5. **Responsive:** reducir ventana a 375px, verificar que el header no se rompe.
6. **Modo oscuro:** activar `prefers-color-scheme: dark` en DevTools, verificar tokens oscuros.

---

## Paso 8 — Generar reporte final

Al finalizar todos los cambios, genera un reporte con este formato exacto:

```markdown
## Reporte de Mejoras UX/UI — PedjasApp Liberty
**Fecha:** [fecha actual]
**Estándar base:** WCAG 2.2 AA, IBM Carbon Design System, Nielsen Norman 10 Heurísticas

### Cambios aplicados

#### Tokens y arquitectura CSS
- [ ] Creado `webapp/styles/tokens.css` con N tokens de diseño
- [ ] Hoja de tokens enlazada en X vistas JSP

#### Accesibilidad (WCAG)
- [ ] Skip-to-content añadido en X vistas (WCAG 2.4.1)
- [ ] focus-visible definido globalmente (WCAG 2.4.7)
- [ ] role="alert" en mensajes de error dinámicos (WCAG 4.1.3)
- [ ] scope="col" en todas las tablas (WCAG 1.3.1)
- [ ] aria-hidden="true" en emojis/iconos decorativos (WCAG 1.1.1)
- [ ] Contraste del badge Liberty header corregido (WCAG 1.4.3)
- [ ] Estado PENDIENTE: contraste AA garantizado (WCAG 1.4.3)
- [ ] Landmarks semánticos: banner, main, contentinfo (WCAG 1.3.6)

#### Consistencia visual
- [ ] pedidos.jsp alineado visualmente con catalogo.jsp
- [ ] error404.jsp refactorizado con sistema de diseño
- [ ] error500.jsp refactorizado con sistema de diseño
- [ ] Estados de pedido usando badges con contraste AA

#### Modo oscuro
- [ ] tokens.css implementa @media (prefers-color-scheme: dark)

### Archivos modificados
| Archivo | Tipo de cambio |
|---|---|
| ... | ... |

### Problemas pendientes (requieren confirmación del equipo)
- ...
```

---

## Restricciones a respetar

- **No alterar lógica de negocio:** Los servlets, servicios JPA y entidades Java no deben modificarse.
- **No eliminar clases existentes** de los JSP sin añadir las nuevas equivalentes — los cambios son
  aditivos siempre que sea posible.
- **Compatibilidad:** JSP 3.1, JSTL 3.0, Jakarta EE 10 — sin dependencias JavaScript externas.
- **Identidad de marca:** Mantener IBM Plex Sans, paleta IBM Carbon Blue, gradiente del header.
- **Ruta de recursos estáticos:** `${pageContext.request.contextPath}/styles/tokens.css` — este
  path funciona en Liberty con el layout `webapp/styles/`.
