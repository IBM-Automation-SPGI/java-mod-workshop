---
name: ibm-workshop-creator
description: Guides and generates complete project scaffolding, bilingual content (EN/ES), sample application code, and IBM Carbon Design System styling for interactive technical workshops for any IBM product (WebSphere, Instana, watsonx, MQ, OpenShift, App Connect, etc.) following official IBM Client Engineering standards.
---

# IBM Workshop Creator

This skill guides you through structuring, authoring, styling, and validating step-by-step interactive technical workshops for any IBM technology or product, strictly adhering to IBM Client Engineering design, architecture, and documentation standards.

---

## 1. Standard IBM Workshop Directory Hierarchy

Every technical workshop must follow this directory and file hierarchy:

```text
workshop-name/
├── mkdocs.yml                  # MkDocs Material configuration with i18n support (en/es) and Light/Dark toggle
├── requirements.txt            # Python dependencies (mkdocs, mkdocs-material, mkdocs-static-i18n, pillow, cairosvg)
├── docker-compose.yml          # Multi-container local orchestration (Backing services, Database, Application)
├── verify-lab.sh               # Color-coded automated verification script (lab0..labN or all)
├── fast-track.sh               # Fast-forward synchronization script for jump-starting specific labs
├── docs/                       # Workshop guides and technical documentation
│   ├── index.md & index.en.md  # Landing page, AS-IS / TO-BE architecture diagrams, prerequisites
│   ├── lab0/                   # Prerequisites & environment verification
│   ├── lab1/                   # Baseline / legacy workload deployment & telemetry discovery
│   ├── lab2/                   # Static analysis / scanning using IBM products (e.g. AMA, Instana)
│   ├── lab3/                   # Guided manual modernization / configuration
│   ├── lab3b/                  # AI-assisted modernization (IBM Bob / watsonx Code Assistant)
│   ├── lab4/                   # Target solution containerization & deployment
│   ├── lab5/                   # End-to-end validation, health checks & observability
│   ├── lab6/                   # (Optional) Cloud-Native orchestration on Kubernetes / OpenShift
│   └── styles/
│       └── custom.css          # IBM Carbon Design System color tokens and responsive styles
└── <app-src>/                  # Application source code (e.g., legacy monolith and modernized service)
```

---

## 2. IBM Carbon Design System & Theme Styling

The documentation website must use **MkDocs Material** styled with official **IBM Carbon Design System** color tokens, IBM Plex typography, and a seamless **Light/Dark theme toggle**.

### Design Tokens (`docs/styles/custom.css`):

```css
/* ================================================================
   IBM Carbon Design System — Workshop Custom Theme
   ================================================================ */
:root {
  --ibm-blue-60: #0043ce;
  --ibm-blue-50: #0f62fe;
  --ibm-blue-40: #4589ff;
  --ibm-gray-10: #f4f4f4;
  --ibm-gray-20: #e0e0e0;
  --ibm-gray-90: #262626;
  --ibm-teal-50: #009d9a;
  --ibm-green-50: #198038;
  --ibm-red-50:  #da1e28;
  --ibm-yellow-30: #f1c21b;

  --md-primary-fg-color: #0f62fe;
  --md-primary-fg-color--light: #4589ff;
  --md-primary-fg-color--dark: #0043ce;
  --md-accent-fg-color: #0f62fe;
}

[data-md-color-scheme="slate"] {
  --md-primary-fg-color: #0f62fe;
  --md-accent-fg-color: #78a9ff;
}

@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,400;0,600;1,400&family=IBM+Plex+Sans:ital,wght@0,300;0,400;0,600;0,700;1,400&display=swap');

body, input {
  font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

code, kbd, pre {
  font-family: 'IBM Plex Mono', monospace;
}

/* Screenshot Framing */
.screenshot-container {
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  margin: 1.5rem 0;
}

[data-md-color-scheme="slate"] .screenshot-container {
  border-color: #393939;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
}

.screenshot-container img {
  display: block;
  width: 100%;
  height: auto;
}

.screenshot-caption {
  padding: 0.6rem 1rem;
  font-size: 0.85rem;
  color: #525252;
  background-color: #f4f4f4;
  border-top: 1px solid #e0e0e0;
  font-style: italic;
}

[data-md-color-scheme="slate"] .screenshot-caption {
  color: #a8a8a8;
  background-color: #1f1f1f;
  border-color: #393939;
}
```

---

## 3. Mandatory Workshop Content Requirements

### Landing Page (`docs/index.md` & `docs/index.en.md`)
- **Workshop Overview Table**: Listing of `Lab`, `Module Name`, `What You Will Do`, and calibrated `Duration`.
- **Mermaid AS-IS / TO-BE Architecture Diagrams**: Contrasting current and target states (`#fff3cd` for legacy, `#d4edda` for modernized target).
- **Prerequisites Section**: Explicit software versions (e.g., Java 17 LTS, Maven 3.8+, Podman 4.x+/Docker, Git, cloud access).

