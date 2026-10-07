# Lab 3B — Modernización Asistida con IBM Bob

<span class="lab-badge">Lab 3B</span><span class="lab-time">⏱ 10–15 minutos</span>

---

## Objetivo del Lab

En este lab utilizarás **IBM Bob** y el **Premium Package for Java Modernization** (`IBM.bob-java`) para acelerar y automatizar los cambios de código identificados por AMA en el Lab 2. En lugar de aplicar los cambios manualmente como en el Lab 3, Bob actuará como tu agente de modernización: utilizará el workflow **Liberty Modernization** guiado por el informe AMA, aplicará recetas OpenRewrite, resolverá incompatibilidades de forma agéntica y generará el `server.xml` resultante.

!!! tip "⏱ Duración estimada: 10–15 minutos"
    Alternativa al Lab 3 Manual. El workflow de Bob automatiza los cambios más repetitivos; el tiempo varía según la complejidad del proyecto y los ajustes manuales adicionales que se necesiten.

!!! note "Lab alternativo al Lab 3"
    Este lab es una **alternativa** al Lab 3 (Modernización Manual). Puedes realizar uno u otro, o ambos para comparar los dos enfoques.

---

## Qué es el IBM Bob Premium Package for Java Modernization

El **IBM Bob Premium Package for Java Modernization** ([`IBM.bob-java`](https://open-vsx.org/extension/IBM/bob-java)) es una extensión de IBM Bob que añade workflows de IA especializados para aplicaciones Java empresariales. Requiere IBM Bob como dependencia base.

| Workflow | Descripción |
|----------|-------------|
| **Liberty Modernization** | Moderniza de WebSphere tradicional a Liberty guiado por el informe AMA: inyecta `server.xml`, aplica recetas OpenRewrite y resuelve incompatibilidades restantes |
| **Java Upgrade** | Actualiza la versión de Java (8 → 11 → 17 → 21 → 25) con recetas automáticas y un bucle de corrección agéntico |
| **Java Unit Test Generation** | Genera tests JUnit con cobertura JaCoCo guiado por un documento de estrategia |
| **UI Modernization** | Separa monolitos JSF/Struts en backend Java + frontend React |
| **Java Vulnerability Remediation** | Escanea dependencias Maven/Gradle contra la base de datos OSV |
| **Spring Boot to Quarkus Migration** | Migración modular con validaciones tras cada fase |

!!! note "Requisito — instalación de la extensión"
    Necesitas tener **IBM Bob** instalado y haber suscrito el **Premium Package for Java Modernization**:

    1. Instala la extensión desde Open VSX o VS Code Marketplace: [`IBM.bob-java`](https://open-vsx.org/extension/IBM/bob-java)
    2. Reinicia Bob. Verás los nuevos workflows disponibles al escribir `Liberty Modernization` en el chat o al hacer clic en **Start Workflow**.

---

## Paso 1 — Preparar el Informe AMA

El workflow **Liberty Modernization** de `IBM.bob-java` está construido alrededor del **informe ZIP de AMA**. Necesitas tenerlo disponible antes de iniciar.

```bash
# El EAR analizado en el Lab 2 produce un ZIP de migración descargable desde la UI de AMA:
# Aplicación: pedjasapp.ear → View migration plan → Download migration plan (ZIP)

# Guarda el ZIP en la raíz del repositorio, por ejemplo:
# java-mod-workshop/pedjasapp-ama-migration-plan.zip
```

!!! tip "¿No tienes el ZIP de AMA?"
    Si no completaste el Lab 2 con una instancia real de AMA, puedes usar el modo **Java Modernization Architect** (modo del workspace) con los prompts del **Paso 2** de este lab para aplicar los cambios de forma guiada.

---

## Paso 2 — Lanzar el Workflow Liberty Modernization

Con el Premium Package instalado y el repositorio `java-mod-workshop` abierto en Bob, escribe en el chat:

```text
Liberty Modernization
```

O haz clic en **Start Workflow → Liberty Modernization**. Bob iniciará el workflow con los siguientes pasos automáticos:

1. **Lee el informe AMA** — te pedirá seleccionar el ZIP del plan de migración
2. **Inyecta la configuración Liberty** — copia `server.xml` y el `Containerfile` generados por AMA en las rutas correctas del proyecto, gestionando layouts multi-módulo automáticamente
3. **Aplica recetas OpenRewrite** — ejecuta las recetas de Liberty Modernization via Maven/Gradle
4. **Replatforming agéntico** — un subagente AI resuelve las incompatibilidades restantes detectadas en el informe AMA
5. **Genera guía de despliegue** — produce un diagrama Mermaid del progreso y los pasos de despliegue en Liberty

---

## Paso 3 — Revisar y Aprobar los Cambios

Bob aplica los cambios de forma incremental, mostrando diffs antes de escribir cada fichero. Para cada cambio:

1. Bob muestra el **código original** y el **código modernizado**
2. Tú revisas el cambio y confirmas con `Aplica el cambio` o pides ajustes
3. Bob escribe el fichero y confirma la modificación

### Alternativa — Aplicar los cambios con prompts directos

Si prefieres guiar los cambios manualmente con Bob (sin el workflow del Premium Package), puedes usar el modo **Java Modernization Architect** de este workspace:

```text
Tengo una aplicación Java EE desplegada en WebSphere Application Server 9.0 (tWAS).
Necesito modernizarla a WebSphere Liberty 26.0.0.9.

El análisis de IBM Application Modernization Accelerator ha identificado estas reglas:
- RULE-0002: EJB 2.x CMP Entity Beans → entidades JPA
- RULE-0001: imports com.ibm.websphere.* → APIs estándar Jakarta EE
- RULE-0003: JNDI propietario → @Resource injection
- RULE-0004: ibm-web-bnd.xml, ibm-ejb-jar-bnd.xml → eliminar, mover config a server.xml
- RULE-0005: JMS WAS → JMS 3.0 estándar con Liberty messaging
- RULE-0006: EJB Home Interface → inyección directa @EJB

El código fuente de la versión tWAS está en @pedjasapp-twas/
El destino modernizado debe quedar en @pedjasapp-liberty/

Analiza el código fuente y dime qué cambios necesitas aplicar para cada regla.
Muéstrame el plan antes de hacer ningún cambio.
```

Bob generará un **plan de modernización** que deberás revisar y aprobar antes de que aplique ningún cambio.

---

## Paso 4 — Verificar la Compilación

Con todos los cambios aplicados, pide a Bob que verifique que el proyecto compila:

```text
Verifica que el proyecto pedjasapp-liberty compila correctamente con Maven.
Ejecuta: cd pedjasapp-liberty && mvn clean package -DskipTests
Si hay errores de compilación, analízalos y propón las correcciones necesarias.
```

Bob ejecutará el build, analizará cualquier error y propondrá correcciones adicionales si es necesario.

---

## Comparativa: Modernización Manual vs. Asistida con Bob

| Aspecto | Lab 3 — Manual | Lab 3B — Con Bob Premium |
|---------|---------------|--------------------------|
| Tiempo estimado | 25-35 minutos | 10-15 minutos |
| Riesgo de error | Alto (cambios manuales) | Bajo (recetas OpenRewrite + agente AI) |
| Comprensión del código | Profunda (lees cada fichero) | Media (revisas diffs propuestos) |
| Generación de `server.xml` | Manual, basada en la guía | Automática desde el ZIP de AMA |
| Aplicación de recetas | Manual | OpenRewrite vía Maven/Gradle |
| Trazabilidad | Commits manuales | Bob documenta cada cambio |
| Aprendizaje | Máximo | Centrado en revisión y supervisión |

!!! note ""
    Ambos enfoques son complementarios. El Lab 3 te da comprensión profunda de los cambios; el Lab 3B te muestra cómo escalar el proceso con Bob en proyectos reales con cientos de clases.

---

## Recursos

| Recurso | Enlace |
|---------|--------|
| IBM Bob Premium Package for Java Modernization | [open-vsx.org/extension/IBM/bob-java](https://open-vsx.org/extension/IBM/bob-java) |
| IBM Bob — Documentación oficial | [ibm.com/docs/en/bob](https://www.ibm.com/docs/en/bob) |
| OpenRewrite Liberty Migration recipes | [docs.openrewrite.org](https://docs.openrewrite.org/recipes/java/liberty) |
| IBM Application Modernization Accelerator | [ibm.com/support/pages/ibm-transformation-advisor-downloads](https://www.ibm.com/support/pages/ibm-transformation-advisor-downloads) |

---

## Resumen del Lab 3B

!!! success "Completado"
    En este lab has utilizado IBM Bob con el **Premium Package for Java Modernization** (`IBM.bob-java`) para:

    - ✅ Instalar y activar el Premium Package `IBM.bob-java` en Bob
    - ✅ Proporcionar el informe ZIP de AMA al workflow **Liberty Modernization**
    - ✅ Dejar que Bob inyecte la configuración Liberty, ejecute recetas OpenRewrite y resuelva incompatibilidades
    - ✅ Revisar y aprobar los cambios aplicados
    - ✅ Verificar la compilación del proyecto modernizado

---

## Siguiente Paso

Continúa con el **[Lab 4 — Despliegue en Liberty](../lab4/index.md)**, donde construirás la imagen de contenedor de PedjasApp modernizada y la desplegarás en WebSphere Liberty.
