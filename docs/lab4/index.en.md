# Lab 4 — Deploying on WebSphere Liberty

---

## Lab Objective

In this lab you will package the modernized **PedjasApp Liberty** container image and deploy it on **WebSphere Liberty 26.0.0.9** backed by a **PostgreSQL** relational database. You will verify that the runtime functionality is fully equivalent to the legacy tWAS deployment, validate operational metrics, and inspect configuration differences.

---

## Liberty Project Structure

```
pedjasapp-liberty/
├── pom.xml                                    # Maven POM — Single WAR packaging
├── Dockerfile                                 # Liberty container image definition
├── server.xml                                 # WebSphere Liberty configuration
└── src/
    ├── main/
    │   ├── java/
    │   │   └── com/pedjas/
    │   │       ├── entity/                    # JPA Entities
    │   │       │   ├── Producto.java
    │   │       │   ├── Cliente.java
    │   │       │   ├── Pedido.java
    │   │       │   └── LineaPedido.java
    │   │       ├── service/                   # EJB 3.x Session Beans
    │   │       │   ├── CatalogoService.java
    │   │       │   ├── PedidoService.java
    │   │       │   └── NotificacionService.java
    │   │       └── web/                       # Servlets
    │   │           ├── CatalogoServlet.java
    │   │           ├── PedidoServlet.java
    │   │           └── InicioServlet.java
    │   ├── resources/
    │   │   └── META-INF/
    │   │       ├── persistence.xml            # EclipseLink JPA configuration
    │   │       └── datos-prueba.sql           # Seed data
    │   └── webapp/
    │       ├── WEB-INF/
    │       │   └── web.xml                    # Standard descriptor
    │       └── views/                         # JSP views
    │           ├── inicio.jsp
    │           ├── catalogo.jsp
    │           └── pedidos.jsp
    └── test/
        └── java/                              # Unit & integration tests
```

---

## Complete & Commented `server.xml`

