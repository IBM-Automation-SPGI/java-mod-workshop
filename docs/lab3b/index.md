# Lab 3B — Modernización Asistida con IBM Bob

---

## Objetivo del Lab

En este lab utilizarás **IBM Bob** y su **Premium Package de Java Modernization** para acelerar y automatizar los cambios de código identificados por AMA en el Lab 2. En lugar de aplicar los cambios manualmente como en el Lab 3, Bob actuará como tu agente de modernización: analizará el código fuente, comprenderá el contexto de la migración tWAS → Open Liberty, y aplicará los cambios con tu supervisión.

---

## Qué es el Premium Package de Java Modernization

El **Java Modernization Premium Package** es un add-on de IBM Bob que extiende sus capacidades con un modo especializado y reglas de modernización preconfiguradas para migraciones Java empresariales.

| Capacidad | Descripción |
|-----------|-------------|
| **Modo Java Modernization Architect** | Modo personalizado optimizado para migraciones tWAS → Open Liberty con conocimiento profundo de las reglas AMA |
| **Reglas de modernización preconfiguradas** | Reglas Bob que identifican automáticamente APIs propietarias WAS, EJBs 2.x, JNDI propietario y descriptores IBM |
| **Contexto de migración persistente** | Bob mantiene el contexto de la migración completa entre sesiones |
| **Generación de `server.xml`** | Bob genera la configuración Liberty equivalente a partir del `standalone.xml` o descriptores WAS |
| **Validación automática** | Bob verifica que el código modernizado compila y que las features Liberty están correctamente declaradas |

