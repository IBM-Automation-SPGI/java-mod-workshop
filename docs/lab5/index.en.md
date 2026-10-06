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

```yaml title="Example Kubernetes Secret"
# kubernetes/pedjasapp-secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: pedjasapp-db-secret
type: Opaque
stringData:
  PEDJASAPP_DB_USER: pedjas
  PEDJASAPP_DB_PASSWORD: "production-secure-password"
```

```yaml title="Referencing Secret in Deployment"
env:
  - name: PEDJASAPP_DB_USER
    valueFrom:
      secretKeyRef:
        name: pedjasapp-db-secret
        key: PEDJASAPP_DB_USER
  - name: PEDJASAPP_DB_PASSWORD
    valueFrom:
      secretKeyRef:
        name: pedjasapp-db-secret
        key: PEDJASAPP_DB_PASSWORD
```

---

## Recommended Next Steps

### Tier 1 — Containerization Hardening

- [ ] **Publish image to enterprise registry** (IBM Container Registry, Quay.io)
- [ ] **Maintain `docker-compose.yml` / `podman-compose.yml`** for one-command local orchestration
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
                name: pedjasapp-db-secret
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

- [ ] **Adopt Jakarta EE 10 standards** across remaining legacy patterns
- [ ] **Implement Circuit Breakers** with MicroProfile Fault Tolerance
- [ ] **Expose REST APIs** with MicroProfile OpenAPI

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
