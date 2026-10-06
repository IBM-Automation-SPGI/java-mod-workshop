# Lab 2 — Análisis con IBM Application Modernization Accelerator

---

## Objetivo del Lab

En este lab ejecutarás **IBM Application Modernization Accelerator (AMA)** sobre el fichero EAR de PedjasApp, interpretarás los resultados del análisis y priorizarás los cambios necesarios para la migración a WebSphere Liberty.

---

## ¿Qué es IBM AMA / Transformation Advisor?

**IBM Application Modernization Accelerator** es una herramienta de análisis estático que:

- Escanea los binarios de una aplicación Java EE (EAR, WAR, JAR) sin necesidad de acceso al código fuente
- Detecta dependencias propietarias del servidor de aplicaciones de origen (tWAS, JBoss, WebLogic, etc.)
- Genera reglas de modernización específicas para cada problema encontrado
- Estima el nivel de esfuerzo (bajo / medio / alto) de la migración
- Produce un plan de acción priorizado con los cambios más críticos primero
- Genera ficheros de configuración de destino (p. ej., `server.xml` para Liberty) como punto de partida

---

## Paso 1 — Instalación de AMA (Transformation Advisor)

### Opción A — Instalación Local (Recomendada para el Workshop)

La imagen `ibmcom/transformation-advisor-dev` ya no está disponible públicamente. AMA Local (v4.x/v5.x) se instala mediante un ZIP descargado desde IBM:

