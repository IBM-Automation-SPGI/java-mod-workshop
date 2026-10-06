# Lab 4 — Despliegue en WebSphere Liberty

---

## Objetivo del Lab

En este lab construirás la imagen Docker de la aplicación PedjasApp modernizada y la desplegarás en **WebSphere Liberty**. Verificarás que la funcionalidad es equivalente a la versión tWAS y analizarás las diferencias de configuración.

---

## Estructura del Proyecto Liberty

```
pedjasapp-liberty/
├── pom.xml                                    # POM Maven — WAR único
├── Dockerfile                                 # Imagen Docker Liberty
├── server.xml                                 # Configuración WebSphere Liberty
└── src/
    ├── main/
    │   ├── java/
    │   │   └── com/pedjas/
    │   │       ├── entity/                    # Entidades JPA
    │   │       │   ├── Producto.java
    │   │       │   ├── Cliente.java
    │   │       │   ├── Pedido.java
    │   │       │   └── LineaPedido.java
    │   │       ├── service/                   # Session Beans EJB 3.x
    │   │       │   ├── CatalogoService.java
    │   │       │   ├── PedidoService.java
    │   │       │   └── NotificacionService.java
    │   │       └── web/                       # Servlets
    │   │           ├── CatalogoServlet.java
    │   │           ├── PedidoServlet.java
    │   │           └── InicioServlet.java
    │   ├── resources/
    │   │   └── META-INF/
    │   │       ├── persistence.xml            # Configuración JPA
    │   │       └── datos-prueba.sql           # Datos de prueba
    │   └── webapp/
    │       ├── WEB-INF/
    │       │   └── web.xml                    # Descriptor estándar
    │       └── views/                         # JSPs
    │           ├── inicio.jsp
    │           ├── catalogo.jsp
    │           └── pedidos.jsp
    └── test/
        └── java/                              # Tests unitarios
```

---

## `server.xml` Completo y Comentado

