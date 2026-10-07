# Lab 1 — Despliegue de la Aplicación en tWAS

<span class="lab-badge">Lab 1</span><span class="lab-time">⏱ 15–20 minutos</span>

---

## Objetivo del Lab

En este lab compilarás el monolito legado **PedjasApp (EAR)**, arrancarás una instancia de **WebSphere Application Server tradicional (tWAS 9.0)** en contenedor y prepararás el entorno y artefactos de origen que serán analizados en profundidad mediante **IBM Application Modernization Accelerator (AMA)** en el Lab 2.

!!! tip "⏱ Duración estimada: 15–20 minutos"
    Incluye la descarga de la imagen de tWAS (~1,5 GB en el primer pull), la compilación del EAR y la verificación del servidor.

---

## Descripción de PedjasApp

**PedjasApp** es un sistema de gestión de pedidos empresarial que simula una aplicación típica de comercio B2B. Incluye:

- **Catálogo de productos** — consulta y búsqueda de artículos disponibles
- **Gestión de pedidos** — creación, consulta y actualización de pedidos
- **Notificaciones asíncronas** — envío de confirmaciones mediante JMS
- **Autenticación básica** — gestión de sesión con EJBs

La aplicación deliberadamente utiliza:

- EJB 2.x (Entity Beans) y EJB 3.x (Session Beans)
- APIs propietarias `com.ibm.websphere.*`
- JNDI con namespaces WAS
- JMS sobre recursos WAS
- Datasource configurado en binding WAS (`ibm-web-bnd.xml`)

Estas características hacen de PedjasApp el candidato ideal para analizar con AMA.

---

## Paso 1 — Preparar la imagen de tWAS

IBM proporciona imágenes oficiales de WebSphere Application Server traditional en IBM Container Registry (ICR).

### 1.1 Descargar la imagen de tWAS 9.0

Las imágenes de tWAS están disponibles en `icr.io/appcafe/websphere-traditional` y **no requieren autenticación** para el pull.

!!! warning "Mac Apple Silicon (ARM64)"
    La imagen de tWAS **solo está disponible para `amd64`**. En Macs con chips Apple Silicon (M1/M2/M3/M4) es necesario indicar la plataforma explícitamente para usar emulación:
    ```bash
    podman pull --platform linux/amd64 icr.io/appcafe/websphere-traditional:9.0.5.29
    ```
    Y en todos los comandos `podman run` añadir `--platform linux/amd64`.
    En máquinas Linux/Windows x86-64 el pull es directo sin necesidad de `--platform`.

```bash
# Linux/Windows x86-64
podman pull icr.io/appcafe/websphere-traditional:9.0.5.29

# Mac Apple Silicon (ARM64)
podman pull --platform linux/amd64 icr.io/appcafe/websphere-traditional:9.0.5.29
```

