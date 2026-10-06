# Lab 3 — Modernización Manual Guiada por AMA

---

## Objetivo del Lab

En este lab aplicarás los cambios de código identificados por AMA en el Lab 2. Al finalizar, tendrás la versión **Liberty-compatible** de PedjasApp, con todas las dependencias propietarias de tWAS eliminadas o sustituidas por equivalentes estándar Jakarta EE.

---

## Estrategia de Modernización

Abordaremos los cambios en orden de prioridad según los resultados de AMA:

| Prioridad | Regla AMA | Cambio a realizar |
|-----------|-----------|-------------------|
| 1 | RULE-0002 — EJB 2.x CMP | Convertir Entity Beans a entidades JPA |
| 2 | RULE-0001 — IBM WebSphere API | Eliminar imports `com.ibm.websphere.*` |
| 3 | RULE-0003 — JNDI propietario | Usar `@Resource` injection estándar |
| 4 | RULE-0004 — ibm-web-bnd.xml | Eliminar descriptores WAS, mover a `server.xml` |
| 5 | RULE-0005 — JMS WAS | Reconfigurar JMS para Liberty |
| 6 | RULE-0006 — EJB Home Interface | Simplificar acceso a EJBs con `@EJB` |

---

## Cambio 1 — EJB 2.x CMP → Entidades JPA

### Antes (versión tWAS)

Los Entity Beans CMP en EJB 2.x requieren métodos abstractos para cada atributo y un Home Interface para ser localizados:

```java title="pedjasapp-twas/pedjasapp-ejb/src/main/java/com/pedjas/ejb/ProductoBean.java"
package com.pedjas.ejb;

import javax.ejb.EntityBean;
import javax.ejb.EntityContext;

/**
 * EJB 2.x Container-Managed Persistence Entity Bean
 * NO compatible con WebSphere Liberty
 */
public abstract class ProductoBean implements EntityBean {

    private EntityContext entityContext;

    // Métodos CMP abstractos — generados por el contenedor en tiempo de despliegue
    public abstract Long getId();
    public abstract void setId(Long id);

    public abstract String getNombre();
    public abstract void setNombre(String nombre);

    public abstract String getDescripcion();
    public abstract void setDescripcion(String descripcion);

    public abstract Double getPrecio();
    public abstract void setPrecio(Double precio);

    public abstract String getCategoria();
    public abstract void setCategoria(String categoria);

    // Método ejbCreate — equivalente al constructor en EJB 2.x
    public Long ejbCreate(Long id, String nombre, Double precio) {
        setId(id);
        setNombre(nombre);
        setPrecio(precio);
        return null; // CMP requiere null en ejbCreate
    }

    public void ejbPostCreate(Long id, String nombre, Double precio) {
        // Inicialización post-creación
    }

    // Callbacks del ciclo de vida EJB 2.x — obligatorios aunque estén vacíos
    public void ejbActivate()   {}
    public void ejbPassivate()  {}
    public void ejbLoad()       {}
    public void ejbStore()      {}
    public void ejbRemove()     {}

    public void setEntityContext(EntityContext ctx) { this.entityContext = ctx; }
    public void unsetEntityContext()                { this.entityContext = null; }
}
```

### Después (versión Liberty)

```java title="pedjasapp-liberty/src/main/java/com/pedjas/entity/Producto.java"
package com.pedjas.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.NamedQueries;
import jakarta.persistence.NamedQuery;
import jakarta.persistence.Table;

/**
 * Entidad JPA — reemplaza el EJB 2.x CMP ProductoBean.
 * Compatible con WebSphere Liberty 26.0.0.9 mediante la feature persistence-3.1.
 */
@Entity
@Table(name = "PRODUCTOS")
@NamedQueries({
    @NamedQuery(
        name  = "Producto.findAll",
        query = "SELECT p FROM Producto p ORDER BY p.nombre"
    ),
    @NamedQuery(
        name  = "Producto.findByCategoria",
        query = "SELECT p FROM Producto p WHERE p.categoria = :categoria"
    )
})
public class Producto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "NOMBRE", nullable = false, length = 100)
    private String nombre;

    @Column(name = "DESCRIPCION", length = 500)
    private String descripcion;

    @Column(name = "PRECIO", nullable = false)
    private Double precio;

    @Column(name = "CATEGORIA", length = 50)
    private String categoria;

    // Constructores
    public Producto() {}

    public Producto(String nombre, Double precio, String categoria) {
        this.nombre    = nombre;
        this.precio    = precio;
        this.categoria = categoria;
    }

    // Getters y setters
    public Long getId()                    { return id; }
    public void setId(Long id)             { this.id = id; }

    public String getNombre()              { return nombre; }
    public void setNombre(String nombre)   { this.nombre = nombre; }

    public String getDescripcion()         { return descripcion; }
    public void setDescripcion(String d)   { this.descripcion = d; }

    public Double getPrecio()              { return precio; }
    public void setPrecio(Double precio)   { this.precio = precio; }

    public String getCategoria()           { return categoria; }
    public void setCategoria(String c)     { this.categoria = c; }
}
```

