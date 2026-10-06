# =============================================================================
# Dockerfile — PedjasApp modernizada sobre WebSphere Liberty 26.0.0.9
# Compilación en dos etapas: Maven build + imagen final WebSphere Liberty
# =============================================================================

# ---- Etapa 1: Compilación Maven ----
FROM maven:3.9.6-eclipse-temurin-17 AS build

WORKDIR /build

COPY pom.xml .
RUN mvn dependency:go-offline -B

COPY src ./src
RUN mvn clean package -DskipTests -B

# Descargar el driver JDBC en la etapa de build para evitar ADD con URL
RUN mkdir -p /build/jdbc && \
    curl -fsSL -o /build/jdbc/postgresql-42.7.0.jar \
    https://jdbc.postgresql.org/download/postgresql-42.7.0.jar

# ---- Etapa 2: Imagen final WebSphere Liberty ----
# Imagen oficial WebSphere Liberty en IBM Container Registry (ICR).
# Usar siempre icr.io/appcafe/websphere-liberty (no ibmcom/websphere-liberty en Docker Hub,
# que está retirado). Las imágenes pueden descargarse sin autenticación.
# Tag: 26.0.0.9-full-java17-openj9-ubi-minimal (UBI 10 Minimal, Jakarta EE 10 completo)
FROM icr.io/appcafe/websphere-liberty:26.0.0.9-full-java17-openj9-ubi-minimal

LABEL maintainer="IBM Client Engineering"
LABEL description="PedjasApp — Workshop de Modernización Java sobre WebSphere Liberty 26.0.0.9"
LABEL version="1.0.0"

USER root

# En icr.io/appcafe/websphere-liberty el WLP binario está en /opt/ol/wlp/ (o /opt/ibm/wlp/),
# pero ${shared.resource.dir} apunta a /opt/ibm/wlp/usr/shared/resources/
RUN mkdir -p /opt/ibm/wlp/usr/shared/resources/jdbc && \
    chown -R 1001:0 /opt/ibm/wlp/usr/shared/resources && \
    chmod -R g+rw /opt/ibm/wlp/usr/shared/resources

USER 1001

# Copiar el driver JDBC desde la etapa de build
# checkov:skip=CKV_DOCKER_2: chown en COPY es el patrón oficial IBM Liberty para garantizar permisos del usuario no-root 1001
COPY --from=build /build/jdbc/postgresql-42.7.0.jar \
     /opt/ibm/wlp/usr/shared/resources/jdbc/postgresql-42.7.0.jar

# Copiar la configuración y la aplicación
# checkov:skip=CKV_DOCKER_2: chown en COPY es el patrón oficial IBM Liberty
COPY server.xml /config/server.xml
COPY src/main/resources/bootstrap.properties /config/bootstrap.properties
COPY --from=build /build/target/pedjasapp.war /config/apps/pedjasapp.war

# La imagen "full" ya incluye todas las features Jakarta EE 10 y MicroProfile.
# No es necesario ejecutar installUtility con esta variante.

EXPOSE 9080 9443

# IMPORTANTE: Los valores de las variables de entorno de base de datos
# (PEDJASAPP_DB_HOST, PEDJASAPP_DB_USER, PEDJASAPP_DB_PASSWORD, etc.)
# NO deben definirse aquí con valores reales.
# Pasar estas variables en tiempo de ejecución mediante:
#   docker run -e PEDJASAPP_DB_PASSWORD=<valor> ...
# o mediante secretos de orquestador (Kubernetes Secrets, OpenShift Secrets).
ENV PEDJASAPP_DB_HOST=localhost \
    PEDJASAPP_DB_PORT=5432 \
    PEDJASAPP_DB_NAME=pedjasapp \
    PEDJASAPP_DB_USER=pedjas

# Usamos wget (disponible en ubi-minimal) en lugar de curl para el healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget -q -O /dev/null http://localhost:9080/health/live || exit 1