```xml title="pedjasapp-liberty/server.xml"
<?xml version="1.0" encoding="UTF-8"?>
<!--
  server.xml — WebSphere Liberty 26.0.0.9 configuration for modernized PedjasApp.
  
  This file defines all features and resources required to run PedjasApp
  on top of Jakarta EE 10 and MicroProfile 6.1.
  
  Reference: https://www.ibm.com/docs/en/was-liberty/
-->
<server description="PedjasApp Liberty Server">

    <!--
      ================================================================
      FEATURES — Jakarta EE 10 capabilities enabled on this server
      ================================================================
      Only features required by PedjasApp are activated, following
      Liberty's principle of least privilege and minimal footprint.
    -->
    <featureManager>
        <!-- Jakarta Servlet 6.0 — Jakarta EE 10 -->
        <feature>servlet-6.0</feature>

        <!-- Jakarta Server Pages 3.1 — Jakarta EE 10 -->
        <feature>pages-3.1</feature>

        <!-- Jakarta Enterprise Beans 4.0 — Jakarta EE 10 (formerly EJB 3.2) -->
        <feature>enterpriseBeans-4.0</feature>

        <!-- Contexts and Dependency Injection 4.0 — Jakarta EE 10 -->
        <feature>cdi-4.0</feature>

        <!-- Jakarta Persistence 3.1 / EclipseLink — Jakarta EE 10 -->
        <feature>persistence-3.1</feature>

        <!-- Jakarta Messaging 3.1 API — Jakarta EE 10 -->
        <!-- NOTE: jta-2.0 is not an independent feature; -->
        <!-- transactions are included via persistence-3.1 -->
        <feature>messaging-3.1</feature>

        <!-- Integrated Liberty messaging server for Jakarta Messaging 3.x -->
        <feature>messagingServer-3.0</feature>

        <!-- Integrated Liberty messaging client for Jakarta Messaging 3.x -->
        <feature>messagingClient-3.0</feature>

        <!-- Message-Driven Beans Jakarta EE 10 -->
        <feature>mdb-4.0</feature>

        <!-- JNDI — for resource injection via java:comp/env -->
        <feature>jndi-1.0</feature>

        <!-- MicroProfile Health 4.0 — /health endpoint for liveness/readiness -->
        <feature>mpHealth-4.0</feature>

        <!-- MicroProfile Metrics 5.0 — /metrics endpoint for Prometheus monitoring -->
        <feature>mpMetrics-5.0</feature>

        <!-- MicroProfile OpenAPI 3.1 — documentation and Swagger UI at /openapi/ui -->
        <feature>mpOpenAPI-3.1</feature>
    </featureManager>

    <!-- Enable unauthenticated access to /metrics for Prometheus scrapers -->
    <mpMetrics authentication="false"/>

    <!--
      ================================================================
      HTTP ENDPOINT — Server host and ports
      ================================================================
    -->
    <httpEndpoint id="defaultHttpEndpoint"
                  host="*"
                  httpPort="9080"
                  httpsPort="9443"/>

    <!--
      ================================================================
      TLS SECURITY — Self-signed keystore for HTTPS
      ================================================================
      In production, replace with CA-signed certificates.
    -->
    <keyStore id="defaultKeyStore"
              password="libertyPassword"
              type="PKCS12"
              location="${server.config.dir}/resources/security/key.p12"/>

    <!--
      ================================================================
      DATABASE — JDBC DataSource for PostgreSQL
      ================================================================
      PostgreSQL JDBC driver is declared as a shared library.
      Credentials originate from environment variables to avoid plain-text secrets.
    -->
    <library id="PostgreSQLLib">
        <!-- Driver JAR is copied to the container by the Dockerfile -->
        <fileset dir="${shared.resource.dir}/jdbc"
                 includes="postgresql-42.7.0.jar"/>
    </library>

    <dataSource id="pedjasappDS"
                jndiName="jdbc/pedjasappDS"
                statementCacheSize="60"
                isolationLevel="TRANSACTION_READ_COMMITTED">
        <!-- jdbcDriver references the shared library defined above -->
        <jdbcDriver libraryRef="PostgreSQLLib"/>
        <!-- Generic properties element with JDBC URL for PostgreSQL 42.x driver -->
        <properties
            url="jdbc:postgresql://${env.PEDJASAPP_DB_HOST}:${env.PEDJASAPP_DB_PORT}/${env.PEDJASAPP_DB_NAME}"
            user="${env.PEDJASAPP_DB_USER}"
            password="${env.PEDJASAPP_DB_PASSWORD}"/>
        <!-- Connection pool settings -->
        <connectionManager
            minPoolSize="2"
            maxPoolSize="15"
            maxIdleTime="5m"
            connectionTimeout="30s"
            reapTime="3m"/>
    </dataSource>

    <!--
      ================================================================
      JMS — Asynchronous messaging for order notifications
      ================================================================
      Uses the integrated Liberty Messaging Server engine.
    -->

    <!-- Order notifications queue (Jakarta Messaging 3.x) -->
    <jmsQueue id="PedjasNotificacionesQ"
              jndiName="jms/PedjasNotificacionesQ">
        <properties.wasJms queueName="PedjasNotificaciones"/>
    </jmsQueue>

    <!-- Connection Factory for integrated messaging engine -->
    <jmsConnectionFactory id="PedjasQCF"
                          jndiName="jms/PedjasQCF">
        <properties.wasJms
            remoteServerAddress="localhost:7276:BootstrapBasicMessaging"/>
    </jmsConnectionFactory>

    <!-- Embedded messaging engine -->
    <messagingEngine>
        <queue id="PedjasNotificaciones"/>
    </messagingEngine>

    <!--
      ================================================================
      JPA — Persistence provider configuration
      ================================================================
      Liberty includes EclipseLink as the default JPA provider.
    -->
    <jpaContainer defaultPersistenceProvider="eclipselink"/>

    <!--
      ================================================================
      APPLICATION — Web application deployment
      ================================================================
    -->
    <webApplication id="pedjasapp"
                    location="pedjasapp.war"
                    contextRoot="/pedjasapp"/>

    <!--
      ================================================================
      LOGGING — Cloud-native JSON logging format
      ================================================================
    -->
    <logging
        consoleLogLevel="INFO"
        messageFormat="json"
        logDirectory="${server.output.dir}/logs"
        maxFiles="5"
        maxFileSize="20"/>

</server>
```

