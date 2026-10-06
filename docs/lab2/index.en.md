# Lab 2 — Assessment with IBM Application Modernization Accelerator

---

## Lab Objective

In this lab you will run **IBM Application Modernization Accelerator (AMA)** against the PedjasApp EAR artifact, interpret the migration analysis results, and prioritize the required code and configuration transformations for WebSphere Liberty.

---

## What is IBM AMA / Transformation Advisor?

**IBM Application Modernization Accelerator** is a static code and binary analysis engine that:

- Scans enterprise Java application binaries (EAR, WAR, JAR) without requiring direct access to source code
- Detects proprietary dependencies of the source application server (tWAS, JBoss, WebLogic, etc.)
- Generates specific, categorized modernization rules for each issue detected
- Estimates migration effort (Simple, Moderate, Complex)
- Produces a prioritized action plan highlighting critical blocking issues first
- Generates baseline target configuration artifacts such as Liberty `server.xml` and container files

---

## Step 1 — Installation of AMA (Transformation Advisor)

### Local Installation (Recommended for the Workshop)

The `ibmcom/transformation-advisor-dev` image is no longer publicly maintained. AMA Local (v4.x/v5.x) is installed using the official bundle downloaded from IBM:

1. Download the installer from the official page:
   **[ibm.com/support/pages/ibm-transformation-advisor-downloads](https://www.ibm.com/support/pages/ibm-transformation-advisor-downloads)**

2. Extract the ZIP archive and launch the startup script:

```bash
unzip application-modernization-accelerator-local-5.1.0.zip
cd application-modernization-accelerator-local-5.1.0
sh launch.sh
```

!!! note "Script name by version"
    - AMA 5.x and 4.x: the script is named `launch.sh`
    - Transformation Advisor 3.x: the script was named `launchTransformationAdvisor.sh`

```bash
# Verify that containers are running
podman ps | grep -i ama
```

Access the web interface at: **[https://localhost/](https://localhost/)** (or **[http://localhost:3000](http://localhost:3000)** in legacy versions).

![AMA home screen showing workspaces list](img/01-ama-home-workspaces.png)

!!! note "Requirements"
    Requires Docker or Podman installed on your system. The script automatically pulls necessary images from ICR.

---

## Step 2 — Create a New Workspace in AMA

When accessing the Transformation Advisor interface for the first time:

### 2.1 Create a Workspace

1. Click the **Create workspace** button on the main screen.
2. Enter the workspace name in the **Workspace name** field:

```
Name: "Workshop_PedjasApp"
→ Create
```

![Create workspace dialog — empty field](img/02-create-workspace-dialog.png)

![Create workspace dialog — name entered](img/03-create-workspace-name-filled.png)

**Workspace view after creation:**

![Workshop_PedjasApp workspace interior](img/04-workspace-interior-empty.png)

### 2.2 Explore data or import new scans

In the modern AMA UI (v4.x/v5.x):
- You can explore the **Sample_data** demo workspace to familiarize yourself with the **Visualization**, **Assessment**, and **Migration plan** dashboards.
- To upload new application analyses, use the top navigation menu **Bulk data → Upload** or the upload wizard.

---

## Step 3 — Generate Collection with Data Collector & Upload to AMA

The **AMA Data Collector** scans complete traditional WebSphere servers or standalone binary archives (`.ear`, `.war`), evaluating incompatibilities, architectural rules, and Liberty dependencies.

The workflow consists of two parts:

1. **Generating the collection `.zip` archive** using the binary scanner / Data Collector.
2. **Uploading the `.zip` archive to AMA** (via the **Web GUI** or via the **REST API**).

---

### 3.1 How to Generate the ZIP Collection with the Data Collector

The Data Collector is packaged inside the AMA container (`taserver`). To run the scan directly on the `pedjasapp-twas` container, extract the collector bundle and execute analysis using the commands below:

#### Prerequisites: Extract the Data Collector in the tWAS container
```bash
# 1. Create directory in the tWAS container
podman exec pedjasapp-twas mkdir -p /tmp/ta-collector

# 2. Extract Linux collector package from AMA server container to tWAS container
podman exec taserver cat /opt/ibm/wlp/usr/servers/defaultServer/apps/expanded/lands_advisor.war/transformationadvisor-Linux.tgz | podman exec -i pedjasapp-twas tar -xzf - -C /tmp/ta-collector
```

---

#### Option 1 — Full tWAS Server Scan from Container (All Profiles)
```bash
# Run collector against server installation in /opt/IBM/WebSphere/AppServer
podman exec pedjasapp-twas \
  /tmp/ta-collector/transformationadvisor-5.1.0/jre/bin/java \
  -jar /tmp/ta-collector/transformationadvisor-5.1.0/lib/ta.binaryAppScanner-26.3.1.0.jar \
  /opt/IBM/WebSphere/AppServer \
  --dc \
  --all-profiles \
  --output=/tmp/ta-output \
  --noProgressIndicator

# Copy generated ZIP to local host
podman exec pedjasapp-twas cat /tmp/ta-output/AppSrv01.zip > ./AppSrv01-collection.zip
```
> Generates: `./AppSrv01-collection.zip`

---

#### Option 2 — Target EAR Scan (`pedjasapp.ear`) for Liberty (Jakarta EE 10 / Java 21)
```bash
# Run scan on EAR targeting Liberty and Java 21
podman exec pedjasapp-twas \
  /tmp/ta-collector/transformationadvisor-5.1.0/jre/bin/java \
  -jar /tmp/ta-collector/transformationadvisor-5.1.0/lib/ta.binaryAppScanner-26.3.1.0.jar \
  /tmp/pedjasapp.ear \
  --dc \
  --sourceAppServer=was90 \
  --sourceJava=ibm8 \
  --targetJava=java21 \
  --output=/tmp/ta-output-pedjas \
  --noProgressIndicator

# Copy generated ZIP to local host
podman exec pedjasapp-twas cat /tmp/ta-output-pedjas/pedjasapp.zip > ./pedjasapp-collection.zip
```
> Generates: `./pedjasapp-collection.zip`

---

### 3.2 How to Upload Collection to AMA

You have two methods available to ingest the `.zip` archive:

#### Method A — Upload via Web GUI
1. Open your browser and navigate to the AMA console at **[https://localhost/](https://localhost/)**.
2. Open your Workspace (e.g. newly created or click **Create workspace**).
3. On the Workspace landing screen, click the central button **Upload results** (or top bar **Bulk data → Upload**).
4. In the **Upload data** modal, drag & drop or select your generated ZIP file (`pedjasapp.zip` / `pedjasapp-collection.zip` or `AppSrv01-collection.zip`).
5. Keep **Autodetect collection** selected or provide a name (e.g. `PedjasApp_tWAS`) and click the blue **Upload** button.
6. Within seconds, the UI processes the binaries and displays the **Recommendations** view, **Visualization** charts, and modernization rule breakdown.

---

#### Method B — Automated Upload via CLI / AMA REST API

You can create workspaces, upload collections, and query assessment reports **100% via the command line** using the secure REST API on port `2220` (**[https://localhost:2220/lands_advisor/advisor/v2/workspaces](https://localhost:2220/lands_advisor/advisor/v2/workspaces)**).

##### 1. Create or Query Workspace via CLI
```bash
# Create a new workspace for the workshop
WORKSPACE_ID=$(curl -k -s -X POST https://localhost:2220/lands_advisor/advisor/v2/workspaces \
  -H "Content-Type: application/json" \
  -d '{"name": "Workshop_PedjasApp"}' | python3 -c "import sys, json; print(json.load(sys.stdin).get('id'))")

echo "Workspace ID: $WORKSPACE_ID"
```

##### 2. Upload Collection ZIP Archive via curl
```bash
# Option 1: Upload from local host
curl -k -X POST "https://localhost:2220/lands_advisor/advisor/v2/workspaces/${WORKSPACE_ID}/collectionArchives?collectionName=PedjasApp_tWAS&overwrite=true" \
  -H "Content-Type: application/octet-stream" \
  -H "archiveName: pedjasapp.zip" \
  --data-binary "@./pedjasapp-collection.zip"

# Option 2: Upload directly from tWAS container
podman exec pedjasapp-twas curl -k -X POST \
  "https://taserver:9443/lands_advisor/advisor/v2/workspaces/${WORKSPACE_ID}/collectionArchives?collectionName=PedjasApp_tWAS&overwrite=true" \
  -H "Content-Type: application/octet-stream" \
  -H "archiveName: pedjasapp.zip" \
  --data-binary "@/tmp/ta-output-pedjas/pedjasapp.zip"
```

##### 3. Query Assessment Units and Metrics via CLI
```bash
# List processed applications in Workspace
curl -k -s "https://localhost:2220/lands_advisor/advisor/v2/workspaces/${WORKSPACE_ID}/assessmentUnits" | python3 -m json.tool

# Query detailed cost, effort, and rule breakdown
ASSESSMENT_ID=$(curl -k -s "https://localhost:2220/lands_advisor/advisor/v2/workspaces/${WORKSPACE_ID}/assessmentUnits" | python3 -c "import sys, json; print(json.load(sys.stdin)['assessmentUnits'][0]['id'])")

curl -k -s "https://localhost:2220/lands_advisor/advisor/v2/workspaces/${WORKSPACE_ID}/costDetails/assessmentUnits/${ASSESSMENT_ID}" | python3 -m json.tool
```

---

## Step 4 — Interpret Assessment Results

Upon completion, Transformation Advisor displays a summary structured as follows:

### 4.1 Applications Summary View

The **Assessment** tab displays a table of all scanned applications with complexity metrics, estimated migration effort, and a rule count breakdown by severity:

![Assessment overview — applications summary and metrics](img/08-recommendations-overview.png)

### 4.2 Issue Classification

| Severity Level | Color | Meaning |
|----------------|-------|---------|
| **Critical** | 🔴 Red | Blocker — application will not run on Liberty without this modification |
| **Warning** | 🟡 Yellow | Behavioral difference — requires additional testing or config adjustment |
| **Informational** | 🔵 Blue | Best practice recommendation — does not block deployment |

### 4.3 Modernization Rules Triggered in PedjasApp

Clicking on `pedjasapp.ear` in the Assessment view opens the **application detail**, which shows complexity, estimated development cost, and the issue breakdown with **Java SE 21** and **Jakarta EE 10** as targets:

![pedjasapp.ear detail view — Complexity, Issues and estimated cost (Java 21 / Jakarta EE 10)](img/10-app-detail-pedjasapp.png)

The panel reports:
- **Complexity:** Complex
- **Issues:** 3 🔴 Critical, 1 🟡 Warning, 6 🔵 Informational
- **Code changes:** Part-automated (OpenRewrite recipes available)
- **Development cost:** 12.5 days

The real PedjasApp report generates **10 rules flagged / 24 total results** targeting Jakarta EE 10 / Java 21:

| Severity | Rules | Results |
|----------|-------|---------|
| 🔴 Critical | 3 | 14 |
| 🟡 Warning | 1 | 1 |
| 🔵 Information | 6 | 9 |

The following are the main rules AMA reports for PedjasApp:

---

#### 🔴 CR-001 — Update to Jakarta EE package name *(Jakarta EE 9)*

**Affected locations:** 11 occurrences across the application

**Description:**
The application uses the `javax.*` namespace from Java EE. Starting with Jakarta EE 9, all packages were renamed from `javax.*` to `jakarta.*`. This change is **mandatory** to run on Liberty with Jakarta EE 9+.

**Problematic code:**
```java
import javax.ejb.Stateless;
import javax.persistence.Entity;
import javax.jms.Queue;
import javax.servlet.http.HttpServlet;
```

**Corrective action (via OpenRewrite — automatable):**
```java
import jakarta.ejb.Stateless;
import jakarta.persistence.Entity;
import jakarta.jms.Queue;
import jakarta.servlet.http.HttpServlet;
```
> 💡 This rule has an associated OpenRewrite recipe (⚙️ icon in report). Apply automatically with `mvn rewrite:run`.

---

#### 🔴 CR-002 — Entity Enterprise JavaBeans (EJB) unavailable *(Java Technology Support for Liberty)*

**Affected locations:** 1 result

**Description:**
EJB 2.x Container-Managed Persistence (CMP) Entity Beans (`ProductoBean implements EntityBean`) are not supported on WebSphere Liberty. Liberty supports only EJB 3.x with Jakarta Persistence (JPA).

**Problematic code:**
```java
public abstract class ProductoBean implements EntityBean {
    public abstract String getNombre();
    public abstract void setNombre(String nombre);
    public abstract java.util.Collection ejbSelectByCategoria(String cat);
}
```

**Corrective action:**
- Convert CMP Entity Beans into JPA Entities (`@Entity`)
- Replace Home Interfaces with DAOs or `@Stateless` Session Beans

---

#### 🔴 CR-003 — Proprietary WebSphere APIs and deployment descriptors *(WebSphere traditional to Liberty)*

**Description:**
The application uses `com.ibm.websphere.*` APIs, proprietary WAS binding descriptors (`ibm-web-bnd.xml`, `ibm-ejb-jar-bnd.xml`), and non-portable JNDI namespaces that do not exist in Liberty.

**Corrective action:**
- Remove `com.ibm.websphere.*` imports and replace with Jakarta EE standard equivalents
- Move bindings from `ibm-web-bnd.xml` into `<dataSource>` elements in `server.xml`
- Use standard `@Resource` injection instead of manual JNDI lookups

---

#### 🟡 WA-001 — JMS Connectivity *(WebSphere traditional to Liberty)*

**Affected locations:** 1 result

**Description:**
The application uses a `QueueConnectionFactory` configured via WAS resources. Liberty uses its own integrated messaging provider (`messagingServer-3.0`) or an external resource adapter.

**Corrective action:**
- Define `<jmsConnectionFactory>` and `<jmsQueue>` in `server.xml`
- Enable `messaging-3.1`, `messagingServer-3.0`, and `messagingClient-3.0` features

---

#### 🔵 IN-001 to IN-006 — Informational considerations

| Informational rule | Results | Category |
|--------------------|---------|----------|
| Databases (cloud connectivity) | 4 | Technology connectivity for IBM Cloud |
| Java Message Service (JMS) | 1 | Connectivity (not Liberty Core) |
| Unmanaged threads | — | All application servers |
| JVM configuration properties | — | All application servers |
| System modules compatibility | — | All application servers |
| URL host/port cloud access | — | Cloud connectivity |

> Informational rules do not block deployment but should be reviewed before production.

---

### 4.4 Detailed Analysis Panel — File View

Expanding any rule from the list reveals the detailed panel with the issue description, affected files, and suggested fix:

![Expanded critical rule detail panel](img/12-rule-detail-expanded.png)

The **Visualization** tab provides a graphical dependency view and modernization status:

![Visualization graph view of the application](img/13-visualization.png)

### 4.5 Detailed Migration Analysis Report

AMA also generates a full **HTML Analysis Report** listing every triggered rule, its severity, affected files, and code snippets. Access it from the application detail view:

```
Application: pedjasapp.ear
→ (row menu) → View full analysis report
```

The report contains four main sections:

1. **Header and severity summary** — rule count per severity level (Critical, Warning, Information)
2. **Critical rules section** — expandable list with description, affected files, and code snippets
3. **Individual rule detail** — clicking a row expands the affected files and problematic code fragment
4. **Warning / Informational rules section** — lower-priority recommended changes

!!! tip "Capturing the report"
    You can regenerate the real report screenshots by running the Playwright script while AMA is active:
    ```bash
    node scripts/capture-lab2-screenshots.cjs
    ```
    This will automatically create `14-analysis-report-top.png`, `15-analysis-report-critical.png`, `16-analysis-report-rule-detail.png`, and `17-analysis-report-info.png` in `docs/lab2/img/`.

---

## Step 5 — Generate the Migration Plan

Transformation Advisor automatically generates starter artifacts for Liberty:

### 5.1 Download Migration Bundle

```
Application: pedjasapp.ear (or detailed application view)
→ View migration plan
→ Download plan (ZIP)
```

The ZIP includes:
- `server.xml` — initial Liberty configuration
- `Dockerfile` — baseline container definition
- `migration-plan.md` — technical breakdown of required changes

### 5.2 Summary Table of Triggered Rules

*(Target: Liberty + Jakarta EE 10 + Java 21 — 10 rules / 24 results)*

| AMA Rule | Severity | Results | Category |
|----------|----------|---------|----------|
| CR-001 — Update to Jakarta EE package name | 🔴 Critical | 11 | Jakarta EE 9 |
| CR-002 — Entity EJBs unavailable (CMP) | 🔴 Critical | 1 | Java Technology Support for Liberty |
| CR-003 — Proprietary WebSphere APIs/descriptors | 🔴 Critical | 2 | WebSphere traditional to Liberty |
| WA-001 — JMS Connectivity | 🟡 Warning | 1 | WebSphere traditional to Liberty |
| IN-001 — Databases (cloud connectivity) | 🔵 Info | 4 | Technology connectivity for IBM Cloud |
| IN-002 — Java Message Service (JMS) | 🔵 Info | 1 | Connectivity (not Liberty Core) |
| IN-003 to IN-006 — General considerations | 🔵 Info | 4 | All application servers / Cloud |

**Total estimated effort: 3-5 developer days**
*(CR-001 can be applied automatically using the Liberty Modernization OpenRewrite recipe)*

---

## Summary

!!! success "Completed"
    In this lab you have:

    - Installed and launched IBM Transformation Advisor / AMA
    - Scanned the PedjasApp EAR binary via Data Collector
    - Identified **10 modernization rules** (3 Critical, 1 Warning, 6 Informational) targeting Jakarta EE 10 / Java 21
    - Evaluated migration complexity, result counts, and effort
    - Exported the baseline migration plan and Liberty starter files

---

## Next Step

Proceed to **[Lab 3 — Manual Modernization](../lab3/index.en.md)** (or **[Lab 3B — Modernization with Bob](../lab3b/index.en.md)**) to apply these 6 modifications directly to the code.
