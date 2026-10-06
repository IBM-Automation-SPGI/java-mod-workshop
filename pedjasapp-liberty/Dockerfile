# =============================================================================
# Dockerfile — PedjasApp modernizada sobre WebSphere Liberty 24.0.0.3
# Compilación en dos etapas: Maven build + imagen final Liberty
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

# ---- Etapa 2: Imagen final Liberty ----
FROM ibmcom/websphere-liberty:24.0.0.3-full-java17-openj9

LABEL maintainer="IBM Client Engineering"
LABEL description="PedjasApp Liberty — Workshop de Modernización Java"
LABEL version="1.0.0"

USER root

RUN mkdir -p /opt/ibm/wlp/usr/shared/resources/jdbc && \
    chown -R 1001:0 /opt/ibm/wlp/usr/shared/resources && \
    chmod -R g+rw /opt/ibm/wlp/usr/shared/resources

USER 1001

# Copiar el driver JDBC desde la etapa de build
COPY --from=build /build/jdbc/postgresql-42.7.0.jar \
     /opt/ibm/wlp/usr/shared/resources/jdbc/postgresql-42.7.0.jar

# Copiar la configuración y la aplicación
COPY server.xml /config/server.xml
COPY src/main/resources/bootstrap.properties /config/bootstrap.properties
COPY --from=build /build/target/pedjasapp.war /config/apps/pedjasapp.war

# Instalar las features Liberty declaradas en server.xml
RUN /opt/ibm/wlp/bin/installUtility install \
    servlet-5.0 pages-3.0 ejb-3.2 cdi-3.0 jpa-2.2 \
    transaction-2.0 jms-2.0 wasJmsServer-1.0 wasJmsClient-2.0 \
    jndi-1.0 mpHealth-4.0 mpMetrics-5.0 --acceptLicense

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

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:9080/health/live || exit 1