---

## Complete `Dockerfile`

```dockerfile title="pedjasapp-liberty/Dockerfile"
# =============================================================================
# Dockerfile — Modernized PedjasApp on WebSphere Liberty 26.0.0.9
# =============================================================================
# Base image: WebSphere Liberty with Jakarta EE 10 and MicroProfile 6.1
# Images pull without authentication from icr.io/appcafe/websphere-liberty
# =============================================================================

# ---- Stage 1: Maven Build ----
FROM maven:3.9.6-eclipse-temurin-17 AS build

WORKDIR /build

# Pre-fetch dependencies to leverage layer cache
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source and build
COPY src ./src
RUN mvn clean package -DskipTests -B

# Download JDBC driver in build stage
RUN mkdir -p /build/jdbc && \
    curl -fsSL -o /build/jdbc/postgresql-42.7.0.jar \
    https://jdbc.postgresql.org/download/postgresql-42.7.0.jar

# ---- Stage 2: Final WebSphere Liberty Image ----
FROM icr.io/appcafe/websphere-liberty:26.0.0.9-full-java17-openj9-ubi-minimal

LABEL maintainer="IBM Client Engineering"
LABEL description="PedjasApp — Java Modernization Workshop on WebSphere Liberty 26.0.0.9"
LABEL version="1.0.0"

USER root

# In WebSphere Liberty ${shared.resource.dir} points to /opt/ibm/wlp/usr/shared/resources/
RUN mkdir -p /opt/ibm/wlp/usr/shared/resources/jdbc && \
    chown -R 1001:0 /opt/ibm/wlp/usr/shared/resources && \
    chmod -R g+rw /opt/ibm/wlp/usr/shared/resources

USER 1001

# Copy JDBC driver from build stage
COPY --from=build /build/jdbc/postgresql-42.7.0.jar \
     /opt/ibm/wlp/usr/shared/resources/jdbc/postgresql-42.7.0.jar

# Copy configuration and WAR
COPY server.xml /config/server.xml
# bootstrap.properties is optional — use it to set local default env vars
# without hardcoding them in the Dockerfile. Create the file if needed.
COPY --from=build /build/target/pedjasapp.war /config/apps/pedjasapp.war

EXPOSE 9080 9443

# Development defaults — always override in real environments
# (PEDJASAPP_DB_HOST must point to the PostgreSQL container/service name)
ENV PEDJASAPP_DB_HOST=pedjasapp-postgres \
    PEDJASAPP_DB_PORT=5432 \
    PEDJASAPP_DB_NAME=pedjasapp \
    PEDJASAPP_DB_USER=pedjas

# wget is available in ubi-minimal; curl is not in this image
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget -q -O /dev/null http://localhost:9080/health/live || exit 1
```

---

## Step 1 — Compile Liberty Version

```bash
cd pedjasapp-liberty
mvn clean package -DskipTests

# Verify generated WAR
ls -lh target/pedjasapp.war
```

---

## Step 2 — Start PostgreSQL (Database)

PedjasApp Liberty uses PostgreSQL. Create a shared network and launch a development instance with Podman:

```bash
# Create network (first time only)
podman network create pedjasapp-net

podman run -d \
  --name pedjasapp-postgres \
  --network pedjasapp-net \
  -e POSTGRES_DB=pedjasapp \
  -e POSTGRES_USER=pedjas \
  -e POSTGRES_PASSWORD=pedjas123 \
  -p 5432:5432 \
  postgres:16-alpine

# Verify PostgreSQL readiness
podman exec pedjasapp-postgres pg_isready -U pedjas
```

