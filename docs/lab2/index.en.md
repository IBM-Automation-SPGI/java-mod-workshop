# Lab 2 — Assessment with IBM Application Modernization Accelerator

---

## Lab Objective

In this lab you will run **IBM Application Modernization Accelerator (AMA)** against the PedjasApp EAR artifact, interpret the migration findings and complexity score, and understand the concrete rules generated to guide the Liberty target migration.

---

## What is IBM AMA / Transformation Advisor?

**IBM Application Modernization Accelerator** is a static code and binary analysis engine that:

- Scans enterprise Java application binaries (EAR, WAR, JAR) without requiring direct access to source code
- Detects proprietary dependencies and APIs tied to the source runtime (tWAS, WebLogic, JBoss)
- Generates specific, categorized modernization rules for every detected incompatibility
- Estimates migration effort (Simple, Moderate, Complex)
- Generates baseline target configuration artifacts such as Liberty `server.xml` and container templates

---

## Step 1 — Local AMA Installation

AMA Local can be launched via container orchestration:

```bash
unzip application-modernization-accelerator-local-5.1.0.zip
cd application-modernization-accelerator-local-5.1.0
sh launch.sh
```

Verify the local instance:
```bash
podman ps | grep -i ama
```

Open the web console at **[https://localhost/](https://localhost/)** (or **[http://localhost:3000](http://localhost:3000)**).

---

## Step 2 — Create a Migration Workspace

1. In the AMA dashboard, select **Add Workspace**.
2. Name the workspace `PedjasApp-Migration`.
3. Provide an optional description and confirm creation.

---

## Step 3 — Generate Data Collection and Upload

Run the binary scanner / data collector against `pedjasapp.ear`:

```bash
# Execute collection scanner against EAR
./transformationadvisor-*-data-collector/bin/transformationadvisor -e pedjasapp-ear/target/pedjasapp.ear
```

Upload the resulting `pedjasapp-collection.zip` via the web console under **Bulk data → Upload** or using the REST API endpoint:

```bash
curl -k -X POST "https://localhost:2220/lands_advisor/advisor/v2/workspaces/<WORKSPACE_ID>/collectionZip" \
  -F "file=@pedjasapp-collection.zip"
```

---

## Step 4 — Interpret Assessment Results

AMA categorizes modernization issues into key priority groups:

1. **RULE-0001 — IBM WebSphere Proprietary APIs**: Calls to `com.ibm.websphere.*` classes that must be replaced by standard Jakarta EE or MicroProfile APIs.
2. **RULE-0002 — EJB 2.x Container-Managed Persistence**: CMP entity beans must be migrated to JPA 3.x entities.
3. **RULE-0003 — Proprietary JNDI Namespaces**: Legacy lookup strings mapped to standard portable `@Resource` injection.
4. **RULE-0004 — Proprietary WebSphere Bindings**: Declarations in `ibm-web-bnd.xml` and `ibm-ejb-jar-bnd.xml` superseded by declarative `server.xml`.
5. **RULE-0005 — Default WAS Messaging Provider**: JMS messaging resources configured natively in Liberty.

---

## Summary

!!! success "Completed"
    You have:

    - Deployed and configured IBM Application Modernization Accelerator (AMA)
    - Uploaded and scanned the enterprise EAR binary
    - Reviewed the migration complexity report and rule breakdown

---

## Next Step

Proceed to **[Lab 3 — Manual Modernization](../lab3/index.en.md)** (or **[Lab 3B — Modernization with Bob](../lab3b/index.en.md)**) to apply the modernization transformations.