1. Descarga el instalador desde:
   **[ibm.com/support/pages/ibm-transformation-advisor-downloads](https://www.ibm.com/support/pages/ibm-transformation-advisor-downloads)**

2. Extrae el ZIP y lanza el script de arranque:

```bash
unzip application-modernization-accelerator-local-5.1.0.zip
cd application-modernization-accelerator-local-5.1.0
sh launch.sh
```

!!! note "Nombre del script según la versión"
    - AMA 5.x y 4.x: el script se llama `launch.sh`
    - Transformation Advisor 3.x: el script se llamaba `launchTransformationAdvisor.sh`

```bash
# Verificar que los contenedores están activos
podman ps | grep -i ama
```

Accede a la interfaz en: **[http://localhost:3000](http://localhost:3000)**

!!! note "Requisitos"
    Requiere Docker o Podman instalado. El script descarga automáticamente las imágenes necesarias desde ICR.

---

## Paso 2 — Crear un Nuevo Workspace en AMA

Cuando accedas a la interfaz de Transformation Advisor por primera vez:

### 2.1 Crear un Workspace

```
Transformation Advisor → Add Workspace
  Nombre: "PedjasApp-Migration"
  Descripción: "Análisis de modernización de PedjasApp tWAS → Liberty"
  → Create
```

**Vista esperada del workspace vacío:**

```
┌─────────────────────────────────────────────────────────────┐
│  IBM Transformation Advisor                                  │
│  Workspace: PedjasApp-Migration                             │
│                                                             │
│  [ No hay colecciones todavía ]                             │
│                                                             │
│  [ + Add Collection ]                                       │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Crear una Colección

```
→ Add Collection
  Nombre: "analisis-inicial"
  → Create
```

---

## Paso 3 — Cargar el EAR de PedjasApp

### Método A — Subir el fichero directamente desde la interfaz web

1. En la colección `analisis-inicial`, haz clic en **Upload data**
2. Selecciona el fichero `pedjasapp-para-ama.ear` que generaste en el Lab 1
3. Haz clic en **Upload**

**Vista esperada durante la carga:**

```
┌─────────────────────────────────────────────────────────────┐
│  Uploading: pedjasapp-para-ama.ear                          │
│  ████████████████████████████████░░░░░░  85%               │
│  Analizando módulos EJB...                                  │
└─────────────────────────────────────────────────────────────┘
```

### Método B — Usando el Data Collector (para aplicaciones en servidor activo)

```bash
# Descargar el Data Collector de la interfaz de TA
# (botón "Download data collector" en la pantalla principal)

# Ejecutar el Data Collector apuntando al perfil de tWAS
./transformationadvisor-Linux_AppSrv01 \
  -w /opt/IBM/WebSphere/AppServer \
  -p AppSrv01

# Esto genera un fichero .zip que se sube a TA
```

---

## Paso 4 — Interpretar los Resultados del Análisis

Tras completar el análisis, Transformation Advisor mostrará un resumen con la siguiente estructura:

### 4.1 Pantalla de Resumen de Aplicaciones

```
┌─────────────────────────────────────────────────────────────────────┐
│  Colección: analisis-inicial                                        │
│                                                                     │
│  Aplicación          │ Complejidad │ Issues │ Advertencias │ Info  │
│  ─────────────────── │ ─────────── │ ─────── │ ──────────── │ ───── │
│  pedjasapp.ear       │  Moderada  │   12   │      8       │  15   │
│                                                                     │
│  Esfuerzo estimado: 3-5 días                                        │
│  Destino recomendado: WebSphere Liberty                             │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Clasificación de Issues

| Nivel | Color | Significado |
|-------|-------|-------------|
| **Crítico** | 🔴 Rojo | Bloqueante — la aplicación no arrancará en Liberty sin este cambio |
| **Advertencia** | 🟡 Amarillo | Comportamiento diferente — necesita pruebas adicionales |
| **Informativo** | 🔵 Azul | Mejora recomendada — no bloquea el despliegue |

### 4.3 Reglas Disparadas en PedjasApp

A continuación se describen las reglas que AMA generará para PedjasApp, junto con su nivel de severidad y la acción correctiva correspondiente:

---

#### 🔴 RULE-0001 — IBM WebSphere API Usage (com.ibm.websphere.*)

**Ficheros afectados:**
```
pedjasapp-ejb/src/main/java/.../PedidoServiceBean.java
pedjasapp-ejb/src/main/java/.../NotificacionBean.java
```

**Descripción:**
La aplicación importa y utiliza clases del paquete `com.ibm.websphere.*`, que son exclusivas de WebSphere Application Server traditional y no existen en WebSphere Liberty.

**Código problemático:**
```java
import com.ibm.websphere.naming.JndiHelper;
import com.ibm.websphere.cache.DistributedMap;
```

**Acción correctiva:**
- Sustituir `JndiHelper` por la API estándar JNDI de Java EE (`javax.naming.InitialContext`)
- Sustituir `DistributedMap` por una caché JCache (JSR-107) o un `HashMap` local simple

---

#### 🔴 RULE-0002 — EJB 2.x CMP Entity Beans

**Ficheros afectados:**
```
pedjasapp-ejb/src/main/java/.../ProductoBean.java
pedjasapp-ejb/src/main/java/.../ClienteBean.java
```

**Descripción:**
Los Entity Beans con Container-Managed Persistence (CMP) de EJB 2.x no están soportados en WebSphere Liberty. Liberty soporta EJB 3.x con JPA para la capa de persistencia.

**Código problemático:**
```java
public abstract class ProductoBean implements EntityBean {
    public abstract String getNombre();
    public abstract void setNombre(String nombre);
    public abstract java.util.Collection ejbSelectByCategoria(String cat);
}
```

**Acción correctiva:**
- Convertir los Entity Beans CMP a entidades JPA (`@Entity`)
- Reemplazar el Home Interface por un DAO o un `@Stateless` Session Bean

---

#### 🔴 RULE-0003 — WebSphere-specific JNDI Lookup

**Ficheros afectados:**
```
pedjasapp-web/src/main/java/.../CatalogoServlet.java
pedjasapp-ejb/src/main/java/.../PedidoServiceBean.java
```

**Descripción:**
La aplicación usa nombres JNDI con espacios de nombres propietarios de WAS que no son portables.

**Código problemático:**
```java
Context ctx = new InitialContext();
DataSource ds = (DataSource) ctx.lookup("jdbc/pedjasappDS");
// En WAS el binding real es: cell/persistent/jdbc/pedjasappDS
```

**Acción correctiva:**
- Usar la inyección de dependencias estándar: `@Resource(name = "jdbc/pedjasappDS")`
- Definir el recurso en `web.xml` con `<resource-ref>` portable

---

#### 🟡 RULE-0004 — IBM Deployment Descriptor (ibm-web-bnd.xml)

**Ficheros afectados:**
```
pedjasapp-web/src/main/webapp/WEB-INF/ibm-web-bnd.xml
pedjasapp-ejb/src/main/resources/META-INF/ibm-ejb-jar-bnd.xml
```

**Descripción:**
Los ficheros de binding propietarios de WebSphere (`ibm-web-bnd.xml`, `ibm-ejb-jar-bnd.xml`) solo son procesados por tWAS y el motor de Liberty en modo compatibilidad. Su contenido debe migrarse a la configuración de `server.xml`.

**Acción correctiva:**
- Mover los bindings de DataSource y JMS al elemento `<dataSource>` de `server.xml`
- Usar `<jndiEntry>` en `server.xml` para configurar entradas JNDI simples

---

#### 🟡 RULE-0005 — JMS WAS MQ Queue Connection Factory

**Ficheros afectados:**
```
pedjasapp-ejb/src/main/java/.../NotificacionBean.java
```

**Descripción:**
La aplicación usa una `QueueConnectionFactory` configurada mediante recursos WAS. Liberty usa su propio proveedor JMS integrado o un adaptador de recursos externo.

**Acción correctiva:**
- Definir `<jmsConnectionFactory>` y `<jmsQueue>` en `server.xml`
- Habilitar las features `messaging-3.1`, `messagingServer-3.0` y `messagingClient-3.0` en Liberty (Jakarta EE 10)

---

#### 🔵 RULE-0006 — EJB 2.x Home Interface Usage

**Descripción:**
El uso de EJB Home Interfaces (`create()`, `findByPrimaryKey()`) es la forma antigua de acceder a beans. En EJB 3.x y CDI, se usa inyección directa.

**Acción correctiva:**
- Eliminar los Home Interfaces
- Inyectar los beans directamente con `@EJB` o `@Inject`

---

### 4.4 Panel de Análisis Detallado — Vista de Fichero

```
┌─────────────────────────────────────────────────────────────────────┐
│  pedjasapp.ear / pedjasapp-ejb.jar                                  │
│  PedidoServiceBean.java                                             │
│                                                                     │
│  Línea 34: import com.ibm.websphere.naming.JndiHelper;              │
│  ▲ CRÍTICO — IBM WebSphere API Usage                               │
│    Esta clase no está disponible en WebSphere Liberty.              │
│    Acción: Sustituir por javax.naming.InitialContext                │
│    [ Ver Detalle ] [ Ver Solución Sugerida ] [ Marcar Resuelto ]    │
│                                                                     │
│  Línea 67: DistributedMap cache = JndiHelper.lookup("cache/main");  │
│  ▲ CRÍTICO — Distributed Cache IBM API                             │
│    Ver: RULE-0001                                                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Paso 5 — Generar el Plan de Migración

Transformation Advisor puede generar automáticamente los artefactos de partida para Liberty:

### 5.1 Descargar la Guía de Migración

```
Aplicación: pedjasapp.ear
→ View migration plan
→ Download migration plan (ZIP)
```

El ZIP incluye:
- `server.xml` — configuración inicial de Liberty (puede necesitar ajustes)
- `Dockerfile` — imagen de contenedor Liberty básica
- `migration-plan.md` — descripción de los cambios necesarios

### 5.2 Tabla Resumen de Reglas Activadas

| Regla | Severidad | Esfuerzo | Categoría |
|-------|-----------|----------|-----------|
| RULE-0001 — IBM WebSphere API | 🔴 Crítico | Alto | APIs propietarias |
| RULE-0002 — EJB 2.x CMP | 🔴 Crítico | Alto | Modernización de EJBs |
| RULE-0003 — JNDI propietario | 🔴 Crítico | Bajo | Configuración de recursos |
| RULE-0004 — ibm-web-bnd.xml | 🟡 Advertencia | Bajo | Descriptores de despliegue |
| RULE-0005 — JMS WAS | 🟡 Advertencia | Medio | Mensajería |
| RULE-0006 — EJB Home Interface | 🔵 Info | Medio | Modernización de EJBs |

**Esfuerzo total estimado: 3-5 días de trabajo de desarrollo**

---

## Resumen del Lab 2

!!! success "Completado"
    En este lab has:

    - Instalado y arrancado IBM Transformation Advisor / AMA
    - Cargado el EAR de PedjasApp para su análisis
    - Identificado las 6 reglas de modernización principales
    - Comprendido el nivel de severidad y el esfuerzo de cada cambio
    - Generado el plan de migración inicial

---


## Siguiente Paso

Continúa con el **[Lab 3 — Modernización Manual](../lab3/index.md)**, donde aplicarás en el código los 6 cambios identificados por AMA.