### Standard Lab Progression & Time Calibration (~2 Hours Total):

| Lab | Module Name | Calibrated Duration | Key Deliverables |
|-----|-------------|---------------------|------------------|
| **Lab 0** | Overview & Prerequisites | 10–15 min | CLI environment validation, architecture inspection, initial build |
| **Lab 1** | Baseline / Source Deployment | 15–20 min | Run legacy application/service, diagnose architectural limitations |
| **Lab 2** | Discovery & Tooling Assessment | 15–20 min | Run IBM scanner/collector, categorize rules (Critical, Warning, Info) |
| **Lab 3** | Manual Modernization | 25–35 min | Step-by-step refactoring with Before vs After code diffs |
| **Lab 3B** | AI-Assisted Modernization | 10–15 min | Accelerated agentic transformation using IBM Bob / watsonx workflows |
| **Lab 4** | Target Solution Deployment | 15–20 min | Container build, declarative runtime configuration (`server.xml`) |
| **Lab 5** | Validation & Observability | 10–15 min | Functional parity checks, health probes (`/health`), metrics (`/metrics`) |
| **Lab 6** | Cloud-Native / OpenShift | 20–30 min | (Optional) Kubernetes Operator deployment, HPA, Ingress / Routes |

---

## 4. Automation Scripts Standards

### Diagnostic Script (`verify-lab.sh`)
Must provide colored output with `pass`, `fail`, `info`, and `warn` status indicators:
- Validates CLI tools (`java`, `mvn`, `podman`/`docker`, `kubectl`/`oc`).
- Validates compilation outputs (`.ear`, `.war`, `.jar`).
- Validates active HTTP endpoints and health status codes.
- Supports running individual labs (`./verify-lab.sh 1`) or all labs (`./verify-lab.sh all`).

### Fast-Track Synchronization (`fast-track.sh`)
Enables students or instructors to quickly jump to any lab step by building necessary artifacts or launching backing containers without performing earlier manual steps.

---

## 5. Playwright UI Screenshot Automation Pattern

When taking screenshots of web consoles for lab documentation:

```javascript
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

(async () => {
    const browser = await chromium.launch({
        headless: true,
        args: ['--ignore-certificate-errors', '--no-sandbox']
    });
    const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 2, // 2x Retina resolution for razor-sharp text
        ignoreHTTPSErrors: true
    });
    const page = await context.newPage();

    // Navigate to target console
    await page.goto(process.env.CONSOLE_URL || 'https://localhost:9043/ibm/console');
    await page.waitForLoadState('networkidle');

    // Ensure output directory exists
    const outDir = path.join('./docs', 'lab1', 'img');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    // Capture screenshot
    await page.screenshot({ path: path.join(outDir, '01-login-screen.png'), fullPage: false });

    await browser.close();
})();
```

---

## 6. MkDocs Configuration Template (`mkdocs.yml`)

```yaml
site_name: "[Product Name] Modernization Workshop"
site_description: "Step-by-step interactive technical workshop"
site_author: "IBM Client Engineering"
docs_dir: docs

theme:
  name: material
  palette:
    - scheme: default
      primary: custom
      accent: blue
      toggle:
        icon: material/brightness-7
        name: Switch to dark mode
    - scheme: slate
      primary: custom
      accent: blue
      toggle:
        icon: material/brightness-4
        name: Switch to light mode
  font:
    text: IBM Plex Sans
    code: IBM Plex Mono
  features:
    - navigation.tracking
    - navigation.sections
    - navigation.indexes
    - content.code.annotate
    - content.code.copy
    - content.code.select
    - navigation.footer

plugins:
  - search
  - glightbox
  - i18n:
      languages:
        - locale: es
          name: Español
          default: true
          build: true
        - locale: en
          name: English
          build: true

markdown_extensions:
  - admonition
  - pymdownx.details
  - pymdownx.highlight:
      anchor_linenums: true
  - pymdownx.superfences:
      custom_fences:
        - name: mermaid
          class: mermaid
          format: !!python/name:pymdownx.superfences.fence_code_format
  - tables
  - toc:
      permalink: true

extra_css:
  - styles/custom.css
```

---

## 7. Quality Assurance Checklist

Before finalizing any workshop:
1. **Compilation**: Run `mvn clean package` on all application modules (`BUILD SUCCESS`).
2. **Strict Documentation Build**: Run `mkdocs build --strict` with zero warnings or broken references.
3. **Container Health**: Test `docker compose up -d` or `podman-compose up -d` and verify HTTP 200 responses.
4. **Clean Git Working Tree**: Verify no temporary Playwright or test scripts are left untracked.
