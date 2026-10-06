# Lab 1 — Deploying the Application on tWAS

---

## Lab Objective

In this lab you will compile the legacy monolith **PedjasApp (EAR)**, inspect the runtime topology on **traditional WebSphere Application Server (tWAS 9.0)** inside a container, and prepare the baseline source and binary artifacts that will be scanned and evaluated by **IBM Application Modernization Accelerator (AMA)** in Lab 2.

---

## Overview of PedjasApp

**PedjasApp** is an enterprise order management system simulating a typical B2B commerce platform. It features:

- **Product Catalog** — browsing and querying available merchandise
- **Order Management** — creation, tracking, and updating customer orders
- **Asynchronous Notifications** — dispatching order confirmation events via JMS
- **Session Authentication** — stateful session beans and security checks

The application intentionally incorporates:

- EJB 2.x (Entity Beans) and EJB 3.x (Session Beans)
- Proprietary `com.ibm.websphere.*` APIs
- Proprietary WebSphere JNDI namespaces
- JMS on WebSphere default messaging provider
- Datasource bindings declared in `ibm-web-bnd.xml`

---

## Step 1 — Prepare the tWAS Container Image

IBM provides official WebSphere Application Server traditional images on the IBM Container Registry (ICR).

### 1.1 Pull the tWAS 9.0 Base Image

The tWAS images are published under `icr.io/appcafe/websphere-traditional` and require no authentication to pull.

!!! warning "Mac Apple Silicon (ARM64)"
    The tWAS image is built for `amd64`. On Apple Silicon chips (M1/M2/M3/M4), specify the target platform explicitly:
    ```bash
    podman pull --platform linux/amd64 icr.io/appcafe/websphere-traditional:9.0.5.29
    ```
    For x86-64 Linux/Windows platforms, run the command without `--platform`.

```bash
# Linux/Windows x86-64
podman pull icr.io/appcafe/websphere-traditional:9.0.5.29

# Mac Apple Silicon (ARM64)
podman pull --platform linux/amd64 icr.io/appcafe/websphere-traditional:9.0.5.29
```

---

## Step 2 — Build PedjasApp for tWAS

```bash
# From workspace root
cd pedjasapp-twas

# Build the multi-module EAR
mvn clean package -DskipTests

# Verify EAR generation
ls -lh pedjasapp-ear/target/pedjasapp.ear
```

---

## Step 3 — Dockerfile for tWAS

Create `Dockerfile.twas` inside `pedjasapp-twas/`:

```dockerfile
FROM icr.io/appcafe/websphere-traditional:9.0.5.29

# Copy generated EAR from Maven build
COPY pedjasapp-ear/target/pedjasapp.ear /tmp/pedjasapp.ear

# Copy Jython automation configuration script
COPY docker/configureApp.py /work/config/
```

Build the container image:

```bash
# Linux / Windows x86-64
podman build -t pedjasapp-twas:9.0.5.29 -f Dockerfile.twas .

# Mac Apple Silicon (ARM64)
podman build --platform linux/amd64 -t pedjasapp-twas:9.0.5.29 -f Dockerfile.twas .
```

---

## Summary

!!! success "Completed"
    You have:

    - Built the multi-module legacy EAR package containing EJB 2.x, EJB 3.x, and WAS bindings
    - Inspected traditional WebSphere deployment scripts and container configurations
    - Prepared the binary EAR artifact ready for AMA modernization scanning in Lab 2

---

## Next Step

Proceed to **[Lab 2 — AMA Analysis](../lab2/index.en.md)** to execute the modernization assessment using IBM Application Modernization Accelerator.
