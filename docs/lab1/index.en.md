# Lab 1 — Deploying the Application on tWAS

---

## Lab Objective

In this lab you will compile the legacy monolith **PedjasApp (EAR)**, start an instance of **traditional WebSphere Application Server (tWAS 9.0)** inside a container, and prepare the source artifacts and environment that will be scanned and analyzed in depth using **IBM Application Modernization Accelerator (AMA)** in Lab 2.

---

## Overview of PedjasApp

**PedjasApp** is an enterprise order management system simulating a typical B2B commerce platform. It features:

- **Product Catalog** — browsing and searching available merchandise
- **Order Management** — creation, querying, and updating customer orders
- **Asynchronous Notifications** — dispatching order confirmation events via JMS
- **Basic Authentication** — session management backed by EJBs

The application intentionally incorporates:

- EJB 2.x (Entity Beans) and EJB 3.x (Session Beans)
- Proprietary APIs (`com.ibm.websphere.*`)
- Proprietary WebSphere JNDI namespaces
- JMS over WebSphere default messaging provider
- Datasources configured via WebSphere bindings (`ibm-web-bnd.xml`)

These characteristics make PedjasApp the ideal candidate for AMA analysis.

---

## Step 1 — Prepare the tWAS Container Image

IBM provides official WebSphere Application Server traditional images on the IBM Container Registry (ICR).

### 1.1 Pull the tWAS 9.0 Base Image

The tWAS images are published under `icr.io/appcafe/websphere-traditional` and **do not require authentication** to pull.

!!! warning "Mac Apple Silicon (ARM64)"
    The tWAS image is **only available for `amd64`**. On Macs with Apple Silicon chips (M1/M2/M3/M4), specify the target platform explicitly for emulation:
    ```bash
    podman pull --platform linux/amd64 icr.io/appcafe/websphere-traditional:9.0.5.29
    ```
    And in all `podman run` commands, add `--platform linux/amd64`.
    On Linux/Windows x86-64 machines, pull directly without `--platform`.

```bash
# Linux/Windows x86-64
podman pull icr.io/appcafe/websphere-traditional:9.0.5.29

# Mac Apple Silicon (ARM64)
podman pull --platform linux/amd64 icr.io/appcafe/websphere-traditional:9.0.5.29
```

