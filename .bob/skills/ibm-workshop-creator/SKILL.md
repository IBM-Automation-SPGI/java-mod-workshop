---
name: ibm-workshop-creator
description: Framework and guidelines for scaffolding, authoring, styling, validating, and publishing interactive technical workshops for ANY IBM software, technology, or platform (Cloud, AI, Data, Security, Automation, Integration, Observability, Modernization, Infrastructure) following official IBM Client Engineering standards.
---

# IBM Workshop Creator

This skill provides the comprehensive architectural blueprint, content standards, automation patterns, design guidelines, and quality assurance framework for creating interactive, production-ready technical workshops across **any IBM product domain or technology stack**.

---

## 1. Universal Workshop Architecture

Every technical workshop must provide a self-contained, turnkey developer experience structured in a standardized directory hierarchy:

```text
workshop-root/
├── mkdocs.yml                  # MkDocs Material configuration with i18n (EN/ES) and theme toggles
├── requirements.txt            # Documentation build dependencies (mkdocs-material, i18n, glightbox, etc.)
├── docker-compose.yml          # Multi-container local orchestration (Backing services, Mock APIs, Workloads)
├── verify-lab.sh               # Universal automated lab verification script (supports labN or all)
├── fast-track.sh               # State-synchronization / jump-start script for attendees and instructors
├── docs/                       # Workshop guides and technical documentation
│   ├── index.md & index.en.md  # Landing page, AS-IS / TO-BE architecture, prerequisites, time budgets
│   ├── lab0/                   # Prerequisites & environment verification
│   ├── lab1/                   # Baseline / legacy workload deployment & telemetry discovery
│   ├── lab2/                   # Discovery, static analysis, scanning, or data exploration
│   ├── lab3/                   # Guided manual implementation / modernization / pipeline creation
│   ├── lab3b/                  # AI-accelerated implementation (IBM Bob / watsonx Code Assistant / AI Agents)
│   ├── lab4/                   # Target solution containerization / orchestration / integration
│   ├── lab5/                   # End-to-end functional validation, observability & health probes
│   ├── lab6/                   # (Optional) Enterprise deployment (Kubernetes / OpenShift / Hybrid Cloud)
│   └── styles/
│       └── custom.css          # IBM Carbon Design System design tokens and responsive styles
└── <app-src>/                  # Source code, manifests, sample data, and infrastructure-as-code
```

---

## 2. IBM Carbon Design System & Visual Guidelines

The workshop documentation must strictly follow official **IBM Carbon Design System** principles, featuring IBM Plex typography, Carbon color palettes, high-contrast code blocks, and a **Light/Dark theme toggle**.

### IBM Carbon Theme Tokens (`docs/styles/custom.css`):

```css
/* ================================================================
   IBM Carbon Design System — Universal Workshop Theme
   ================================================================ */
:root {
  /* Carbon Color Palette */
  --ibm-blue-60:   #0043ce;
  --ibm-blue-50:   #0f62fe;
  --ibm-blue-40:   #4589ff;
  --ibm-gray-10:   #f4f4f4;
  --ibm-gray-20:   #e0e0e0;
  --ibm-gray-80:   #393939;
  --ibm-gray-90:   #262626;
  --ibm-gray-100:  #161616;
  --ibm-teal-50:   #009d9a;
  --ibm-green-50:  #198038;
  --ibm-red-50:    #da1e28;
  --ibm-yellow-30: #f1c21b;

  /* MkDocs Material Carbon Bindings */
  --md-primary-fg-color:        var(--ibm-blue-50);
  --md-primary-fg-color--light: var(--ibm-blue-40);
  --md-primary-fg-color--dark:  var(--ibm-blue-60);
  --md-accent-fg-color:         var(--ibm-blue-50);
}

[data-md-color-scheme="slate"] {
  --md-primary-fg-color: var(--ibm-blue-50);
  --md-accent-fg-color:  #78a9ff;
}

/* IBM Plex Typography */
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,400;0,600;1,400&family=IBM+Plex+Sans:ital,wght@0,300;0,400;0,600;0,700;1,400&display=swap');

body, input {
  font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

code, kbd, pre {
  font-family: 'IBM Plex Mono', monospace;
}

/* Headings & Dividers */
.md-content h1 {
  border-bottom: 3px solid var(--ibm-blue-50);
  padding-bottom: 0.4em;
}

.md-content h2 {
  border-left: 4px solid var(--ibm-blue-40);
  padding-left: 0.6em;
}

/* High-Quality Screenshot Framing */
.screenshot-container {
  border: 1px solid var(--ibm-gray-20);
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  margin: 1.5rem 0;
}

[data-md-color-scheme="slate"] .screenshot-container {
  border-color: var(--ibm-gray-80);
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
  background-color: var(--ibm-gray-10);
  border-top: 1px solid var(--ibm-gray-20);
  font-style: italic;
}

[data-md-color-scheme="slate"] .screenshot-caption {
  color: #a8a8a8;
  background-color: #1f1f1f;
  border-color: var(--ibm-gray-80);
}
```

