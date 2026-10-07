# Lab 4 — Despliegue en WebSphere Liberty

<span class="lab-badge">Lab 4</span><span class="lab-time">⏱ 30–45 minutos</span>

---

## Objetivo del Lab

En este lab construirás la imagen de contenedor de la aplicación PedjasApp modernizada y la desplegarás en **WebSphere Liberty 26.0.0.9**. Verificarás que la funcionalidad es equivalente a la versión tWAS y analizarás las diferencias de configuración.

!!! tip "⏱ Duración estimada: 30–45 minutos"
    Incluye la revisión de la estructura del proyecto Liberty, la comprensión del `server.xml` y el `Dockerfile`, la construcción de la imagen y el primer arranque del contenedor con PostgreSQL.

---

## Estructura del Proyecto Liberty

```
pedjasapp-liberty/
├── pom.xml                                    # POM Maven — WAR único
├── Dockerfile                                 # Imagen de contenedor Liberty
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
    │   │       │   ├── ClienteService.java
    │   │       │   ├── PedidoService.java
    │   │       │   └── NotificacionService.java
    │   │       ├── rest/                      # API REST JAX-RS
    │   │       │   ├── JaxRsApp.java
    │   │       │   ├── ProductosResource.java
    │   │       │   └── PedidosResource.java
    │   │       └── web/                       # Servlets
    │   │           ├── CatalogoServlet.java
    │   │           ├── InfoServlet.java
    │   │           ├── InicioServlet.java
    │   │           ├── MetricsDashboardServlet.java
    │   │           └── PedidoServlet.java
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
    │           ├── pedidos.jsp
    │           ├── versioninfo.jsp
    │           ├── metrics-dashboard.jsp
    │           ├── error404.jsp
    │           └── error500.jsp
    └── test/
        └── java/                              # Tests unitarios
```

---

## `server.xml` Completo y Comentado

