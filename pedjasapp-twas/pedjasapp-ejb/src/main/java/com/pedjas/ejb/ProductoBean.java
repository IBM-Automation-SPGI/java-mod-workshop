package com.pedjas.ejb;

import javax.ejb.EntityBean;
import javax.ejb.EntityContext;

/**
 * EJB 2.x Entity Bean con Container-Managed Persistence (CMP) para la entidad Producto.
 *
 * NOTA AMA — RULE-0002: Este tipo de EJB no está soportado en WebSphere Liberty.
 * En la versión modernizada se reemplaza por una entidad JPA (@Entity).
 *
 * Desplegado en tWAS mediante el descriptor ejb-jar.xml con
 * &lt;persistence-type&gt;Container&lt;/persistence-type&gt;.
 */
public abstract class ProductoBean implements EntityBean {

    private EntityContext entityContext;

    // ─── Atributos CMP gestionados por el contenedor ─────────────────────────

    /** Clave primaria — gestionada por el contenedor tWAS */
    public abstract Long getId();
    public abstract void setId(Long id);

    /** Nombre del producto */
    public abstract String getNombre();
    public abstract void setNombre(String nombre);

    /** Descripción extendida del producto */
    public abstract String getDescripcion();
    public abstract void setDescripcion(String descripcion);

    /** Precio unitario del producto */
    public abstract Double getPrecio();
    public abstract void setPrecio(Double precio);

    /** Categoría del producto (p. ej. ELECTRONICA, ROPA, HOGAR) */
    public abstract String getCategoria();
    public abstract void setCategoria(String categoria);

    /** Unidades disponibles en stock */
    public abstract Integer getStock();
    public abstract void setStock(Integer stock);

    // ─── Select queries EJB 2.x ──────────────────────────────────────────────
    // Las consultas ejbSelect* son métodos de selección definidos en ejb-jar.xml
    // mediante <query><ejb-ql>...</ejb-ql></query>.
    // Son ejecutadas directamente por el motor CMP del contenedor.

    /**
     * Selecciona todos los productos de una categoría dada.
     * Definida en ejb-jar.xml como EJB-QL:
     *   SELECT OBJECT(p) FROM Producto AS p WHERE p.categoria = ?1
     */
    public abstract java.util.Collection ejbSelectByCategoria(String categoria)
        throws javax.ejb.FinderException;

    // ─── Ciclo de vida EJB 2.x ───────────────────────────────────────────────

    /**
     * ejbCreate — equivalente al constructor en EJB 2.x.
     * En CMP debe devolver null; el contenedor genera la clave primaria
     * según la configuración del descriptor.
     */
    public Long ejbCreate(Long id, String nombre, Double precio, String categoria)
            throws javax.ejb.CreateException {
        setId(id);
        setNombre(nombre);
        setPrecio(precio);
        setCategoria(categoria);
        setStock(0);
        return null; // Obligatorio en CMP
    }

    /**
     * ejbPostCreate — invocado por el contenedor justo después de ejbCreate.
     * Se puede usar para configurar relaciones CMR.
     */
    public void ejbPostCreate(Long id, String nombre, Double precio, String categoria) {
        // Sin lógica adicional en este bean
    }

    // ─── Callbacks obligatorios de EntityBean ────────────────────────────────

    @Override
    public void ejbActivate() {
        // Invocado cuando el bean se activa desde el pool pasivado
    }

    @Override
    public void ejbPassivate() {
        // Invocado antes de que el bean sea pasivado al pool
    }

    @Override
    public void ejbLoad() {
        // Invocado antes de acceder al estado del bean (carga desde BD)
    }

    @Override
    public void ejbStore() {
        // Invocado antes de persistir el estado del bean (escritura en BD)
    }

    @Override
    public void ejbRemove() {
        // Invocado cuando el bean es eliminado
    }

    @Override
    public void setEntityContext(EntityContext ctx) {
        this.entityContext = ctx;
    }

    @Override
    public void unsetEntityContext() {
        this.entityContext = null;
    }
}
