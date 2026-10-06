# Lab 5 — Validation and Next Steps

---

## Lab Objective

In this final lab you will thoroughly validate that the modernized **PedjasApp Liberty** application is functionally equivalent to the legacy tWAS deployment, review operational performance and memory improvements, and map out next architectural stages in your modernization journey.

---

## Post-Modernization Validation Checklist

Complete the following verification steps to confirm migration success:

### ✅ Functional Validation

*(Use port `9080` or `9081` depending on your execution setup)*

- [ ] **Home & Navigation** — The home page loads cleanly at [http://localhost:9080/pedjasapp/](http://localhost:9080/pedjasapp/) (or [http://localhost:9081/pedjasapp/](http://localhost:9081/pedjasapp/))
- [ ] **Authentication** — Successful login with username `admin` / password `admin123`
- [ ] **Product Catalog** — Test products loaded via `datos-prueba.sql` are rendered correctly
- [ ] **Create Order** — End-to-end order placement transaction commits successfully
- [ ] **Query Orders** — Orders list displays accurate records from PostgreSQL
- [ ] **Update Order Status** — State changes persist reliably in database
- [ ] **JMS Notification** — Creating an order dispatches a message to `PedjasNotificaciones` queue
- [ ] **Graceful Error Handling** — Validation errors are rendered clearly to end users

### ✅ Health & MicroProfile Endpoints

```bash
# Define Liberty port (9080 default or 9081 with docker-compose)
LIBERTY_PORT=${LIBERTY_PORT:-9080}

# 1. Verify liveness probe
curl -s http://localhost:${LIBERTY_PORT}/health/live | python3 -m json.tool
# Expected result: { "status": "UP" }

# 2. Verify readiness probe
curl -s http://localhost:${LIBERTY_PORT}/health/ready | python3 -m json.tool
# Expected result: { "status": "UP" }

# 3. Verify overall server health state
curl -s http://localhost:${LIBERTY_PORT}/health
# Expected result: {"status":"UP","checks":[]}

# 4. Explore OpenAPI / Swagger UI
# Open in browser: http://localhost:9080/openapi/ui/ (or http://localhost:9081/openapi/ui/)
curl -s -I http://localhost:${LIBERTY_PORT}/openapi/ui/

# 5. Verify JAX-RS REST API
curl -s http://localhost:${LIBERTY_PORT}/pedjasapp/api/v1/productos | python3 -m json.tool | head -20
# Expected: JSON array with the 14 products from the seed catalog

# 6. Verify server info page
curl -s -I http://localhost:${LIBERTY_PORT}/pedjasapp/info
# Expected: 302 → /inicio (no session) or 200 (active session)
```

### ✅ Log Validation

```bash
# No critical or severe errors should appear in Liberty logs
podman logs pedjasapp-liberty 2>&1 | grep -i "ERROR\|SEVERE\|Exception"
# Expected output: (empty — no errors)

# Verify that all features initialized properly
podman logs pedjasapp-liberty 2>&1 | grep "CWWKF0012I"
# Each feature should report state "ready"
```

### ✅ Prometheus Metrics Validation

```bash
# Confirm that /metrics is active and returns Prometheus-format data
curl -s http://localhost:${LIBERTY_PORT}/metrics | head -20
# Expected: lines like:
# # HELP base_classloader_loadedClasses_count ...
# # TYPE base_classloader_loadedClasses_count gauge
# base_classloader_loadedClasses_count 8351.0

# Confirm JVM metrics are exposed
curl -s http://localhost:${LIBERTY_PORT}/metrics | grep "jvm_"
```

### ✅ Basic Performance Validation

```bash
# Measure response time of main catalog page
curl -o /dev/null -s -w "Total time: %{time_total}s\n" \
  http://localhost:${LIBERTY_PORT}/pedjasapp/

# Expected result: < 500ms on initial request after startup
```

### ✅ Persistence Validation

```bash
# Confirm JPA database tables were generated in PostgreSQL
podman exec pedjasapp-postgres \
  psql -U pedjas -d pedjasapp -c "\dt"
# Expected result: tables PRODUCTOS, CLIENTES, PEDIDOS, LINEAS_PEDIDO

# Confirm seed data was populated
podman exec pedjasapp-postgres \
  psql -U pedjas -d pedjasapp -c "SELECT COUNT(*) FROM PRODUCTOS;"
# Expected result: 14 (the 14 products in datos-prueba.sql)
```

---

## Functional Comparison: tWAS vs. Liberty

Execute identical functional tests across both environments to compare:

| Functional Test | tWAS 9.0 | Liberty 26.x | Equivalent? |
|-----------------|----------|-------------|-------------|
| List products | ✅ | ✅ | ✅ Yes |
| Create order | ✅ | ✅ | ✅ Yes |
| JMS notification | ✅ | ✅ | ✅ Yes |
| Session management | ✅ | ✅ | ✅ Yes |
| Error handling | ✅ | ✅ | ✅ Yes |
| JPA querying | N/A (EJB CMP) | ✅ | ✅ Enhanced |

---

## Performance Considerations in Liberty

### Rapid Startup

Liberty is engineered for rapid container startup:

```bash
# Measure Liberty startup time
time podman start pedjasapp-liberty
# Expected result: 5-15 seconds until "server is ready"

# Compare with tWAS
time podman start pedjasapp-twas
# Expected result: 3-5 minutes
```

### Memory Footprint

```bash
# Compare runtime memory usage across containers
podman stats pedjasapp-liberty pedjasapp-twas --no-stream

# Expected result:
# pedjasapp-liberty:  ~200-350 MB RSS
# pedjasapp-twas:     ~1.2-2 GB RSS
```

### Optimization Tips for Liberty

1. **OpenJ9 JVM**: Liberty utilizes IBM Semeru / OpenJ9 by default, offering superior memory footprint over standard HotSpot.
2. **Minimal Features**: Enabling only required features directly reduces startup time and resource consumption.
3. **Shared Class Cache**: OpenJ9 shares compiled AOT/JIT classes across restarts.
4. **Class Data Sharing (CDS)**: Configurable in Liberty to accelerate time-to-first-response.

```xml
<!-- Add to server.xml for Class Data Sharing -->
<jvm>
    <option value="-Xshareclasses:name=libertyShared,cacheDir=/tmp/liberty-cache"/>
</jvm>
```

---

## Container Operational Considerations

### Graceful Termination Signals

Liberty honors the `SIGTERM` signal for graceful shutdown:

```bash
# Graceful stop
podman stop pedjasapp-liberty   # Sends SIGTERM, waits up to 10s

# Liberty cleanly closes:
# 1. Active HTTP connections
# 2. In-flight JTA transactions
# 3. JDBC connection pools
# 4. JMS messaging clients
```

### Environment Variables & Secrets

In production, never pass plain text credentials. Leverage Kubernetes Secrets:

```yaml title="k8s/postgres-deployment.yaml (excerpt — Secret)"
apiVersion: v1
kind: Secret
metadata:
  name: postgres-secret
  namespace: pedjasapp
type: Opaque
stringData:
  username: pedjas
  password: "production-secure-password"
```

```yaml title="k8s/open-liberty-application.yaml (excerpt — Secret reference)"
env:
  - name: PEDJASAPP_DB_USER
    valueFrom:
      secretKeyRef:
        name: postgres-secret
        key: username
  - name: PEDJASAPP_DB_PASSWORD
    valueFrom:
      secretKeyRef:
        name: postgres-secret
        key: password
```

---

## Recommended Next Steps

### Tier 1 — Containerization Hardening

- [ ] **Publish image to enterprise registry** (IBM Container Registry, Quay.io)
- [ ] **Verify the included `docker-compose.yml`** for one-command local orchestration (compatible with both `podman-compose` and `docker compose`)
- [ ] **Implement container vulnerability scanning** (IBM Vulnerability Advisor, Trivy, Snyk)

### Tier 2 — Kubernetes & OpenShift Deployment

- [ ] **Create Kubernetes manifests** (Deployment, Service, ConfigMap, Secret, HPA)
- [ ] **Configure Ingress / Route** for secure external access
- [ ] **Bind Liveness/Readiness Probes** to MicroProfile Health endpoints
- [ ] **Configure PersistentVolumeClaims** for PostgreSQL storage

```yaml title="Sample Kubernetes Manifest"
# kubernetes/pedjasapp-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pedjasapp
  labels:
    app: pedjasapp
spec:
  replicas: 2
  selector:
    matchLabels:
      app: pedjasapp
  template:
    metadata:
      labels:
        app: pedjasapp
    spec:
      containers:
        - name: pedjasapp
          image: your-registry/pedjasapp-liberty:1.0
          ports:
            - containerPort: 9080
          livenessProbe:
            httpGet:
              path: /health/live
              port: 9080
            initialDelaySeconds: 60
            periodSeconds: 30
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 9080
            initialDelaySeconds: 30
            periodSeconds: 10
          envFrom:
            - secretRef:
                name: postgres-secret
```

### Tier 3 — CI/CD Pipelines & GitOps

- [ ] **Build automated CI/CD pipelines** (GitHub Actions / Tekton) to run JUnit tests, build images, and deploy
- [ ] **Implement GitOps** with ArgoCD for continuous delivery and drift detection

### Tier 4 — Observability & Monitoring

- [ ] **Integrate IBM Instana** for automated APM discovery and full-stack distributed tracing
- [ ] **Set up SLO alerts** for error rates and latency
- [ ] **Publish Prometheus dashboards** using `/metrics` data
- [ ] **Integrate OpenTelemetry distributed tracing**

```xml title="Add to server.xml for OpenTelemetry"
<!-- MicroProfile Telemetry feature -->
<feature>mpTelemetry-1.1</feature>

<mpTelemetry
    exporter.otlp.endpoint="http://jaeger:4318"
    exporter.otlp.protocol="http/protobuf"/>
```

### Tier 5 — Advanced Architecture Modernization

- [ ] **Adopt MicroProfile Config** to externalize all configuration rather than relying on plain environment variables
- [ ] **Implement Circuit Breakers** with MicroProfile Fault Tolerance for increased resilience
- [ ] **Expose REST APIs** with MicroProfile OpenAPI to publish business services as a public API
- [ ] **Decompose into microservices** by extracting independent business domains (catalog, orders, notifications)

---

## References and Resources

### Official Documentation

| Resource | URL |
|----------|-----|
| WebSphere Liberty Documentation | [ibm.com/docs/was-liberty](https://www.ibm.com/docs/en/was-liberty) |
| IBM Transformation Advisor | [ibm.com/docs/wamt](https://www.ibm.com/docs/en/wamt) |
| Jakarta EE 10 Specification | [jakarta.ee/specifications](https://jakarta.ee/specifications/) |
| MicroProfile Documentation | [microprofile.io/specs](https://microprofile.io/specifications/) |
| OpenLiberty Guides | [openliberty.io/guides](https://openliberty.io/guides/) |
| Liberty Feature List | [openliberty.io/docs/latest/feature-overview.html](https://openliberty.io/docs/latest/feature-overview.html) |

### Repositories and Tooling

| Tool | Description |
|------|-------------|
| [WebSphere Liberty](https://www.ibm.com/products/websphere-liberty) | WebSphere Liberty — IBM runtime for Jakarta EE and MicroProfile |
| [Open Liberty](https://github.com/OpenLiberty/open-liberty) | Upstream open source version of WebSphere Liberty |
| [Liberty Starter](https://openliberty.io/start/) | Liberty starter project generator |
| [Transformation Advisor](https://www.ibm.com/garage/method/practices/learn/ibm-transformation-advisor) | AMA Guide in IBM Garage |
| [WebSphere Liberty Docker Images (ICR)](https://github.com/WASdev/ci.docker/blob/main/docs/icr-images.md) | Official WebSphere Liberty images on ICR |

### Recommended OpenLiberty Guides

- [Creating a RESTful Web Service with JAX-RS](https://openliberty.io/guides/rest-intro.html)
- [Injecting Dependencies with CDI](https://openliberty.io/guides/cdi-intro.html)
- [Accessing Databases using JPA](https://openliberty.io/guides/jpa-intro.html)
- [Deploying Applications to Kubernetes](https://openliberty.io/guides/kubernetes-intro.html)
- [Adding MicroProfile Health Checks](https://openliberty.io/guides/microprofile-health.html)

---

## Troubleshooting Common Issues

### Liberty container does not start

```bash
# View last 100 log lines
podman logs --tail 100 pedjasapp-liberty

# Search for database connectivity errors
podman logs pedjasapp-liberty 2>&1 | grep -i "datasource\|postgres\|jdbc\|CWWJP\|CWWKE"
```

**Common causes:**
- PostgreSQL is not running or unreachable from the container network.
  → Verify with `podman exec pedjasapp-postgres pg_isready -U pedjas`
- Incorrect database environment variables.
  → Check the `-e PEDJASAPP_DB_*` values in the `podman run` command
- WAR not included in the image (silent build failure).
  → Rebuild with `podman build --no-cache -t pedjasapp-liberty:1.0 .`

### `/health/live` returns `DOWN`

```bash
# Query the detail of which health check is failing
curl -s http://localhost:${LIBERTY_PORT}/health | python3 -m json.tool
```

A `DOWN` state typically means PostgreSQL is unavailable or JPA failed to initialize tables. Check startup logs for `CWWJP9991I` (JPA initialization error).

### `/metrics` returns `401 Unauthorized`

Verify that `server.xml` contains `<mpMetrics authentication="false"/>`. Without this element, Liberty enforces basic authentication on the metrics endpoint.

---

## Complete Workshop Summary

!!! success "Congratulations! You have completed the Java Modernization Workshop"

    Across these labs you have mastered:

    1. ✅ **[Lab 0]** Configuring the modernization environment and evaluating AS-IS/TO-BE architectures
    2. ✅ **[Lab 1]** Running legacy Java EE workloads on traditional WebSphere Application Server
    3. ✅ **[Lab 2]** Running IBM AMA analysis and diagnosing modernization rules
    4. ✅ **[Lab 3 / 3B]** Applying code refactoring manually or with IBM Bob AI workflows
    5. ✅ **[Lab 4]** Building and deploying containerized workloads on WebSphere Liberty
    6. ✅ **[Lab 5]** Validating functional parity, health probes, and metrics

    PedjasApp has successfully evolved from a rigid tWAS monolith into a high-performance, container-ready cloud-native service.

---

## Optional Next Step

If you want to go further, proceed to **[Lab 6 — Kubernetes & OpenShift](../lab6/index.en.md)** to deploy PedjasApp Liberty on a cloud-native cluster using the **Open Liberty Operator**.