```xml title="pedjasapp-liberty/server.xml"
<?xml version="1.0" encoding="UTF-8"?>
<!--
  server.xml — Configuración de WebSphere Liberty 26.0.0.9 para PedjasApp modernizada.
  
  Este fichero define todas las características (features) y recursos necesarios
  para ejecutar PedjasApp sobre Jakarta EE 10 y MicroProfile 6.1.
  
  Referencia: https://www.ibm.com/docs/en/was-liberty/
-->
<server description="PedjasApp Liberty Server">

    <!--
      ================================================================
      FEATURES — Capacidades de Jakarta EE 10 habilitadas en este servidor
      ================================================================
      Solo se activan las features que PedjasApp necesita, siguiendo
      el principio de mínimo privilegio de Liberty.
    -->
    <featureManager>
        <!-- Jakarta Servlet 6.0 — Jakarta EE 10 -->
        <feature>servlet-6.0</feature>

        <!-- Jakarta Server Pages 3.1 — Jakarta EE 10 -->
        <feature>pages-3.1</feature>

        <!-- Jakarta Enterprise Beans 4.0 — Jakarta EE 10 (antiguo EJB 3.2) -->
        <feature>enterpriseBeans-4.0</feature>

        <!-- Contexts and Dependency Injection 4.0 — Jakarta EE 10 -->
        <feature>cdi-4.0</feature>

        <!-- Jakarta Persistence 3.1 / EclipseLink — Jakarta EE 10 -->
        <feature>persistence-3.1</feature>

        <!-- Jakarta Messaging 3.1 API — Jakarta EE 10 -->
        <!-- NOTA: jta-2.0 no existe como feature independiente; -->
        <!-- las transacciones vienen incluidas vía persistence-3.1 -->
        <feature>messaging-3.1</feature>

        <!-- Servidor de mensajería integrado Liberty para Jakarta Messaging 3.x -->
        <feature>messagingServer-3.0</feature>

        <!-- Cliente Liberty para Jakarta Messaging 3.x -->
        <feature>messagingClient-3.0</feature>

        <!-- Message-Driven Beans Jakarta EE 10 -->
        <feature>mdb-4.0</feature>

        <!-- JNDI — para inyección de recursos vía java:comp/env -->
        <feature>jndi-1.0</feature>

        <!-- MicroProfile Health 4.0 — endpoint /health para liveness/readiness -->
        <feature>mpHealth-4.0</feature>

        <!-- MicroProfile Metrics 5.0 — endpoint /metrics para monitorización -->
        <feature>mpMetrics-5.0</feature>

        <!-- Jakarta RESTful Web Services 3.1 (JAX-RS + RESTEasy) -->
        <feature>restfulWS-3.1</feature>

        <!-- Jakarta JSON Binding 3.0 — serialización JSON para la API REST -->
        <feature>jsonb-3.0</feature>

        <!-- MicroProfile OpenAPI 3.1 — documentación y explorador Swagger en /openapi/ui -->
        <feature>mpOpenAPI-3.1</feature>
    </featureManager>

    <!-- Habilita acceso a /metrics sin requerir autenticación para monitorización/Prometheus -->
    <mpMetrics authentication="false"/>

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
        <!--
          Usamos <properties> genérico con URL JDBC para compatibilidad con el driver
          postgresql-42.x.jar (PGDriver). Liberty detecta el driver por la URL.
        -->
        <properties
            url="jdbc:postgresql://${env.PEDJASAPP_DB_HOST}:${env.PEDJASAPP_DB_PORT}/${env.PEDJASAPP_DB_NAME}"
            user="${env.PEDJASAPP_DB_USER}"
            password="${env.PEDJASAPP_DB_PASSWORD}"/>
        <!--
          Connection pool — ajustado para una instancia de desarrollo.
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

    <!-- Cola de notificaciones de pedidos (Jakarta Messaging 3.x) -->
    <jmsQueue id="PedjasNotificacionesQ"
              jndiName="jms/PedjasNotificacionesQ">
        <properties.wasJms queueName="PedjasNotificaciones"/>
    </jmsQueue>

    <!-- Connection Factory para el servidor de mensajería integrado -->
    <jmsConnectionFactory id="PedjasQCF"
                          jndiName="jms/PedjasQCF">
        <properties.wasJms
            remoteServerAddress="localhost:7276:BootstrapBasicMessaging"/>
    </jmsConnectionFactory>

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
      LOGGING — Formato de logs para contenedores
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

</server>
```

---

## `Dockerfile` Completo