!!! tip "Available Images"
    ICR maintains the latest 3 versions for each branch. You can list available images using IBM Cloud CLI:
    ```bash
    ibmcloud cr region-set global
    ibmcloud cr images --restrict appcafe/websphere-traditional
    ```
    Official reference: [github.com/WASdev/ci.docker.websphere-traditional](https://github.com/WASdev/ci.docker.websphere-traditional/blob/main/docs/images.md)

---

## Step 2 — Build PedjasApp for tWAS

```bash
# From workspace root
cd pedjasapp-twas

# Build the multi-module EAR with Maven
mvn clean package -DskipTests

# Verify that the EAR has been generated (in submodule pedjasapp-ear)
ls -lh pedjasapp-ear/target/pedjasapp.ear
```

Expected output:
```
-rw-r--r-- 1 user group 1.2M Jan 15 10:30 pedjasapp.ear
```

!!! info "Legacy Architectural Pattern and EJB 2.x CMP"
    `pedjasapp.ear` deliberately includes classic entity beans (**EJB 2.x CMP** `ProductoEJB`), proprietary WebSphere descriptors (`ibm-web-bnd.xml`, `ibm-ejb-jar-bnd.xml`), and legacy tWAS JNDI namespaces. In traditional WebSphere Application Server, EJB 2.x CMP entity beans required persistence code generation tools (`ejbdeploy`). The main purpose of packaging this EAR in the workshop is to have the complete enterprise artifact available for scanning and evaluation with **IBM Application Modernization Accelerator (AMA)** in **Lab 2**.

---

## Step 3 — Create the tWAS Container Image with PedjasApp

Create a file named `Dockerfile.twas` in the `pedjasapp-twas/` directory:

```dockerfile
FROM icr.io/appcafe/websphere-traditional:9.0.5.29

# Copy generated EAR from Maven build (output path of pedjasapp-ear module)
COPY pedjasapp-ear/target/pedjasapp.ear /tmp/pedjasapp.ear

# Copy Jython configuration script
COPY docker/configureApp.py /work/config/

# Execute configuration on startup
CMD ["/work/start_server.sh"]
```

Build the container image (from the root of `pedjasapp-twas/`):

```bash
podman build -f Dockerfile.twas -t pedjasapp-twas:1.0 .
```

---

## Step 4 — Start the tWAS Container

```bash
podman run -d \
  --name pedjasapp-twas \
  -p 9080:9080 \
  -p 9443:9443 \
  -p 9043:9043 \
  -p 9060:9060 \
  -e LICENSE=accept \
  pedjasapp-twas:1.0
```

### Verify Server Startup

```bash
# Follow logs until the server ready message appears
podman logs -f pedjasapp-twas
```

Look for the startup completion message in tWAS:
```
WSVR0001I: Server server1 open for e-business
```

!!! tip "tWAS Startup Time"
    Traditional WebSphere Application Server typically takes **3 to 5 minutes** to fully initialize. It is normal for logs to display a long sequence of CWWKF/CWWKZ messages before `WSVR0001I` appears. Do not interrupt the process. Compare this with Liberty's startup time (5–15 seconds) in Lab 4.

---

## Step 5 — Access the tWAS Administrative Console

Open your browser and navigate to the traditional WebSphere administrative console:

👉 **[https://localhost:9043/ibm/console](https://localhost:9043/ibm/console)** (or via unencrypted HTTP at **[http://localhost:9060/ibm/console](http://localhost:9060/ibm/console)**)

- **Username:** `wsadmin`
- **Password:** Retrieve the generated password with:
  ```bash
  podman exec pedjasapp-twas cat /tmp/PASSWORD
  ```

From the console you can explore the WebSphere topology, profiles (`AppSrv01`), nodes, application servers, and traditional configuration that will later be evaluated by the AMA Data Collector.

---

## Step 6 — tWAS Verification & Legacy EAR Diagnostics

### 6.1 Check tWAS Server Status

Verify in container logs that traditional WebSphere has completed initialization:

```bash
podman logs pedjasapp-twas | grep "WSVR0001I"
```

Expected output:
```
WSVR0001I: Server server1 open for e-business
```

### 6.2 tWAS Deployment Diagnostics: Why `pedjasapp.ear` fails

!!! warning "Educational Behavior: Detecting EJB 2.x CMP Incompatibilities"
    If you attempt to deploy `pedjasapp.ear` directly in tWAS or browse to **[http://localhost:9080/pedjasapp/](http://localhost:9080/pedjasapp/)**, the server will log:
    
    ```text
    ADMA0209E: Enterprise JavaBeans (EJB) module pedjasapp-ejb.jar contains the following
    container-managed persistence (CMP) or bean-managed persistence (BMP) Entity beans: ProductoEJB.
    SRVE0255E: A WebGroup/Virtual Host to handle /pedjasapp/ has not been defined.
    ```
    
    **Why does this happen?**
    
    1. **EJB 2.x CMP (`ProductoEJB`)**: In traditional tWAS, Container-Managed Persistence Entity Beans required database-specific code generation via the proprietary `ejbdeploy` tool.
    2. **Legacy Descriptors and JNDI**: The EAR contains bindings in `ibm-ejb-jar-bnd.xml`, `ibm-web-bnd.xml`, and calls to `com.ibm.websphere.*` APIs.
    
    This is precisely the **classic modernization challenge** that we will analyze in the next lab with **IBM Application Modernization Accelerator (AMA)** to plan its transformation into **Jakarta EE 10 / JPA** on **WebSphere Liberty** (where the application will run fully and interactively on port 9081 / Labs 4 and 5).

---

## Step 7 — Collect the EAR for AMA Analysis

In **Lab 2**, we will need the full EAR package to perform the AMA analysis.

```bash
# Use the EAR generated directly by Maven (recommended)
cp pedjasapp-twas/pedjasapp-ear/target/pedjasapp.ear ./pedjasapp-para-ama.ear

# Alternatively, copy from container if already running
# podman cp pedjasapp-twas:/tmp/pedjasapp.ear ./pedjasapp-para-ama.ear

# Inspect EAR contents
jar tf pedjasapp-para-ama.ear
```

Expected output:
```
META-INF/application.xml
pedjasapp-ejb.jar
pedjasapp-web.war
```

---

## Troubleshooting

### Container Does Not Start

```bash
# View the last log lines
podman logs --tail 50 pedjasapp-twas

# Inspect container status
podman inspect pedjasapp-twas | grep Status
```

### Administrative Console Does Not Respond

```bash
# Verify port mappings
podman port pedjasapp-twas

# Check if wsadmin process is active
podman exec pedjasapp-twas ps aux | grep was
```

### Application Returns 404

- Verify that the application is in **Started** state in the admin console
- Confirm context root: must be `/pedjasapp`
- Review server logs: `podman exec pedjasapp-twas cat /opt/IBM/WebSphere/AppServer/profiles/AppSrv01/logs/server1/SystemOut.log | grep -i error`

---

## Summary

!!! success "Completed"
    In this lab you have:

    - Built PedjasApp for tWAS using Maven
    - Started a Podman container with WebSphere Application Server 9.0
    - Inspected the traditional WebSphere admin console, profiles, and runtime behavior
    - Diagnosed the expected EJB 2.x CMP incompatibilities in tWAS (without `ejbdeploy`)
    - Collected the EAR artifact ready for AMA analysis in Lab 2

---

## Next Step

Proceed to **[Lab 2 — AMA Analysis](../lab2/index.en.md)**, where you will run IBM Transformation Advisor on the generated EAR and interpret detected modernization rules.