!!! note "Requisito"
    El Premium Package de Java Modernization debe estar asignado a tu usuario en la administración de IBM Bob Enterprise. Contacta con tu administrador para habilitarlo en [bob.ibm.com/admin](https://bob.ibm.com/admin).

---

## Paso 1 — Activar el Modo Java Modernization Architect

Abre IBM Bob IDE con el proyecto `pedjasapp-twas` abierto como workspace. En el selector de modos, activa el modo especializado:

```
/java-modernization
```

O selecciónalo en el desplegable de modos en la barra superior de Bob. Verás que el prompt de sistema cambia para indicar que Bob está en contexto de modernización Java.

!!! tip "¿No ves el modo?"
    Si el modo no aparece en la lista, verifica que tienes el Premium Package asignado en **bob.ibm.com/admin → Users & Teams → [tu usuario] → Premium packages**.

---

## Paso 2 — Proporcionar el Contexto de Migración a Bob

Con el modo activo, proporciona a Bob el contexto de partida. Abre el chat de Bob y ejecuta:

```text
Tengo una aplicación Java EE desplegada en WebSphere Application Server 9.0 (tWAS).
Necesito modernizarla a Open Liberty 26.0.0.9.

El análisis de IBM Application Modernization Accelerator ha identificado estas reglas:
- RULE-0002: EJB 2.x CMP Entity Beans → entidades JPA
- RULE-0001: imports com.ibm.websphere.* → APIs estándar Jakarta EE
- RULE-0003: JNDI propietario → @Resource injection
- RULE-0004: ibm-web-bnd.xml, ibm-ejb-jar-bnd.xml → eliminar, mover config a server.xml
- RULE-0005: JMS WAS → JMS 2.0 estándar con Liberty messaging
- RULE-0006: EJB Home Interface → inyección directa @EJB

El código fuente de la versión tWAS está en @pedjasapp-twas/
El destino modernizado debe quedar en @pedjasapp-liberty/

Analiza el código fuente y dime qué cambios necesitas aplicar para cada regla.
Muéstrame el plan antes de hacer ningún cambio.
```

Bob generará un **plan de modernización** que deberás revisar y aprobar antes de que aplique ningún cambio. Este es el patrón **Delegate** de Bob: Bob propone, tú apruebas.

---

## Paso 3 — Revisar y Aprobar el Plan

Bob presentará un plan similar a este:

```
Plan de Modernización: PedjasApp tWAS → Open Liberty

📋 CAMBIOS IDENTIFICADOS (6 reglas AMA):

1. [RULE-0002] ProductoBean.java, ClienteBean.java, PedidoBean.java
   → Convertir EJB 2.x CMP a entidades JPA con @Entity, @Table, @Id
   Archivos afectados: 4 clases Java + ejb-jar.xml

2. [RULE-0001] PedidoServiceBean.java, CatalogoServlet.java
   → Eliminar imports com.ibm.websphere.naming.JndiHelper
   → Eliminar uso de DistributedMap, sustituir por ConcurrentHashMap
   Archivos afectados: 2 clases Java

3. [RULE-0003] CatalogoServlet.java, PedidoServlet.java, InicioServlet.java
   → Sustituir lookups JNDI manuales por @Resource injection
   Archivos afectados: 3 clases Java + web.xml

4. [RULE-0004] ibm-web-bnd.xml, ibm-ejb-jar-bnd.xml
   → Eliminar ficheros. Trasladar bindings a server.xml Liberty
   Archivos afectados: 2 ficheros XML eliminados, server.xml generado

5. [RULE-0005] NotificacionBean.java
   → Actualizar JMS 1.1 propietario a JMS 2.0 con @JMSConnectionFactory
   Archivos afectados: 1 clase Java

6. [RULE-0006] PedidoServiceBean.java
   → Eliminar Home Interface lookup, sustituir por @EJB injection
   Archivos afectados: 1 clase Java + eliminación de ProductoLocalHome.java

¿Apruebo este plan y procedo con los cambios?
```

Revisa el plan detenidamente. Si algo no es correcto, indícaselo a Bob en lenguaje natural antes de aprobar. Cuando estés de acuerdo, responde:

```text
Aprueba el plan. Aplica los cambios empezando por RULE-0002.
Hazlos regla por regla y espera mi confirmación entre cada una.
```

---

## Paso 4 — Modernización Regla por Regla

Bob aplicará cada cambio, mostrándote el diff antes de escribir los ficheros. Para cada regla:

1. Bob muestra el **código original** y el **código modernizado**
2. Tú revisas el cambio y confirmas con `Aplica el cambio` o pides ajustes
3. Bob escribe el fichero y confirma la modificación
4. Pasas a la siguiente regla

### Ejemplo — RULE-0002 con Bob

**Prompt a Bob:**
```text
Aplica RULE-0002: convierte ProductoBean.java de EJB 2.x CMP a entidad JPA.
Muéstrame el diff antes de aplicar.
```

**Bob responde con el diff y aplica el cambio al confirmar.**

---

## Paso 5 — Generar el `server.xml` con Bob

Una vez aplicados todos los cambios de código, pide a Bob que genere la configuración Liberty:

```text
Basándote en los recursos WAS que hemos eliminado (DataSource jdbc/pedjasappDS,
JMS ConnectionFactory jms/PedjasQCF, Queue jms/PedjasNotificacionesQ),
genera el server.xml completo para Open Liberty 26.0.0.9 con:
- Jakarta EE 10 features
- DataSource para PostgreSQL
- JMS messaging interno Liberty
- MicroProfile Health y Metrics

Guárdalo en @pedjasapp-liberty/server.xml
```

---

## Paso 6 — Verificar la Compilación

Con todos los cambios aplicados, pide a Bob que verifique que el proyecto compila:

```text
Verifica que el proyecto pedjasapp-liberty compila correctamente con Maven.
Ejecuta: cd pedjasapp-liberty && mvn clean package -DskipTests
Si hay errores de compilación, analízalos y propón las correcciones necesarias.
```

Bob ejecutará el build, analizará cualquier error y propondrá correcciones adicionales si es necesario.

---

## Comparativa: Modernización Manual vs. Asistida con Bob

| Aspecto | Lab 3 — Manual | Lab 3B — Con Bob |
|---------|---------------|-----------------|
| Tiempo estimado | 2-3 horas | 20-40 minutos |
| Riesgo de error | Alto (cambios manuales) | Bajo (Bob valida el contexto) |
| Comprensión del código | Profunda (lees cada fichero) | Media (revisas diffs propuestos) |
| Generación de `server.xml` | Manual, basada en la guía | Automática por Bob |
| Trazabilidad | Commits manuales | Bob documenta cada cambio |
| Aprendizaje | Máximo | Centrado en revisión y supervisión |

!!! note ""
    Ambos enfoques son complementarios. El Lab 3 te da comprensión profunda de los cambios; el Lab 3B te muestra cómo escalar el proceso con Bob en proyectos reales con cientos de clases.

---

## Recursos

| Recurso | Enlace |
|---------|--------|
| IBM Bob Premium Packages | [ibm.com/docs/en/bob](https://www.ibm.com/docs/en/bob/latest?topic=packages-overview) |
| Gestión de usuarios y Premium Packages | [bob.ibm.com/admin](https://bob.ibm.com/admin) |
| Guía de modernización Node.js con Bob | [ibm.com/docs/en/bob — Modernize a Node.js application](https://www.ibm.com/docs/en/bob/latest?topic=tutorials-modernize-nodejs-express-api) |

---

## Resumen del Lab 3B

!!! success "Completado"
    En este lab has utilizado IBM Bob con el Premium Package de Java Modernization para:

    - ✅ Activar el modo **Java Modernization Architect** en Bob
    - ✅ Proporcionar el contexto de migración con los resultados de AMA
    - ✅ Revisar y aprobar el plan de modernización generado por Bob
    - ✅ Aplicar los 6 cambios AMA con supervisión continua
    - ✅ Generar el `server.xml` de Open Liberty con Bob
    - ✅ Verificar la compilación del proyecto modernizado

---
