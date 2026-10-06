# Lab 3B — AI-Assisted Modernization with IBM Bob

---

## Lab Objective

In this lab you will leverage **IBM Bob** and the **Premium Package for Java Modernization** (`IBM.bob-java`) to automate and accelerate the code transformations identified by AMA. Bob operates as an intelligent modernization agent: it reads the AMA assessment export, applies OpenRewrite recipes, resolves remaining semantic incompatibilities, and generates the target `server.xml` and container configurations.

---

## The IBM Bob Premium Package for Java Modernization

The **IBM Bob Premium Package for Java Modernization** ([`IBM.bob-java`](https://open-vsx.org/extension/IBM/bob-java)) extends IBM Bob with specialized enterprise Java transformation workflows:

| Workflow | Description |
|----------|-------------|
| **Liberty Modernization** | Migrates traditional WebSphere applications to Liberty guided by AMA assessment exports, OpenRewrite recipes, and agentic error resolution |
| **Java Upgrade** | Upgrades Java versions (8 → 11 → 17 → 21 → 25) with automated rewrite recipes and build-fix loops |
| **Java Unit Test Generation** | Synthesizes comprehensive JUnit test suites targeting 80%+ JaCoCo coverage |
| **UI Modernization** | Decomposes legacy server-side JSF/Struts web tiers into modern decoupled architectures |
| **Java Vulnerability Remediation** | Audits and fixes Maven/Gradle dependency vulnerabilities against the OSV database |

---

## Step 1 — Provide the AMA Migration Bundle

Download the migration plan ZIP export from your AMA workspace:
`pedjasapp-ama-migration-plan.zip`

Place the archive in your workspace directory.

---

## Step 2 — Launch the Liberty Modernization Workflow

In the IBM Bob chat prompt, simply enter:

```text
Liberty Modernization
```

Or trigger **Start Workflow → Liberty Modernization**.

Bob performs the following automated phases:

1. **Ingest AMA Report** — parses all rule violations and dependency graphs
2. **Inject Liberty Configuration** — provisions `server.xml` with exact required features
3. **Apply Automated Code Fixes** — updates imports, JPA entities, and annotations
4. **Compile & Validate** — runs Maven builds and corrects compiler warnings iteratively

---

## Summary

!!! success "Completed"
    You have:

    - Explored AI-accelerated migration workflows with IBM Bob
    - Automated code refactoring using AMA-guided recipes
    - Generated a fully compliant Jakarta EE 10 / Liberty project

---

## Next Step

Proceed to **[Lab 4 — Deploy on Liberty](../lab4/index.en.md)** to run the application in WebSphere Liberty.