!!! tip "Imágenes disponibles"
    ICR mantiene las últimas 3 versiones de cada rama. Puedes listar las imágenes disponibles con IBM Cloud CLI:
    ```bash
    ibmcloud cr region-set global
    ibmcloud cr images --restrict appcafe/websphere-traditional
    ```
    Referencia oficial: [github.com/WASdev/ci.docker.websphere-traditional](https://github.com/WASdev/ci.docker.websphere-traditional/blob/main/docs/images.md)

---

## Paso 2 — Compilar PedjasApp para tWAS

```bash
# Desde la raíz del repositorio del workshop
cd pedjasapp-twas

# Compilar el EAR con Maven
mvn clean package -DskipTests

# Verificar que se ha generado el EAR (en el submódulo pedjasapp-ear)
ls -lh pedjasapp-ear/target/pedjasapp.ear
```

Salida esperada:
```
-rw-r--r-- 1 usuario grupo 1.2M 15 ene 10:30 pedjasapp.ear
```

!!! info "Patrón Arquitectónico Legacy y EJB 2.x CMP"
    `pedjasapp.ear` incluye deliberadamente entity beans clásicos (**EJB 2.x CMP** `ProductoEJB`), descriptores WebSphere propietarios (`ibm-web-bnd.xml`, `ibm-ejb-jar-bnd.xml`) y namespaces JNDI tWAS heredados. En WebSphere Application Server tradicional, los entity beans CMP 2.x requerían herramientas de generación de código de persistencia (`ejbdeploy`). El propósito fundamental de empaquetar este EAR en el workshop es disponer del artefacto empresarial completo para su escaneo y evaluación mediante **IBM Application Modernization Accelerator (AMA)** en el **Lab 2**.

---

## Paso 3 — Crear la imagen de tWAS con PedjasApp

Crea un fichero `Dockerfile.twas` en el directorio `pedjasapp-twas/`:

```dockerfile
FROM icr.io/appcafe/websphere-traditional:9.0.5.29

# Copiar el EAR generado por Maven (ruta de salida del módulo pedjasapp-ear)
COPY pedjasapp-ear/target/pedjasapp.ear /tmp/pedjasapp.ear

# Copiar el script de configuración Jython
COPY docker/configureApp.py /work/config/

# Ejecutar la configuración al arrancar
CMD ["/work/start_server.sh"]
```

Construye la imagen (desde la raíz de `pedjasapp-twas/`):

```bash
podman build -f Dockerfile.twas -t pedjasapp-twas:1.0 .
```

---

## Paso 4 — Arrancar el contenedor tWAS

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

### Verificar que el servidor ha arrancado

```bash
# Seguir los logs hasta que aparezca el mensaje de servidor listo
podman logs -f pedjasapp-twas
```

Busca el mensaje de arranque listo en tWAS:
```
WSVR0001I: Server server1 open for e-business
```

!!! tip "Tiempo de arranque de tWAS"
    WebSphere Application Server tradicional necesita entre **3 y 5 minutos** para completar su inicialización. Es normal que los logs muestren una larga secuencia de mensajes CWWKF/CWWKZ antes del mensaje `WSVR0001I`. No interrumpas el proceso. Compara este tiempo con el arranque de Liberty (5–15 segundos) en el Lab 4.

---

## Paso 5 — Acceder a la Consola Administrativa de tWAS

Abre el navegador en la consola administrativa de WebSphere tradicional:

👉 **[https://localhost:9043/ibm/console](https://localhost:9043/ibm/console)** (o vía HTTP sin cifrar en **[http://localhost:9060/ibm/console](http://localhost:9060/ibm/console)**)

- **Usuario:** `wsadmin`
- **Contraseña:** Consulta la contraseña generada con:
  ```bash
  podman exec pedjasapp-twas cat /tmp/PASSWORD
  ```

Desde la consola puedes explorar la topología de WebSphere, los perfiles (`AppSrv01`), nodos, servidores de aplicaciones y la configuración del entorno tradicional que posteriormente será evaluada por el Data Collector de AMA.

---

## Paso 6 — Verificación de tWAS y Diagnóstico del EAR Legado

### 6.1 Comprobar el estado del servidor tWAS

Verifica en los logs del contenedor que WebSphere tradicional ha completado su inicialización:

```bash
# Consultar los logs del servidor tradicional
podman logs pedjasapp-twas | grep "WSVR0001I"
```

Salida esperada:
```
WSVR0001I: Server server1 open for e-business
```

### 6.2 Diagnóstico del despliegue en tWAS: Por qué falla `pedjasapp.ear`

!!! warning "Comportamiento didáctico: Detección de incompatibilidades EJB 2.x CMP"
    Si intentas desplegar `pedjasapp.ear` directamente en tWAS o acceder a **[http://localhost:9080/pedjasapp/](http://localhost:9080/pedjasapp/)**, el servidor registrará el error:
    
    ```text
    ADMA0209E: Enterprise JavaBeans (EJB) module pedjasapp-ejb.jar contains the following
    container-managed persistence (CMP) or bean-managed persistence (BMP) Entity beans: ProductoEJB.
    SRVE0255E: A WebGroup/Virtual Host to handle /pedjasapp/ has not been defined.
    ```
    
    **¿Por qué ocurre esto?**
    
    1. **EJB 2.x CMP (`ProductoEJB`)**: En tWAS tradicional, los Entity Beans con persistencia gestionada por contenedor requerían generar código dependiente de la base de datos mediante la herramienta propietaria `ejbdeploy`.
    2. **Descriptores y JNDI heredados**: El EAR contiene enlaces en `ibm-ejb-jar-bnd.xml`, `ibm-web-bnd.xml` y llamadas a APIs `com.ibm.websphere.*`.
    
    Este es precisamente el **problema clásico de modernización** que vamos a analizar en el siguiente laboratorio con **IBM Application Modernization Accelerator (AMA)** para planificar su transformación hacia **Jakarta EE 10 / JPA** sobre **WebSphere Liberty** (donde la aplicación sí funcionará de forma completa e interactiva en el puerto 9081 / Labs 4 y 5).

---

## Paso 7 — Recopilar el EAR para el Análisis AMA

En el **Lab 2** necesitaremos el fichero EAR completo para ejecutar el análisis AMA.

```bash
# Usar directamente el EAR generado por Maven (opción recomendada)
cp pedjasapp-twas/pedjasapp-ear/target/pedjasapp.ear ./pedjasapp-para-ama.ear

# Alternativamente, copiarlo desde el contenedor si ya está en ejecución
# podman cp pedjasapp-twas:/tmp/pedjasapp.ear ./pedjasapp-para-ama.ear

# Verificar el contenido del EAR
jar tf pedjasapp-para-ama.ear
```

Salida esperada:
```
META-INF/application.xml
pedjasapp-ejb.jar
pedjasapp-web.war
```

---

## Resolución de Problemas

### El contenedor no arranca

```bash
# Ver los últimos mensajes del log
podman logs --tail 50 pedjasapp-twas

# Comprobar el estado del contenedor
podman inspect pedjasapp-twas | grep Status
```

### La consola de administración no responde

```bash
# Comprobar que los puertos están correctamente mapeados
podman port pedjasapp-twas

# Comprobar que el proceso wsadmin está activo
podman exec pedjasapp-twas ps aux | grep was
```

### La aplicación da error 404

- Verifica que la aplicación está en estado **Started** en la consola de administración
- Comprueba la raíz de contexto: debe ser `/pedjasapp`
- Revisa los logs del servidor: `podman exec pedjasapp-twas cat /opt/IBM/WebSphere/AppServer/profiles/AppSrv01/logs/server1/SystemOut.log | grep -i error`

---

## Resumen del Lab 1

!!! success "Completado"
    En este lab has:

    - Compilado PedjasApp para tWAS con Maven
    - Arrancado un contenedor Podman con WebSphere Application Server 9.0
    - Comprobado el comportamiento esperado del EAR legado (incompatibilidad EJB CMP 2.x en tWAS sin `ejbdeploy`)
    - Recopilado el artefacto EAR para el análisis con AMA en el Lab 2

---


## Siguiente Paso

Continúa con el **[Lab 2 — Análisis con AMA](../lab2/index.md)**, donde ejecutarás IBM Transformation Advisor sobre el EAR generado e interpretarás las reglas de modernización detectadas.