---

## 3. Universal Workshop Lifecycle & Lab Progression

Regardless of the technology stack (e.g., Application Runtimes, AI Models, Event Streaming, Observability, Integration, Hybrid Cloud), workshops follow an intuitive, hands-on progression calibrated for **~2 hours of total self-paced execution**:

| Stage / Module | Purpose | Typical Artifacts & Activities | Calibrated Time |
|---|---|---|---|
| **Overview & Setup** (`lab0`) | Environment readiness & architecture orientation | CLI tool validation, container engine check, repo clone, build verification | 10–15 min |
| **Baseline / Source** (`lab1`) | Baseline workload execution & problem discovery | Deploy legacy/initial workload, identify architectural bottlenecks, observe gaps | 15–20 min |
| **Discovery & Assessment** (`lab2`) | Automated analysis with IBM tooling | Run IBM scanners, telemetry agents, data profilers, or assessment utilities | 15–20 min |
| **Guided Implementation** (`lab3`) | Step-by-step transformation or configuration | Code refactoring, rule remediation, configuration updates (Before vs After diffs) | 25–35 min |
| **AI Acceleration** (`lab3b`) | AI-assisted execution | Prompt engineering, automated agent workflows (IBM Bob / watsonx Code Assistant) | 10–15 min |
| **Target Deployment** (`lab4`) | Deploy modernized / integrated target solution | Containerization, declarative runtime configuration, service mesh / gateway setup | 15–20 min |
| **Validation & Observability** (`lab5`) | Functional testing, metrics & health verification | Automated test suites, health probes (`/health`), metrics endpoints, dashboard telemetry | 10–15 min |
| **Enterprise Hybrid Cloud** (`lab6`) | (Optional) Scalability & cloud orchestration | Kubernetes / OpenShift Operators, CRDs, Ingress/Routes, Auto-scaling (HPA) | 20–30 min |

---

## 4. Multi-Domain Adaptation Matrix

Adapt the workshop lifecycle across different IBM software domains:

| IBM Domain | Examples (Products/Platforms) | Baseline (`lab1`) | Assessment (`lab2`) | Transformation (`lab3`/`lab3b`) | Target / Validation (`lab4`/`lab5`) |
|---|---|---|---|---|---|
| **App Modernization** | WebSphere Liberty, Open Liberty, AMA / TA | Legacy Monolith (tWAS/JBoss) | AMA / Transformation Advisor Scan | Jakarta EE & MicroProfile Refactoring | Liberty Container + Health/Metrics |
| **AI & Generative AI** | watsonx.ai, watsonx Assistant, watsonx Orchestrate | Baseline rules / scripts | Prompt lab & model evaluation | Agent flow / RAG pipeline implementation | Watsonx integration + E2E validation |
| **Observability & APM** | Instana, Turbonomic | Unmonitored distributed app | Agent injection & topology discovery | Custom spans, tracing & SLO configuration | Alerts, smart alerts & root cause analysis |
| **Integration & Messaging** | IBM MQ, App Connect, Event Automation | Synchronous legacy messaging | Queue discovery & flow analysis | Event-driven architecture / Kafka / Camel | Resilient messaging + schema registry |
| **Data & Governance** | watsonx.data, Cloud Pak for Data, Db2 | Raw silos / legacy schemas | Data cataloging & quality profiling | Presto/Trino queries & virtualization | Governed Lakehouse queries + security |
| **Cloud & Automation** | Red Hat OpenShift, Ansible Automation Platform | Manual VM configuration | Inventory & playbook assessment | Declarative Operators & Playbooks | GitOps pipeline + automated drift repair |

