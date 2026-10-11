---
name: ibm-workshop-creator
description: Guides and generates complete project scaffolding, bilingual content (EN/ES), sample application code, and IBM Carbon Design System styling for interactive technical workshops for any IBM product (WebSphere, Instana, watsonx, MQ, OpenShift, App Connect, etc.) following official IBM Client Engineering standards.
---

# IBM Workshop Creator

This skill guides you through structuring, writing, styling, and validating step-by-step interactive technical workshops for any IBM technology or product, strictly adhering to IBM Client Engineering design, architecture, and documentation standards.

---

## 1. Standard IBM Workshop Structure

Every workshop must follow this directory and file hierarchy:

```text
workshop-name/
├── mkdocs.yml                  # MkDocs Material configuration with i18n support (en/es)
├── requirements.txt            # Python dependencies (mkdocs, mkdocs-material, mkdocs-static-i18n)
├── docker-compose.yml          # Local multi-container development environment (Services, DB, App)
├── verify-lab.sh               # Step-by-step automated lab verification script (lab0..labN)
├── fast-track.sh               # Fast-forward / synchronization script for instructors/attendees
├── docs/                       # Workshop documentation and step-by-step guides
│   ├── index.md & index.es.md  # Landing page, AS-IS / TO-BE architecture diagrams, prerequisites
│   ├── lab0/                   # Prerequisites & environment setup
│   ├── lab1/                   # Baseline / legacy deployment scenario
│   ├── lab2/                   # Discovery, analysis & telemetry using IBM tooling
│   ├── lab3/                   # Guided manual modernization / configuration
│   ├── lab3b/                  # AI-assisted modernization (IBM Bob / watsonx Code Assistant)
│   ├── lab4/                   # Target solution deployment (Modernized / Integrated)
│   ├── lab5/                   # Functional validation, health checks & observability
│   ├── lab6/                   # (Optional) Cloud-Native orchestration on Kubernetes / OpenShift
│   └── styles/
│       └── custom.css          # IBM Carbon Design System color tokens and component styling
└── <app-src>/                  # Source code for sample applications (e.g., monolith & target)
```

---

## 2. Design System & Visual Guidelines (IBM Carbon)

The `docs/styles/custom.css` file must define official IBM Carbon color tokens and layout customizations:

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
}

.md-header {
  background-color: var(--ibm-blue-60);
}

.md-header__title {
  font-weight: 600;
  letter-spacing: 0.01em;
}

.md-content h1 {
  border-bottom: 3px solid var(--ibm-blue-50);
  padding-bottom: 0.4em;
  color: var(--ibm-gray-90);
}

.md-content h2 {
  border-left: 4px solid var(--ibm-blue-40);
  padding-left: 0.6em;
  color: var(--ibm-gray-90);
}

.md-typeset table:not([class]) th {
  background-color: var(--ibm-blue-60);
  color: #ffffff;
  font-weight: 600;
}

.md-typeset table:not([class]) tr:nth-child(even) {
  background-color: var(--ibm-gray-10);
}
```

---

## 3. Mandatory Lab Content Requirements

### Landing Page (`index.md`)
- **Workshop Summary Table**: Mapping of `Lab`, `Module Name`, and `What You Will Do`.
- **Mermaid AS-IS / TO-BE Architecture Diagrams**: Illustrating current and target states with contrasting color palettes (`#fff3cd` for legacy, `#d4edda` for modernized target).
- **Prerequisites Overview**: Required tools, versions, and accounts (Java, Podman/Docker, CLIs, cloud access).

### Lab 0 — Prerequisites & Environment Verification
- Automated CLI tool verification (`podman version`, `java -version`, `mvn -version`, etc.).
- Initial compilation and sample application build check.
- Visual project tree walkthrough.

### Lab 1 — Baseline / Legacy State
- Launch the baseline application or infrastructure in a local container or test environment.
- Deliberate diagnosis of legacy bottlenecks or architectural blockers (e.g., legacy APIs, CMP Entity Beans, missing health probes).

### Lab 2 — Discovery & Static Analysis with IBM Products
- Execute the relevant IBM product scanner or collector (e.g., IBM Application Modernization Accelerator / Transformation Advisor, Instana, IBM MQ Explorer, API Connect).
- Categorize findings by severity: 🔴 Critical / Blocker, 🟡 Warning, 🔵 Informational.

### Lab 3 & Lab 3B — Modernization & AI Acceleration
- **Lab 3 (Manual)**: Step-by-step refactoring guide addressing each rule with *Before* vs *After* code excerpts.
- **Lab 3B (AI-Assisted)**: Using **IBM Bob** or **watsonx** workflows, specialized prompt engineering, and agentic transformations to accelerate delivery.

### Lab 4 — Target Solution Deployment
- Declarative configuration review (e.g., `server.xml`, multi-stage `Dockerfile`, Kubernetes manifests).
- Spinning up supporting backing services (Databases, Message Queues, Kafka).

### Lab 5 — Validation, Metrics & Observability
- Interactive post-migration verification checklist.
- Health endpoint validation (MicroProfile Liveness/Readiness probes, metrics scrape endpoints).
- Quantitative comparison: Memory footprint, startup time, and container image sizes.

### Lab 6 — Cloud-Native Orchestration & OpenShift (Optional)
- Deployment using official Kubernetes Operators (e.g., Open Liberty Operator, IBM MQ Operator).
- Horizontal Pod Autoscaler (HPA) and Route / Ingress configuration.

---

## 4. Automation Scripts Standards

### `verify-lab.sh`
Color-coded bash script providing `pass`, `fail`, `info`, and `warn` status indicators. It validates prerequisite commands, active HTTP ports, REST API health responses, and compiled binaries for each lab individually or all at once (`./verify-lab.sh all`).

### `fast-track.sh`
Automation script enabling attendees or instructors to jump directly to any lab step without having to manually complete prior steps.

---

## 5. Standard `mkdocs.yml` Template

```yaml
site_name: "[Product/Solution] Workshop"
site_description: "Step-by-step technical modernization workshop"
site_author: IBM Client Engineering
docs_dir: docs

theme:
  name: material
  palette:
    scheme: default
  features:
    - navigation.tracking
    - navigation.sections
    - navigation.indexes
    - content.code.copy
    - navigation.footer

plugins:
  - search
  - glightbox
  - i18n:
      languages:
        - locale: en
          name: English
          default: true
          build: true
        - locale: es
          name: Español
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