```dockerfile title="pedjasapp-liberty/Dockerfile"
# =============================================================================
# Dockerfile — PedjasApp modernizada sobre WebSphere Liberty 26.0.0.9
# =============================================================================
# Imagen base: WebSphere Liberty con Jakarta EE 10 y MicroProfile 6.1
# Fuente: https://github.com/WASdev/ci.docker/blob/main/docs/icr-images.md
# Las imágenes se descargan sin autenticación desde icr.io/appcafe/websphere-liberty
# =============================================================================

# ---- Etapa 1: Compilación Maven ----
FROM maven:3.9.6-eclipse-temurin-17 AS build

WORKDIR /build

# Descargar dependencias primero para aprovechar la caché de capas
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copiar el código fuente y compilar
COPY src ./src
RUN mvn clean package -DskipTests -B

# Descargar el driver JDBC en la etapa de build para evitar ADD con URL
RUN mkdir -p /build/jdbc && \
    curl -fsSL -o /build/jdbc/postgresql-42.7.0.jar \
    https://jdbc.postgresql.org/download/postgresql-42.7.0.jar

# ---- Etapa 2: Imagen final WebSphere Liberty ----
# Tag: 26.0.0.9-full-java17-openj9-ubi-minimal
# La variante "full" incluye todas las features Jakarta EE 10 + MicroProfile 6.1
# sin necesidad de ejecutar installUtility.
FROM icr.io/appcafe/websphere-liberty:26.0.0.9-full-java17-openj9-ubi-minimal

LABEL maintainer="IBM Client Engineering"
LABEL description="PedjasApp — Workshop de Modernización Java sobre WebSphere Liberty 26.0.0.9"
LABEL version="1.0.0"

USER root

# En WebSphere Liberty ${shared.resource.dir} apunta a /opt/ibm/wlp/usr/shared/resources/
RUN mkdir -p /opt/ibm/wlp/usr/shared/resources/jdbc && \
    chown -R 1001:0 /opt/ibm/wlp/usr/shared/resources && \
    chmod -R g+rw /opt/ibm/wlp/usr/shared/resources

USER 1001

# Copiar el driver JDBC desde la etapa de build
COPY --from=build /build/jdbc/postgresql-42.7.0.jar \
     /opt/ibm/wlp/usr/shared/resources/jdbc/postgresql-42.7.0.jar

# Copiar la configuración y la aplicación
COPY server.xml /config/server.xml
# bootstrap.properties define los valores por defecto de las variables de entorno para desarrollo local.
# Sobreescribir en ejecución con: podman run -e PEDJASAPP_DB_PASSWORD=<valor> ...
COPY src/main/resources/bootstrap.properties /config/bootstrap.properties
COPY --from=build /build/target/pedjasapp.war /config/apps/pedjasapp.war

# La imagen "full" ya incluye todas las features. No se necesita installUtility.

EXPOSE 9080 9443

# Valores de desarrollo por defecto — siempre sobreescribir en entornos reales
# (PEDJASAPP_DB_HOST debe apuntar al nombre del contenedor/servicio de PostgreSQL)
ENV PEDJASAPP_DB_HOST=pedjasapp-postgres \
    PEDJASAPP_DB_PORT=5432 \
    PEDJASAPP_DB_NAME=pedjasapp \
    PEDJASAPP_DB_USER=pedjas

# wget está disponible en ubi-minimal; curl no está en esta imagen
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget -q -O /dev/null http://localhost:9080/health/live || exit 1
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

PedjasApp Liberty utiliza PostgreSQL. Crea la red compartida y arranca una instancia de desarrollo con Podman:

```bash
# Crear la red (solo necesario la primera vez)
podman network create pedjasapp-net

podman run -d \
  --name pedjasapp-postgres \
  --network pedjasapp-net \
  -e POSTGRES_DB=pedjasapp \
  -e POSTGRES_USER=pedjas \
  -e POSTGRES_PASSWORD=pedjas123 \
  -p 5432:5432 \
  postgres:16-alpine

# Verificar que PostgreSQL está listo
podman exec pedjasapp-postgres pg_isready -U pedjas
```

---

## Paso 3 — Construir la Imagen de Contenedor de Liberty

!!! tip "Primera descarga de la imagen base Liberty"
    El Dockerfile usa `icr.io/appcafe/websphere-liberty:26.0.0.9-full-java17-openj9-ubi-minimal` como imagen base (≈ 700 MB). La primera vez que construyas la imagen, Podman descargará la imagen base desde ICR. El proceso puede tardar **5–15 minutos** dependiendo de tu conexión. Las compilaciones posteriores reutilizarán las capas en caché y serán mucho más rápidas.

```bash
cd pedjasapp-liberty

# Construir la imagen (la primera vez descarga la imagen base desde ICR)
podman build -t pedjasapp-liberty:1.0 .

# Verificar la imagen generada
podman images pedjasapp-liberty
```

Salida esperada:
```
REPOSITORY           TAG    IMAGE ID       CREATED         SIZE
pedjasapp-liberty    1.0    abc123def456   2 minutes ago   712MB
```

---

## Paso 4 — Ejecutar el Contenedor Liberty

```bash
# Si se ejecuta de forma independiente (o se detuvo tWAS previamente):
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