---

## Cambio 2 — Eliminar APIs `com.ibm.websphere.*`

### Antes (versión tWAS)

```java title="pedjasapp-twas/.../ PedidoServiceBean.java (extracto)"
import com.ibm.websphere.naming.JndiHelper;
import com.ibm.websphere.cache.DistributedMap;

// ...dentro del método procesarPedido():
DistributedMap cache = (DistributedMap)
    JndiHelper.lookup("services/cache/pedidos");
cache.put("ultimo-pedido-" + clienteId, pedido);
```

### Después (versión Liberty)

```java title="pedjasapp-liberty/src/main/java/com/pedjas/service/PedidoService.java (extracto)"
// Se elimina la caché distribuida WAS.
// Se usa un ConcurrentHashMap en memoria como sustitución simple,
// o se puede integrar con JCache (Hazelcast/EhCache) si se necesita distribución.
import java.util.concurrent.ConcurrentHashMap;

private final ConcurrentHashMap<String, Pedido> cacheLocal =
    new ConcurrentHashMap<>();

// ...dentro del método procesarPedido():
cacheLocal.put("ultimo-pedido-" + clienteId, pedido);
```

---

## Cambio 3 — JNDI Propietario → `@Resource` Injection

### Antes (versión tWAS)

```java title="pedjasapp-twas/.../CatalogoServlet.java (extracto)"
// JNDI lookup manual — propenso a errores y no portable
try {
    Context ctx = new InitialContext();
    // El nombre real en WAS tiene prefijo cell/persistent/
    DataSource ds = (DataSource) ctx.lookup("jdbc/pedjasappDS");
    Connection conn = ds.getConnection();
    // ...
} catch (NamingException e) {
    throw new ServletException("No se pudo obtener el DataSource", e);
}
```

### Después (versión Liberty)

```java title="pedjasapp-liberty/src/main/java/com/pedjas/web/CatalogoServlet.java (extracto)"
// Inyección de recursos estándar — portable y sin código de inicialización
@WebServlet("/catalogo")
public class CatalogoServlet extends HttpServlet {

    // Liberty inyecta el DataSource declarado en server.xml / web.xml
    @Resource(name = "jdbc/pedjasappDS")
    private DataSource dataSource;

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        try (Connection conn = dataSource.getConnection()) {
            // Usar conn normalmente
        } catch (SQLException e) {
            throw new ServletException("Error de base de datos", e);
        }
    }
}
```

En `web.xml` se declara la referencia al recurso (esto ya era necesario en tWAS, pero ahora es portable):

```xml title="pedjasapp-liberty/src/main/webapp/WEB-INF/web.xml (extracto)"
<resource-ref>
    <description>DataSource de PedjasApp</description>
    <res-ref-name>jdbc/pedjasappDS</res-ref-name>
    <res-type>jakarta.sql.DataSource</res-type>
    <res-auth>Container</res-auth>
</resource-ref>
```

---

## Cambio 4 — Eliminar `ibm-web-bnd.xml` e `ibm-ejb-jar-bnd.xml`

Los ficheros de binding propietarios de WAS se eliminan. Su contenido se traslada al `server.xml` de Liberty.

**Ficheros a eliminar:**
- `pedjasapp-web/src/main/webapp/WEB-INF/ibm-web-bnd.xml`
- `pedjasapp-ejb/src/main/resources/META-INF/ibm-ejb-jar-bnd.xml`

La configuración de recursos se define ahora en `server.xml` (ver **Lab 4**).

---

## Cambio 5 — Reconfigurar JMS para Liberty

### Antes (versión tWAS)

```java title="pedjasapp-twas/.../NotificacionBean.java (extracto)"
// Lookup manual de recursos JMS WAS
Context ctx = new InitialContext();
QueueConnectionFactory qcf =
    (QueueConnectionFactory) ctx.lookup("jms/PedjasQCF");
Queue cola = (Queue) ctx.lookup("jms/PedjasNotificacionesQ");

QueueConnection conn = qcf.createQueueConnection();
QueueSession session = conn.createQueueSession(false,
    Session.AUTO_ACKNOWLEDGE);
QueueSender sender = session.createSender(cola);
TextMessage msg = session.createTextMessage();
msg.setText("Pedido " + pedidoId + " creado OK");
sender.send(msg);
```

### Después (versión Liberty)