---

## 5. Lab Content Structure Standard

Each lab guide (`docs/labN/index.md` and `docs/labN/index.en.md`) must include:

1. **Header Badges**: Target time (`⏱️ Time: ~X min`) and complexity level.
2. **Learning Objectives**: Bulleted list of tangible outcomes.
3. **Context / Why it Matters**: Short conceptual explanation connecting the lab to enterprise business value.
4. **Step-by-Step Instructions**:
   - Numbered steps with clear, executable CLI commands in copyable code blocks.
   - Exact configuration files or code diffs (*Before* vs *After*).
5. **Expected Output Callouts**: Snippets of terminal output or logs showing success indicators.
6. **Key Takeaways & Next Step**: Summary of concepts learned and a clear link to the subsequent lab.

---

## 6. Automation Scripts Framework

### Universal Verification Script (`verify-lab.sh`)
Provides clear diagnostic feedback to attendees:

```bash
#!/usr/bin/env bash
# ==============================================================================
# Universal Workshop Verification Script
# Usage: ./verify-lab.sh [lab0|lab1|lab2|lab3|lab4|lab5|lab6|all]
# ==============================================================================
set -euo pipefail

# ANSI color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

pass() { echo -e "  [${GREEN}✅ PASS${NC}] $1"; }
fail() { echo -e "  [${RED}❌ FAIL${NC}] $1"; }
warn() { echo -e "  [${YELLOW}⚠️ WARN${NC}] $1"; }
info() { echo -e "  [${BLUE}ℹ️ INFO${NC}] $1"; }

check_cmd() {
    local cmd="$1"
    if command -v "$cmd" >/dev/null 2>&1; then
        pass "Command available: $cmd ($($cmd --version 2>&1 | head -n 1))"
    else
        fail "Command missing: $cmd (please install or check PATH)"
    fi
}

check_http() {
    local url="$1"
    local expected="${2:-200}"
    local desc="$3"
    local code
    code=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")
    if [ "$code" = "$expected" ]; then
        pass "$desc ($url -> HTTP $code)"
    else
        fail "$desc ($url -> expected HTTP $expected, got $code)"
    fi
}
```

### Fast-Track Jump Script (`fast-track.sh`)
Allows jumping directly to any lab step by building necessary intermediate binaries, downloading models, or bringing up required backing services automatically.

---

## 7. Retina Playwright Screenshot Capture Pattern

To capture pristine, high-DPI screenshots of product consoles or web UIs for lab documentation:

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
        deviceScaleFactor: 2, // 2x Retina scaling for high-DPI displays
        ignoreHTTPSErrors: true
    });
    const page = await context.newPage();

    // Target UI console
    await page.goto(process.env.TARGET_URL || 'http://localhost:8080');
    await page.waitForLoadState('networkidle');

    // Save screenshot
    const outDir = path.join('./docs', process.env.LAB_DIR || 'lab1', 'img');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    await page.screenshot({ 
        path: path.join(outDir, `${process.env.IMG_NAME || 'screenshot'}.png`), 
        fullPage: false 
    });

    await browser.close();
})();
```

---

## 8. Quality Assurance & Publishing Checklist

Before releasing any workshop repository:
1. **End-to-End Build**: All sample code, modules, and tests must compile and pass cleanly without manual intervention.
2. **Strict Documentation Build**: Run `mkdocs build --strict` to guarantee zero broken links, invalid YAML, or missing assets.
3. **Bilingual Parity**: Verify structural parity between default language (`.md`) and alternate language (`.en.md` / `.es.md`).
4. **Container Orchestration**: Ensure `docker-compose.yml` launches all required services and responds on expected ports.
5. **Clean Working Tree**: Ensure no temporary test scripts, screenshots, or local artifacts remain untracked in the git repository.