# NOTA: Si mantienes tWAS activo en el puerto 9080 o usas docker-compose,
# mapea Liberty al puerto 9081 (-p 9081:9080) para evitar colisiones.
```

### Verificar el arranque

```bash
# Seguir los logs hasta el mensaje de servidor listo
podman logs -f pedjasapp-liberty
```

Busca la línea:
```
[AUDIT   ] CWWKF0011I: The defaultServer server is ready to run a smarter planet.
```

!!! tip "Alternativa rápida: docker-compose"
    El repositorio incluye un fichero `docker-compose.yml` en la raíz que levanta **PostgreSQL + Liberty juntos** con un único comando. Ideal para el workshop:
    ```bash
    # Desde la raíz del repositorio (asegúrate de haber construido la imagen primero)
    cd pedjasapp-liberty && podman build -t pedjasapp-liberty:1.0 . && cd ..

    # Levantar ambos servicios — Liberty queda en http://localhost:9081/pedjasapp/
    podman-compose up -d
    # o con Docker Compose:
    docker compose up -d

    # Ver logs en tiempo real
    podman-compose logs -f pedjasapp-liberty
    ```
    > Liberty se mapea al puerto **9081** en el compose para no colisionar con tWAS (9080).

---

## Paso 5 — Verificar el Despliegue

### 5.1 Probar la aplicación en el navegador

Abre en tu navegador:
👉 **[http://localhost:9081/pedjasapp/](http://localhost:9081/pedjasapp/)** *(o `http://localhost:9080/pedjasapp/` si arrancaste Liberty sin docker-compose)*

Credenciales de prueba:
- **Usuario:** `admin`
- **Contraseña:** `admin123`

### 5.2 Verificar los endpoints de salud (MicroProfile Health)

```bash
# Definir puerto de Liberty (9080 por defecto o 9081 con docker-compose)
LIBERTY_PORT=${LIBERTY_PORT:-9080}

# Estado general del servidor
curl http://localhost:${LIBERTY_PORT}/health
# Salida esperada: {"status":"UP","checks":[...]}

# Sólo liveness
curl http://localhost:${LIBERTY_PORT}/health/live
# Salida esperada: {"status":"UP"}

# Sólo readiness
curl http://localhost:${LIBERTY_PORT}/health/ready
# Salida esperada: {"status":"UP"}

# Explorar OpenAPI / Swagger UI
# Abre en el navegador: http://localhost:${LIBERTY_PORT}/openapi/ui/
```

### 5.3 Verificar métricas (MicroProfile Metrics)

```bash
# Métricas en formato Prometheus
curl http://localhost:${LIBERTY_PORT}/metrics
```

---

## Comparativa: tWAS vs WebSphere Liberty

| Aspecto | tWAS 9.0 | WebSphere Liberty 26.x |
|---------|----------|-------------------|
| Tiempo de arranque | 3-5 minutos | 5-15 segundos |
| Huella de memoria (heap base) | ~512 MB | ~128 MB |
| Tamaño de imagen de contenedor | ~3 GB | ~700 MB |
| Configuración | Admin Console + despliegue manual | `server.xml` declarativo |
| Características activadas | Todas por defecto | Solo las necesarias |
| Health/Metrics nativos | No | Sí (MicroProfile) |
| Modo contenedor | Limitado | Diseñado para contenedores |

---

## Resumen del Lab 4

!!! success "Completado"
    En este lab has:

    - Revisado el `server.xml` completo de Liberty con todas las features y recursos
    - Entendido el `Dockerfile` de compilación en dos etapas
    - Construido la imagen de contenedor de PedjasApp Liberty
    - Desplegado y verificado la aplicación en Liberty
    - Comparado el comportamiento entre tWAS y Liberty

---


## Siguiente Paso

Continúa con el **[Lab 5 — Validación y Siguientes Pasos](../lab5/index.md)**, donde validarás la equivalencia funcional entre la versión tWAS y Liberty y planificarás la ruta hacia Kubernetes.