```xml title="pedjasapp-liberty/server.xml"
<?xml version="1.0" encoding="UTF-8"?>
<!--
  server.xml — Configuración de WebSphere Liberty para PedjasApp modernizada
  
  Este fichero define todas las características (features) y recursos necesarios
  para ejecutar PedjasApp en Open Liberty 26.x (LTS).
  
  Referencia: https://www.ibm.com/docs/en/was-liberty/
-->
<server description="PedjasApp Liberty Server">

    <!--
      ================================================================
      FEATURES — Capacidades de Jakarta EE habilitadas en este servidor
      ================================================================
      Sólo se activan las features que PedjasApp necesita, siguiendo
      el principio de mínimo privilegio de Liberty.
    -->
    <featureManager>
        <!-- Jakarta Servlet 5.0 — para los Servlets de PedjasApp -->
        <feature>servlet-5.0</feature>

        <!-- Jakarta Server Pages (JSP) 3.0 — para las vistas JSP -->
        <feature>pages-3.0</feature>

        <!-- Enterprise JavaBeans (EJB) 3.2 — Session Beans -->
        <feature>ejb-3.2</feature>

        <!-- Contexts and Dependency Injection (CDI) 3.0 -->
        <feature>cdi-3.0</feature>

        <!-- Jakarta Persistence (JPA) 2.2 / EclipseLink -->
        <feature>jpa-2.2</feature>

        <!-- Jakarta Transactions (JTA) 2.0 -->
        <feature>transaction-2.0</feature>

        <!-- Jakarta Messaging (JMS) 2.0 — para notificaciones asíncronas -->
        <feature>jms-2.0</feature>

        <!-- Servidor de mensajería integrado Liberty (wasJmsServer) -->
        <feature>wasJmsServer-1.0</feature>

        <!-- Cliente JMS integrado Liberty -->
        <feature>wasJmsClient-2.0</feature>

        <!-- JNDI — para inyección de recursos vía java:comp/env -->
        <feature>jndi-1.0</feature>

        <!-- MicroProfile Health — endpoint /health para liveness/readiness -->
        <feature>mpHealth-4.0</feature>

        <!-- MicroProfile Metrics — endpoint /metrics para monitorización -->
        <feature>mpMetrics-5.0</feature>
    </featureManager>

    <!--
      ================================================================
      ENDPOINT HTTP — Puerto y host del servidor
      ================================================================
    -->
    <httpEndpoint id="defaultHttpEndpoint"
                  host="*"
                  httpPort="9080"
                  httpsPort="9443"/>

    <!--
      ================================================================
      SEGURIDAD TLS — Certificado autofirmado para HTTPS
      ================================================================
      En producción se reemplaza por un certificado firmado por una CA.
    -->
    <keyStore id="defaultKeyStore"
              password="libertyPassword"
              type="PKCS12"
              location="${server.config.dir}/resources/security/key.p12"/>

    <!--
      ================================================================
      BASE DE DATOS — DataSource JDBC para PostgreSQL
      ================================================================
      El driver JDBC de PostgreSQL se incluye como librería compartida.
      Las credenciales provienen de variables de entorno para no
      almacenar contraseñas en texto plano en este fichero.
    -->
    <library id="PostgreSQLLib">
        <!-- El JAR del driver se copia al contenedor por el Dockerfile -->
        <fileset dir="${shared.resource.dir}/jdbc"
                 includes="postgresql-42.7.0.jar"/>
    </library>

    <dataSource id="pedjasappDS"
                jndiName="jdbc/pedjasappDS"
                statementCacheSize="60"
                isolationLevel="TRANSACTION_READ_COMMITTED">
        <!--
          jdbcDriver referencia la librería compartida definida arriba.
          El className es el driver JDBC de PostgreSQL.
        -->
        <jdbcDriver libraryRef="PostgreSQLLib"/>
        <properties.postgresql
            serverName="${env.PEDJASAPP_DB_HOST}"
            portNumber="${env.PEDJASAPP_DB_PORT}"
            databaseName="${env.PEDJASAPP_DB_NAME}"
            user="${env.PEDJASAPP_DB_USER}"
            password="${env.PEDJASAPP_DB_PASSWORD}"
            ssl="false"
            socketTimeout="30"/>
        <!--
          Connection pool — ajustado para una instancia Docker de desarrollo.
          En producción, incrementar maxPoolSize según la carga esperada.
        -->
        <connectionManager
            minPoolSize="2"
            maxPoolSize="15"
            maxIdleTime="5m"
            connectionTimeout="30s"
            reapTime="3m"/>
    </dataSource>

    <!--
      ================================================================
      JMS — Mensajería asíncrona para notificaciones de pedidos
      ================================================================
      Se usa el servidor de mensajería integrado de Liberty (Liberty
      Messaging Server) para simplificar el despliegue. En producción
      se puede sustituir por IBM MQ o ActiveMQ mediante un Resource Adapter.
    -->

    <!-- Cola de notificaciones de pedidos -->
    <wasJmsQueue id="PedjasNotificacionesQ"
                 jndiName="jms/PedjasNotificacionesQ">
        <properties.wasJms queueName="PedjasNotificaciones"/>
    </wasJmsQueue>

    <!-- Connection Factory para el servidor de mensajería integrado -->
    <wasJmsConnectionFactory id="PedjasQCF"
                             jndiName="jms/PedjasQCF">
        <properties.wasJms
            remoteServerAddress="localhost:7276:BootstrapBasicMessaging"/>
    </wasJmsConnectionFactory>

    <!-- Servidor de mensajería integrado Liberty -->
    <messagingEngine>
        <queue id="PedjasNotificaciones"/>
    </messagingEngine>

    <!--
      ================================================================
      JPA — Configuración del proveedor de persistencia
      ================================================================
      Liberty incluye EclipseLink como proveedor JPA por defecto.
      La unidad de persistencia "pedjasappPU" está definida en
      src/main/resources/META-INF/persistence.xml.
    -->
    <jpaContainer defaultPersistenceProvider="eclipselink"/>

    <!--
      ================================================================
      APLICACIÓN — Despliegue de PedjasApp
      ================================================================
      Liberty detecta y despliega automáticamente los archivos WAR/EAR
      colocados en el directorio /config/apps (o dropins).
    -->
    <webApplication id="pedjasapp"
                    location="pedjasapp.war"
                    contextRoot="/pedjasapp"/>

    <!--
      ================================================================
      LOGGING — Formato de logs para contenedores Docker
      ================================================================
      El formato JSON facilita la integración con herramientas de
      observabilidad como Instana, ELK Stack o Splunk.
    -->
    <logging
        consoleLogLevel="INFO"
        messageFormat="json"
        logDirectory="${server.output.dir}/logs"
        maxFiles="5"
        maxFileSize="20"/>

    <!--
      ================================================================
      MicroProfile Config — Variables de configuración
      ================================================================
      Permite inyectar configuración desde variables de entorno o
      ficheros de propiedades sin recompilar la aplicación.
    -->
    <mpConfig defaultProperties="${server.config.dir}/bootstrap.properties"/>

</server>
```