---

## Step 3 — Build Liberty Container Image

!!! tip "First Liberty Base Image Download"
    The Dockerfile uses `icr.io/appcafe/websphere-liberty:26.0.0.9-full-java17-openj9-ubi-minimal` as the base image (≈ 700 MB). On first build, Podman pulls the base image from ICR. This may take **5–15 minutes** depending on your network speed. Subsequent builds will reuse cached layers and complete in under a minute.

```bash
cd pedjasapp-liberty

# Build image (first run downloads base image from ICR)
podman build -t pedjasapp-liberty:1.0 .

# Verify image
podman images pedjasapp-liberty
```

---

## Step 4 — Run Liberty Container

```bash
# Run container attached to network:
podman run -d \
  --name pedjasapp-liberty \
  --network pedjasapp-net \
  -p 9080:9080 \
  -p 9443:9443 \
  -e PEDJASAPP_DB_HOST=pedjasapp-postgres \
  -e PEDJASAPP_DB_PORT=5432 \
  -e PEDJASAPP_DB_NAME=pedjasapp \
  -e PEDJASAPP_DB_USER=pedjas \
  -e PEDJASAPP_DB_PASSWORD=pedjas123 \
  pedjasapp-liberty:1.0

# NOTE: If you keep tWAS running on 9080 or use compose,
# map Liberty to port 9081 (-p 9081:9080) to avoid collisions.
```

### Verify Startup

```bash
podman logs -f pedjasapp-liberty
```

Look for:
```
[AUDIT   ] CWWKF0011I: The defaultServer server is ready to run a smarter planet.
```

---

## Step 5 — Verify Deployment

### 5.1 Test Application in Browser

Open in your browser:
👉 **[http://localhost:9080/pedjasapp/](http://localhost:9080/pedjasapp/)** *(or `http://localhost:9081/pedjasapp/` if mapped to 9081)*

Test credentials:
- **Username:** `admin`
- **Password:** `admin123`

### 5.2 Verify Health Endpoints (MicroProfile Health)

```bash
LIBERTY_PORT=${LIBERTY_PORT:-9080}

# Overall health
curl http://localhost:${LIBERTY_PORT}/health

# Liveness probe
curl http://localhost:${LIBERTY_PORT}/health/live

# Readiness probe
curl http://localhost:${LIBERTY_PORT}/health/ready

# OpenAPI / Swagger UI
# Open in browser: http://localhost:${LIBERTY_PORT}/openapi/ui/
```

### 5.3 Verify Metrics (MicroProfile Metrics)

```bash
# Prometheus formatted metrics
curl http://localhost:${LIBERTY_PORT}/metrics
```

---

## Comparison: tWAS vs. WebSphere Liberty

| Aspect | tWAS 9.0 | WebSphere Liberty 26.x |
|--------|----------|------------------------|
| Startup time | 3-5 minutes | 5-15 seconds |
| Base memory footprint | ~512 MB | ~128 MB |
| Container image size | ~3 GB | ~700 MB |
| Configuration model | Admin Console + manual steps | Declarative `server.xml` |
| Features activated | All by default | Only required features |
| Native Health / Metrics | No | Yes (MicroProfile) |
| Cloud-native design | Limited | Native container design |

---

## Summary

!!! success "Completed"
    In this lab you have:

    - Reviewed the complete, annotated Liberty `server.xml`
    - Inspected the multi-stage `Dockerfile` build definition
    - Built and containerized the modernized Liberty application
    - Started PostgreSQL and deployed PedjasApp on Liberty
    - Validated runtime behavior, health probes, metrics, and compared with tWAS

---

## Next Step

Proceed to **[Lab 5 — Validation and Next Steps](../lab5/index.en.md)** to verify functional equivalence and explore production deployment paths.
