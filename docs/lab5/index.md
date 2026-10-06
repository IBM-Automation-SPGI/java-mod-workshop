# Lab 5 — Validación y Siguientes Pasos

---

## Objetivo del Lab

En este lab validarás exhaustivamente que la aplicación PedjasApp modernizada es funcionalmente equivalente a la versión tWAS, revisarás las mejoras de rendimiento y operación, y planificarás los próximos pasos en el viaje de modernización. Es el último lab del flujo principal; el Lab 6 (opcional) cubre el despliegue en Kubernetes/OpenShift.

---

## Checklist de Validación Post-Modernización

Completa los siguientes puntos para confirmar que la migración ha sido exitosa:

### ✅ Validación Funcional

*(Utiliza el puerto `9080` o `9081` según tu configuración de ejecución)*

- [ ] **Inicio y navegación** — La página de inicio carga correctamente en [http://localhost:9080/pedjasapp/](http://localhost:9080/pedjasapp/) (o [http://localhost:9081/pedjasapp/](http://localhost:9081/pedjasapp/))
- [ ] **Autenticación** — Es posible iniciar sesión con el usuario `admin` / contraseña `admin123`
- [ ] **Catálogo de productos** — Se muestran los productos de prueba cargados por `datos-prueba.sql`
- [ ] **Crear pedido** — El flujo completo de creación de pedido funciona sin errores
- [ ] **Consultar pedidos** — La lista de pedidos muestra los datos correctos desde PostgreSQL
- [ ] **Actualizar estado de pedido** — El cambio de estado se persiste correctamente
- [ ] **Notificación JMS** — Al crear un pedido, se envía el mensaje a la cola `PedjasNotificaciones`
- [ ] **Errores controlados** — Los errores de validación se muestran correctamente al usuario

### ✅ Validación de Salud y Endpoints MicroProfile

```bash
# Definir puerto de Liberty (9080 por defecto o 9081 con docker-compose)
LIBERTY_PORT=${LIBERTY_PORT:-9080}

# 1. Verificar liveness
curl -s http://localhost:${LIBERTY_PORT}/health/live | python3 -m json.tool
# Resultado esperado: { "status": "UP" }

# 2. Verificar readiness
curl -s http://localhost:${LIBERTY_PORT}/health/ready | python3 -m json.tool
# Resultado esperado: { "status": "UP" }

# 3. Verificar estado global del servidor
curl -s http://localhost:${LIBERTY_PORT}/health
# Resultado esperado: {"status":"UP","checks":[]}

# 4. Explorar OpenAPI / Swagger UI
# Abre en el navegador: http://localhost:9080/openapi/ui/ (o http://localhost:9081/openapi/ui/)
curl -s -I http://localhost:${LIBERTY_PORT}/openapi/ui/

# 5. Verificar la API REST JAX-RS
curl -s http://localhost:${LIBERTY_PORT}/pedjasapp/api/v1/productos | python3 -m json.tool | head -20
# Resultado esperado: array JSON con los 14 productos del catálogo

# 6. Verificar la página de información del servidor
curl -s -I http://localhost:${LIBERTY_PORT}/pedjasapp/info
# Resultado esperado: 302 → /inicio (si no hay sesión) ó 200 (si hay sesión activa)
```

### ✅ Validación de Logs

```bash
# No deben aparecer errores críticos en los logs de Liberty
podman logs pedjasapp-liberty 2>&1 | grep -i "ERROR\|SEVERE\|Exception"
# Salida esperada: (vacía — ningún error)

# Verificar que las features se cargaron correctamente
podman logs pedjasapp-liberty 2>&1 | grep "CWWKF0012I"
# Cada feature debe aparecer con estado "ready"
```

### ✅ Validación de Métricas Prometheus

```bash
# Verificar que el endpoint /metrics está activo y devuelve datos Prometheus
curl -s http://localhost:${LIBERTY_PORT}/metrics | head -20
# Resultado esperado: líneas del tipo:
# # HELP base_classloader_loadedClasses_count ...
# # TYPE base_classloader_loadedClasses_count gauge
# base_classloader_loadedClasses_count 8351.0

# Verificar que Liberty expone métricas de JVM
curl -s http://localhost:${LIBERTY_PORT}/metrics | grep "jvm_"
```

### ✅ Validación de Rendimiento Básico

```bash
# Medir el tiempo de respuesta de la página principal
curl -o /dev/null -s -w "Tiempo total: %{time_total}s\n" \
  http://localhost:${LIBERTY_PORT}/pedjasapp/

# Resultado esperado: < 500ms en la primera petición tras el arranque
```

### ✅ Validación de Persistencia

```bash
# Comprobar que las tablas JPA se han creado en PostgreSQL
podman exec pedjasapp-postgres \
  psql -U pedjas -d pedjasapp -c "\dt"
# Resultado esperado: tablas PRODUCTOS, CLIENTES, PEDIDOS, LINEAS_PEDIDO

# Comprobar que los datos de prueba se han cargado
podman exec pedjasapp-postgres \
  psql -U pedjas -d pedjasapp -c "SELECT COUNT(*) FROM PRODUCTOS;"
# Resultado esperado: 14 (los 14 productos del script datos-prueba.sql)
```

---

## Comparativa Funcional tWAS vs Liberty

Ejecuta las mismas pruebas en ambos entornos y registra los resultados:

| Prueba Funcional | tWAS 9.0 | Liberty 26.x | ¿Equivalente? |
|-----------------|----------|-------------|--------------|
| Listar productos | ✅ | ✅ | ✅ Sí |
| Crear pedido | ✅ | ✅ | ✅ Sí |
| Notificación JMS | ✅ | ✅ | ✅ Sí |
| Gestión de sesión | ✅ | ✅ | ✅ Sí |
| Manejo de errores | ✅ | ✅ | ✅ Sí |
| Consulta con JPA | N/A (EJB CMP) | ✅ | ✅ Mejorado |

---

## Consideraciones de Rendimiento en Liberty

### Arranque Rápido

Liberty está diseñado para un arranque extremadamente rápido:

```bash
# Medir el tiempo de arranque de Liberty
time podman start pedjasapp-liberty
# Resultado esperado: 5-15 segundos hasta "server is ready"

# Comparar con tWAS
time podman start pedjasapp-twas
# Resultado esperado: 3-5 minutos
```

### Uso de Memoria

```bash
# Ver el consumo de memoria de cada contenedor
podman stats pedjasapp-liberty pedjasapp-twas --no-stream

# Resultado esperado:
# pedjasapp-liberty:  ~200-350 MB RSS
# pedjasapp-twas:     ~1.2-2 GB RSS
```

### Consejos de Optimización para Liberty

1. **JVM OpenJ9**: Liberty usa OpenJ9 por defecto, que es más eficiente en memoria que HotSpot
2. **Features mínimas**: Activar únicamente las features necesarias reduce el tiempo de arranque
3. **Shared Class Cache**: OpenJ9 puede compartir clases JIT entre reinicios, acelerando el arranque
4. **Class Data Sharing (CDS)**: Configurable en Liberty para reducir el tiempo de primera respuesta

```xml
<!-- Añadir a server.xml para habilitar Class Data Sharing -->
<jvm>
    <option value="-Xshareclasses:name=libertyShared,cacheDir=/tmp/liberty-cache"/>
</jvm>
```

---

## Consideraciones de Operación en Contenedores

### Señales de Parada Adecuadas

Liberty respeta la señal `SIGTERM` de Podman para un apagado ordenado:

```bash
# Apagado ordenado (graceful shutdown)
podman stop pedjasapp-liberty   # Envía SIGTERM, espera hasta 10s

# Liberty cerrará:
# 1. Las conexiones HTTP activas
# 2. Las transacciones JTA en curso
# 3. El pool de conexiones JDBC
# 4. El cliente JMS
```

### Variables de Entorno y Secretos

En producción, las credenciales NO deben pasarse como variables de entorno planas. Usa:

```yaml title="k8s/postgres-deployment.yaml (extracto — Secret)"
apiVersion: v1
kind: Secret
metadata:
  name: postgres-secret
  namespace: pedjasapp
type: Opaque
stringData:
  username: pedjas
  password: "contraseña-segura-produccion"
```

```yaml title="k8s/open-liberty-application.yaml (extracto — referencia al Secret)"
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

## Próximos Pasos Sugeridos

### Nivel 1 — Completar la Contenedorización

- [ ] **Publicar la imagen en un registro de contenedores** (IBM Container Registry, Quay.io)
- [ ] **Verificar el fichero `docker-compose.yml`** incluido en el repositorio para ejecutar Liberty + PostgreSQL con un solo comando (compatible con `podman-compose` y `docker compose`)
- [ ] **Implementar escaneo de vulnerabilidades** en la imagen de contenedor (IBM VA, Trivy, Snyk)

### Nivel 2 — Despliegue en Kubernetes / OpenShift

- [ ] **Crear los manifiestos Kubernetes** (Deployment, Service, ConfigMap, Secret, HorizontalPodAutoscaler)
- [ ] **Configurar un Ingress o Route** para exponer la aplicación externamente
- [ ] **Implementar Liveness/Readiness Probes** apuntando a los endpoints MicroProfile Health
- [ ] **Configurar PersistentVolumeClaims** para los datos de PostgreSQL

```yaml title="Ejemplo de manifiesto Kubernetes básico"
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

### Nivel 3 — Pipeline CI/CD

- [ ] **Crear un pipeline GitHub Actions o Tekton** para:
  - Ejecutar tests unitarios con Maven
  - Construir y escanear la imagen Docker
  - Publicar la imagen en el registro
  - Desplegar automáticamente en un entorno de desarrollo
- [ ] **Implementar GitOps** con ArgoCD para sincronización automática del estado deseado

### Nivel 4 — Monitorización y Observabilidad

- [ ] **Integrar Instana** para monitorización APM end-to-end
- [ ] **Configurar alertas** basadas en los errores y latencia de PedjasApp
- [ ] **Crear dashboards** con las métricas MicroProfile expuestas en `/metrics`
- [ ] **Implementar trazado distribuido** con OpenTelemetry y Jaeger

```xml title="Añadir a server.xml para OpenTelemetry"
<!-- Feature de MicroProfile Telemetry para trazado distribuido -->
<feature>mpTelemetry-1.1</feature>

<mpTelemetry
    exporter.otlp.endpoint="http://jaeger:4318"
    exporter.otlp.protocol="http/protobuf"/>
```

### Nivel 5 — Modernización Adicional del Código

- [ ] **Adoptar MicroProfile Config** para toda la configuración externalizada en lugar de variables de entorno directas
- [ ] **Implementar Circuit Breaker** con MicroProfile Fault Tolerance para mayor resiliencia
- [ ] **Añadir API REST** con MicroProfile OpenAPI para exponer los servicios de negocio como API pública
- [ ] **Migrar a microservicios** extrayendo dominios de negocio independientes (catálogo, pedidos, notificaciones)

---

## Recursos Adicionales y Referencias

### Documentación Oficial

| Recurso | URL |
|---------|-----|
| WebSphere Liberty Documentation | [ibm.com/docs/was-liberty](https://www.ibm.com/docs/en/was-liberty) |
| IBM Transformation Advisor | [ibm.com/docs/wamt](https://www.ibm.com/docs/en/wamt) |
| Jakarta EE 10 Specification | [jakarta.ee/specifications](https://jakarta.ee/specifications/) |
| MicroProfile Documentation | [microprofile.io/specs](https://microprofile.io/specifications/) |
| OpenLiberty Guides | [openliberty.io/guides](https://openliberty.io/guides/) |
| Liberty Feature List | [openliberty.io/docs/latest/feature-overview.html](https://openliberty.io/docs/latest/feature-overview.html) |

### Repositorios y Herramientas

| Herramienta | Descripción |
|-------------|-------------|
| [WebSphere Liberty](https://www.ibm.com/products/websphere-liberty) | WebSphere Liberty — runtime de IBM para Jakarta EE y MicroProfile |
| [Open Liberty](https://github.com/OpenLiberty/open-liberty) | Versión open source upstream de WebSphere Liberty |
| [Liberty Starter](https://openliberty.io/start/) | Generador de proyectos Liberty |
| [Transformation Advisor](https://www.ibm.com/garage/method/practices/learn/ibm-transformation-advisor) | Guía AMA en IBM Garage |
| [WebSphere Liberty Docker Images (ICR)](https://github.com/WASdev/ci.docker/blob/main/docs/icr-images.md) | Imágenes oficiales WebSphere Liberty en ICR |

### Guías OpenLiberty Recomendadas

- [Crear un servicio REST con JAX-RS](https://openliberty.io/guides/rest-intro.html)
- [Inyectar dependencias con CDI](https://openliberty.io/guides/cdi-intro.html)
- [Persistencia con JPA](https://openliberty.io/guides/jpa-intro.html)
- [Despliegue en Kubernetes](https://openliberty.io/guides/kubernetes-intro.html)
- [Health con MicroProfile](https://openliberty.io/guides/microprofile-health.html)

---

## Resolución de Problemas Frecuentes

### Liberty no arranca (la aplicación no responde)

```bash
# Ver las últimas 100 líneas de logs de Liberty
podman logs --tail 100 pedjasapp-liberty

# Buscar errores de conexión a la base de datos
podman logs pedjasapp-liberty 2>&1 | grep -i "datasource\|postgres\|jdbc\|CWWJP\|CWWKE"
```

**Causas frecuentes:**
- PostgreSQL no está arrancado o no es accesible desde la red del contenedor.
  → Verifica con `podman exec pedjasapp-postgres pg_isready -U pedjas`
- Variables de entorno de base de datos incorrectas.
  → Revisa los valores `-e PEDJASAPP_DB_*` en el comando `podman run`
- El WAR no se ha incluido en la imagen (fallo silencioso del build).
  → Reconstruye con `podman build --no-cache -t pedjasapp-liberty:1.0 .`

### `/health/live` devuelve `DOWN`

```bash
# Consultar el detalle de qué check está fallando
curl -s http://localhost:${LIBERTY_PORT}/health | python3 -m json.tool
```

Un estado `DOWN` normalmente indica que la conexión a PostgreSQL no está disponible o que el JPA no pudo inicializar las tablas. Revisa los logs de arranque en busca de `CWWJP9991I` (error JPA).

### El endpoint `/metrics` devuelve 401 Unauthorized

Asegúrate de que el `server.xml` contiene `<mpMetrics authentication="false"/>`. Sin esta línea, Liberty requiere autenticación básica para acceder a las métricas.

---

## Resumen del Workshop Completo

!!! success "¡Felicidades! Has completado el Workshop de Modernización Java"

    A lo largo de los labs has aprendido a:

    1. ✅ **[Lab 0]** Configurar el entorno y entender la arquitectura de modernización
    2. ✅ **[Lab 1]** Desplegar una aplicación Java EE en WebSphere Application Server tradicional
    3. ✅ **[Lab 2]** Ejecutar IBM AMA y analizar los resultados de modernización
    4. ✅ **[Lab 3 / 3B]** Aplicar los cambios de código guiados por AMA de forma manual o con IBM Bob
    5. ✅ **[Lab 4]** Construir y desplegar la aplicación modernizada en WebSphere Liberty
    6. ✅ **[Lab 5]** Validar la migración y planificar los próximos pasos

    La aplicación PedjasApp ha pasado de ser una aplicación monolítica atada a tWAS a una aplicación moderna, lista para contenedores, con configuración declarativa y soporte nativo para observabilidad y Kubernetes.

---


## Siguiente Paso (Opcional)

Si quieres ir más allá, continúa con el **[Lab 6 — Kubernetes & OpenShift](../lab6/index.md)**, donde desplegarás PedjasApp Liberty en un clúster cloud-native usando el **Open Liberty Operator**.