---

## `Dockerfile` Completo

```dockerfile title="pedjasapp-liberty/Dockerfile"
# =============================================================================
# Dockerfile — PedjasApp modernizada sobre Open Liberty 26.0.0.9 LTS
# =============================================================================
# Imagen base: Open Liberty con Jakarta EE 10 y MicroProfile 6.1
# Fuente: https://github.com/OpenLiberty/ci.docker/blob/main/docs/icr-images.md
# =============================================================================

# ---- Etapa 1: Compilación Maven ----
FROM maven:3.9.6-eclipse-temurin-17 AS build

WORKDIR /build

# Copiar primero el POM para aprovechar la caché de capas Docker
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copiar el código fuente y compilar
COPY src ./src
RUN mvn clean package -DskipTests -B

# ---- Etapa 2: Imagen final Liberty ----
FROM icr.io/appcafe/open-liberty:26.0.0.9-full-java17-openj9-ubi-minimal

# Metadatos de la imagen
LABEL maintainer="IBM Client Engineering <clientengineering@es.ibm.com>"
LABEL description="PedjasApp — Sistema de Gestión de Pedidos modernizado a WebSphere Liberty"
LABEL version="1.0.0"

# Instalar como root para copiar ficheros de configuración
USER root

# Crear directorio para el driver JDBC
RUN mkdir -p /opt/ibm/wlp/usr/shared/resources/jdbc

# Descargar el driver JDBC de PostgreSQL
# En un entorno de producción, se incluye el JAR en el repositorio de artefactos
ADD https://jdbc.postgresql.org/download/postgresql-42.7.0.jar \
    /opt/ibm/wlp/usr/shared/resources/jdbc/postgresql-42.7.0.jar

# Dar permisos correctos al driver
RUN chown -R 1001:0 /opt/ibm/wlp/usr/shared/resources && \
    chmod -R g+rw /opt/ibm/wlp/usr/shared/resources

# Volver al usuario Liberty (1001) por seguridad
USER 1001

# Copiar la configuración del servidor Liberty
COPY --chown=1001:0 server.xml \
    /config/server.xml

# Copiar el fichero de propiedades de bootstrap (configuración de desarrollo)
COPY --chown=1001:0 src/main/resources/bootstrap.properties \
    /config/bootstrap.properties

# Copiar el WAR compilado en la etapa de build
COPY --from=build --chown=1001:0 /build/target/pedjasapp.war \
    /config/apps/pedjasapp.war

# Instalar las features Liberty declaradas en server.xml
# Este paso se ejecuta en tiempo de build para reducir el tiempo de arranque
RUN /opt/ibm/wlp/bin/installUtility install \
    servlet-5.0 pages-3.0 ejb-3.2 cdi-3.0 jpa-2.2 \
    transaction-2.0 jms-2.0 wasJmsServer-1.0 wasJmsClient-2.0 \
    jndi-1.0 mpHealth-4.0 mpMetrics-5.0 --acceptLicense

# Puerto HTTP y HTTPS expuestos
EXPOSE 9080 9443

# Variables de entorno por defecto (se sobrescriben al ejecutar el contenedor)
ENV PEDJASAPP_DB_HOST=localhost \
    PEDJASAPP_DB_PORT=5432 \
    PEDJASAPP_DB_NAME=pedjasapp \
    PEDJASAPP_DB_USER=pedjas \
    PEDJASAPP_DB_PASSWORD=pedjas123

# Healthcheck usando el endpoint MicroProfile Health
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:9080/health/live || exit 1
```

