# Lab 1 — Despliegue de la Aplicación en tWAS

---

## Objetivo del Lab

En este lab desplegarás **PedjasApp** en un contenedor Docker con **WebSphere Application Server tradicional (tWAS) 9.0**, verificarás el despliegue y comprobarás la funcionalidad básica de la aplicación antes de proceder con el análisis AMA.

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

## Paso 1 — Preparar la imagen Docker de tWAS

IBM proporciona imágenes Docker oficiales de WebSphere Application Server traditional en IBM Container Registry (ICR).

### 1.1 Descargar la imagen de tWAS 9.0

Las imágenes de tWAS están disponibles en `icr.io/appcafe/websphere-traditional` y **no requieren autenticación** para el pull.

```bash
docker pull icr.io/appcafe/websphere-traditional:9.0.5.29
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

# Verificar que se ha generado el EAR
ls -lh target/pedjasapp.ear
```

Salida esperada:
```
-rw-r--r-- 1 usuario grupo 1.2M 15 ene 10:30 pedjasapp.ear
```

---

## Paso 3 — Crear la imagen Docker de tWAS con PedjasApp

Crea un fichero `Dockerfile.twas` en el directorio `pedjasapp-twas/`:

```dockerfile
FROM icr.io/appcafe/websphere-traditional:9.0.5.29

# Copiar el EAR generado por Maven
COPY target/pedjasapp.ear /tmp/pedjasapp.ear

# Copiar el script de configuración Jython
COPY docker/configureApp.py /work/config/

# Ejecutar la configuración al arrancar
CMD ["/work/start_server.sh"]
```

Construye la imagen:

```bash
docker build -f Dockerfile.twas -t pedjasapp-twas:1.0 .
```

---

## Paso 4 — Arrancar el contenedor tWAS

```bash
docker run -d \
  --name pedjasapp-twas \
  -p 9080:9080 \
  -p 9443:9443 \
  -p 9060:9060 \
  -e LICENSE=accept \
  pedjasapp-twas:1.0
```

### Verificar que el servidor ha arrancado

```bash
# Seguir los logs hasta que aparezca el mensaje de servidor listo
docker logs -f pedjasapp-twas
```

Busca la línea:
```
[AUDIT   ] CWWKF0011I: The defaultServer server is ready to run a smarter planet.
```

(En tWAS 9.0, la línea equivalente es:)
```
WSVR0001I: Server server1 open for e-business
```

---

## Paso 5 — Desplegar la Aplicación (si no está incluida en la imagen)

Si has optado por desplegar la aplicación de forma separada mediante la consola de administración:

### 5.1 Acceder a la consola de administración de tWAS

Abre el navegador en: **[https://localhost:9060/ibm/console](https://localhost:9060/ibm/console)**

- **Usuario:** `wsadmin`
- **Contraseña:** (consultar variable de entorno del contenedor)

### 5.2 Instalar PedjasApp

1. Ve a **Applications → New Application → New Enterprise Application**
2. Selecciona **Remote file system** y proporciona la ruta al fichero `pedjasapp.ear`
3. Acepta los valores por defecto y haz clic en **Finish**
4. Guarda la configuración: **Save directly to master configuration**
5. Inicia la aplicación: **Applications → Application Types → WebSphere enterprise applications → PedjasApp → Start**

---

## Paso 6 — Verificar el Despliegue

### 6.1 Comprobar el estado de la aplicación

```bash
# Ver el log del servidor para confirmar el despliegue
docker exec pedjasapp-twas \
  grep -i "pedjasapp" /opt/IBM/WebSphere/AppServer/profiles/AppSrv01/logs/server1/SystemOut.log
```

Salida esperada:
```
[AUDIT   ] WSVR0190I: Starting application: PedjasApp
[AUDIT   ] WSVR0191I: Application started: PedjasApp
```

### 6.2 Probar la aplicación en el navegador

Abre el navegador en: **[http://localhost:9080/pedjasapp/](http://localhost:9080/pedjasapp/)**

Deberías ver la pantalla principal de PedjasApp con:

- Cabecera con el logo de PedjasApp
- Formulario de inicio de sesión (usuario: `admin` / contraseña: `admin123`)
- Sección de catálogo de productos

### 6.3 Probar los endpoints funcionales

```bash
# Listar productos (servlet de catálogo)
curl -s http://localhost:9080/pedjasapp/catalogo | head -20

# Crear un pedido de prueba
curl -s -X POST http://localhost:9080/pedjasapp/pedidos/nuevo \
  -d "clienteId=1&productoId=101&cantidad=3" \
  -H "Content-Type: application/x-www-form-urlencoded"
```

---

## Paso 7 — Recopilar el EAR para el Análisis AMA

En el **Lab 2** necesitaremos el fichero EAR completo para ejecutar el análisis AMA.

```bash
# Copiar el EAR del contenedor para asegurarnos de tener el fichero correcto
docker cp pedjasapp-twas:/tmp/pedjasapp.ear ./pedjasapp-para-ama.ear

# Verificar el contenido del EAR
jar tf pedjasapp-para-ama.ear
```

Salida esperada:
```
META-INF/application.xml
META-INF/ibm-application-bnd.xmi
pedjasapp-ejb.jar
pedjasapp-web.war
```

---

## Resolución de Problemas

### El contenedor no arranca

```bash
# Ver los últimos mensajes del log
docker logs --tail 50 pedjasapp-twas

# Comprobar el estado del contenedor
docker inspect pedjasapp-twas | grep Status
```

### La consola de administración no responde

```bash
# Comprobar que los puertos están correctamente mapeados
docker port pedjasapp-twas

# Comprobar que el proceso wsadmin está activo
docker exec pedjasapp-twas ps aux | grep was
```

### La aplicación da error 404

- Verifica que la aplicación está en estado **Started** en la consola de administración
- Comprueba la raíz de contexto: debe ser `/pedjasapp`
- Revisa los logs del servidor: `docker exec pedjasapp-twas cat /opt/IBM/WebSphere/AppServer/profiles/AppSrv01/logs/server1/SystemOut.log | grep -i error`

---

## Resumen del Lab 1

!!! success "Completado"
    En este lab has:

    - Compilado PedjasApp para tWAS con Maven
    - Arrancado un contenedor Docker con WebSphere Application Server 9.0
    - Desplegado y verificado la aplicación
    - Recopilado el EAR para el análisis AMA

---