```java title="pedjasapp-liberty/src/main/java/com/pedjas/service/NotificacionService.java"
package com.pedjas.service;

import jakarta.annotation.Resource;
import jakarta.ejb.Stateless;
import jakarta.ejb.TransactionAttribute;
import jakarta.ejb.TransactionAttributeType;
import jakarta.inject.Inject;
import jakarta.jms.JMSConnectionFactory;
import jakarta.jms.JMSContext;
import jakarta.jms.Queue;

/**
 * Servicio de notificaciones usando JMS 3.0 simplificado.
 * A API JMSContext es compatible con WebSphere Liberty mediante la feature messaging-3.1.
 */
@Stateless
public class NotificacionService {

    // Liberty inyecta la ConnectionFactory declarada en server.xml
    @Inject
    @JMSConnectionFactory("jms/PedjasQCF")
    private JMSContext jmsContext;

    @Resource(name = "jms/PedjasNotificacionesQ")
    private Queue colaNotificaciones;

    /**
     * Envía una notificación asíncrona sobre la creación de un pedido.
     * REQUIRES_NEW aísla esta transacción JMS de la del pedido que la invoca.
     *
     * @param pedidoId  Identificador del pedido creado
     * @param clienteId Identificador del cliente
     */
    @TransactionAttribute(TransactionAttributeType.REQUIRES_NEW)
    public void notificarPedidoCreado(Long pedidoId, Long clienteId) {
        String mensaje = String.format(
            "{\"tipo\":\"PEDIDO_CREADO\",\"pedidoId\":%d,\"clienteId\":%d}",
            pedidoId, clienteId
        );
        jmsContext.createProducer().send(colaNotificaciones, mensaje);
    }
}
```

---

## Cambio 6 — EJB Home Interface → Inyección Directa

### Antes (versión tWAS)

```java title="pedjasapp-twas/.../PedidoServiceBean.java (extracto)"
// Lookup del Home Interface — patrón EJB 2.x
Context ctx = new InitialContext();
CatalogoHome home = (CatalogoHome)
    PortableRemoteObject.narrow(
        ctx.lookup("ejb/CatalogoEJB"),
        CatalogoHome.class
    );
CatalogoLocal catalogo = home.create();
List<Producto> productos = catalogo.buscarPorCategoria("ELECTRONICA");
```

### Después (versión Liberty)

```java title="pedjasapp-liberty/src/main/java/com/pedjas/service/PedidoService.java (extracto)"
// Inyección directa del Session Bean — EJB 3.x estándar
@Stateless
public class PedidoService {

    // No se necesita Home Interface — se inyecta directamente
    @EJB
    private CatalogoService catalogoService;

    public Pedido crearPedido(Long clienteId, Long productoId, int cantidad) {
        Producto producto = catalogoService.buscarPorId(productoId);
        // ...
    }
}
```

---

## Actualizar `persistence.xml`

La versión Liberty usa un `persistence.xml` estándar que referencia el DataSource de Liberty:

```xml title="pedjasapp-liberty/src/main/resources/META-INF/persistence.xml"
<?xml version="1.0" encoding="UTF-8"?>
<persistence version="3.0"
    xmlns="https://jakarta.ee/xml/ns/persistence"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="https://jakarta.ee/xml/ns/persistence
                        https://jakarta.ee/xml/ns/persistence/persistence_3_0.xsd">

    <persistence-unit name="pedjasappPU" transaction-type="JTA">
        <!-- Liberty gestionará la transacción JTA automáticamente -->
        <jta-data-source>jdbc/pedjasappDS</jta-data-source>

        <!-- Entidades JPA del dominio -->
        <class>com.pedjas.entity.Producto</class>
        <class>com.pedjas.entity.Cliente</class>
        <class>com.pedjas.entity.Pedido</class>
        <class>com.pedjas.entity.LineaPedido</class>

        <properties>
            <!-- Crear las tablas automáticamente en el primer arranque -->
            <property name="jakarta.persistence.schema-generation.database.action"
                      value="create"/>
            <!-- Insertar datos de prueba si las tablas están vacías -->
            <property name="jakarta.persistence.sql-load-script-source"
                      value="META-INF/datos-prueba.sql"/>
        </properties>
    </persistence-unit>
</persistence>
```

---

## Resumen del Lab 3

!!! success "Completado"
    En este lab has aplicado los 6 cambios principales identificados por AMA:

    1. ✅ Entidades JPA reemplazan los EJB 2.x CMP Entity Beans
    2. ✅ APIs `com.ibm.websphere.*` eliminadas y sustituidas por estándares Java EE
    3. ✅ JNDI propietario sustituido por inyección `@Resource`
    4. ✅ Descriptores WAS eliminados (ibm-web-bnd.xml, ibm-ejb-jar-bnd.xml)
    5. ✅ JMS actualizado a la API JMS 2.0 estándar
    6. ✅ EJB Home Interfaces eliminadas, reemplazadas por inyección `@EJB`

---


## Siguiente Paso

Continúa con el **[Lab 4 — Despliegue en Liberty](../lab4/index.md)**, donde construirás la imagen Docker de PedjasApp modernizada y la desplegarás en WebSphere Liberty.