---

## Paso 1 — Compilar la Versión Liberty

```bash
cd pedjasapp-liberty
mvn clean package -DskipTests

# Verificar el WAR generado
ls -lh target/pedjasapp.war
```

---

## Paso 2 — Arrancar PostgreSQL (Base de Datos)

PedjasApp Liberty utiliza PostgreSQL. Arranca una instancia de desarrollo con Docker:

```bash
docker run -d \
  --name pedjasapp-postgres \
  -e POSTGRES_DB=pedjasapp \
  -e POSTGRES_USER=pedjas \
  -e POSTGRES_PASSWORD=pedjas123 \
  -p 5432:5432 \
  postgres:16-alpine

# Verificar que PostgreSQL está listo
docker exec pedjasapp-postgres pg_isready -U pedjas
```

---

## Paso 3 — Construir la Imagen Docker de Liberty

```bash
cd pedjasapp-liberty

# Construir la imagen (puede tardar varios minutos en la primera ejecución)
docker build -t pedjasapp-liberty:1.0 .

# Verificar la imagen generada
docker images pedjasapp-liberty
```

Salida esperada:
```
REPOSITORY           TAG    IMAGE ID       CREATED         SIZE
pedjasapp-liberty    1.0    abc123def456   2 minutes ago   712MB
```

---

## Paso 4 — Ejecutar el Contenedor Liberty

```bash
docker run -d \
  --name pedjasapp-liberty \
  --link pedjasapp-postgres:postgres \
  -p 9080:9080 \
  -p 9443:9443 \
  -e PEDJASAPP_DB_HOST=postgres \
  -e PEDJASAPP_DB_PORT=5432 \
  -e PEDJASAPP_DB_NAME=pedjasapp \
  -e PEDJASAPP_DB_USER=pedjas \
  -e PEDJASAPP_DB_PASSWORD=pedjas123 \
  pedjasapp-liberty:1.0
```

### Verificar el arranque

```bash
# Seguir los logs hasta el mensaje de servidor listo
docker logs -f pedjasapp-liberty
```

Busca la línea:
```
[AUDIT   ] CWWKF0011I: The defaultServer server is ready to run a smarter planet.
```

---

## Paso 5 — Verificar el Despliegue

### 5.1 Probar la aplicación en el navegador

**[http://localhost:9080/pedjasapp/](http://localhost:9080/pedjasapp/)**

### 5.2 Verificar los endpoints de salud (MicroProfile Health)

```bash
# Estado general del servidor
curl http://localhost:9080/health
# Salida esperada: {"status":"UP","checks":[...]}

# Sólo liveness
curl http://localhost:9080/health/live
# Salida esperada: {"status":"UP"}

# Sólo readiness
curl http://localhost:9080/health/ready
# Salida esperada: {"status":"UP"}
```

### 5.3 Verificar métricas (MicroProfile Metrics)

```bash
# Métricas en formato Prometheus
curl http://localhost:9080/metrics
```

---

## Comparativa: tWAS vs Liberty

| Aspecto | tWAS 9.0 | Liberty 26.x |
|---------|----------|-------------|
| Tiempo de arranque | 3-5 minutos | 5-15 segundos |
| Huella de memoria (heap base) | ~512 MB | ~128 MB |
| Tamaño de imagen Docker | ~3 GB | ~700 MB |
| Configuración | `standalone.xml` + Admin Console | `server.xml` declarativo |
| Características activadas | Todas por defecto | Solo las necesarias |
| Health/Metrics nativos | No | Sí (MicroProfile) |
| Modo contenedor | Limitado | Diseñado para contenedores |

---

## Resumen del Lab 4

!!! success "Completado"
    En este lab has:

    - Revisado el `server.xml` completo de Liberty con todas las features y recursos
    - Entendido el `Dockerfile` de compilación en dos etapas
    - Construido la imagen Docker de PedjasApp Liberty
    - Desplegado y verificado la aplicación en Liberty
    - Comparado el comportamiento entre tWAS y Liberty

---

[← Lab 3 — Modernización Manual](../lab3/index.md) | [Lab 5 — Validación y Siguientes Pasos →](../lab5/index.md)
