# Lab 3 — Manual Modernization Guided by AMA

---

## Lab Objective

In this lab you will apply the prioritized code modifications identified by AMA during Lab 2. Upon completion, PedjasApp will be fully compatible with **WebSphere Liberty 26.0.0.9**, running on **Jakarta EE 10** with all proprietary dependencies replaced by standards.

---

## Modernization Strategy

We will address the findings in order of priority:

| Priority | AMA Rule | Modernization Action |
|----------|----------|----------------------|
| 1 | RULE-0002 — EJB 2.x CMP | Convert Entity Beans to standard JPA entities |
| 2 | RULE-0001 — IBM WebSphere API | Remove `com.ibm.websphere.*` imports |
| 3 | RULE-0003 — Proprietary JNDI | Use standard `@Resource` and `@EJB` dependency injection |
| 4 | RULE-0004 — ibm-web-bnd.xml | Remove WAS XML binding descriptors; move to `server.xml` |
| 5 | RULE-0005 — JMS WAS | Reconfigure JMS resources natively for Liberty |
| 6 | RULE-0006 — EJB Home Interface | Replace legacy Home lookups with direct CDI/EJB injection |

---

## Transformation 1 — EJB CMP 2.0 to JPA Entity

### Before (tWAS)
Legacy CMP entity beans defined abstract getter/setter pairs with container-generated persistence delegates:

```java
public abstract class ProductoBean implements EntityBean {
    public abstract Long getId();
    public abstract void setId(Long id);
    public abstract String getNombre();
    public abstract void setNombre(String nombre);
}
```

### After (Liberty)
Standard Jakarta Persistence Entity with annotations:

```java
@Entity
@Table(name = "productos")
public class Producto implements Serializable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nombre;

    // Standard getters and setters
}
```

---

## Transformation 2 — Removing Proprietary WebSphere APIs

Replace WebSphere thread context or server-specific utility classes with standard Jakarta Concurrency / MicroProfile constructs.

---

## Transformation 3 — Datasource and JNDI Mapping

Configure PostgreSQL DataSource cleanly in Liberty `server.xml` and inject using standard portable JNDI:

```java
@Resource(lookup = "jdbc/PedjasDS")
private DataSource dataSource;
```

---

## Summary

!!! success "Completed"
    You have:

    - Converted legacy EJB 2.x CMP components into clean JPA entities
    - Removed proprietary `com.ibm.websphere.*` imports
    - Migrated resource lookups to portable Jakarta EE annotations
    - Packaged the project into a streamlined single WAR archive

---

## Next Step

Proceed to **[Lab 4 — Deploy on Liberty](../lab4/index.en.md)** to containerize and run the application.
