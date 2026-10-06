package com.pedjas.service;

import com.pedjas.entity.Producto;

import jakarta.ejb.Stateless;
import jakarta.ejb.TransactionAttribute;
import jakarta.ejb.TransactionAttributeType;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import java.util.List;
import java.util.logging.Logger;

/**
 * Servicio del catálogo de productos — EJB 3.x Stateless Session Bean.
 *
 * Reemplaza en su totalidad:
 *   - ProductoBean (EJB 2.x CMP Entity Bean)
 *   - ProductoLocalHome (EJB 2.x Home Interface)
 *   - ProductoLocal (EJB 2.x Component Interface)
 *
 * La persistencia se delega en JPA a través del EntityManager inyectado por Liberty.
 * No hay ninguna dependencia com.ibm.websphere.* ni APIs propietarias de tWAS.
 */
@Stateless
public class CatalogoService {

    private static final Logger LOGGER =
        Logger.getLogger(CatalogoService.class.getName());

    /**
     * EntityManager inyectado por Liberty usando la unidad de persistencia "pedjasappPU"
     * definida en META-INF/persistence.xml.
     */
    @PersistenceContext(unitName = "pedjasappPU")
    private EntityManager em;

    /**
     * Obtiene todos los productos del catálogo, ordenados por nombre.
     *
     * @return Lista de todos los productos
     */
    @TransactionAttribute(TransactionAttributeType.SUPPORTS)
    public List<Producto> obtenerTodos() {
        return em.createNamedQuery("Producto.findAll", Producto.class)
                 .getResultList();
    }

    /**
     * Obtiene los productos de una categoría concreta.
     *
     * @param categoria Nombre de la categoría
     * @return Lista de productos de esa categoría
     */
    @TransactionAttribute(TransactionAttributeType.SUPPORTS)
    public List<Producto> obtenerPorCategoria(String categoria) {
        return em.createNamedQuery("Producto.findByCategoria", Producto.class)
                 .setParameter("categoria", categoria)
                 .getResultList();
    }

    /**
     * Busca un producto por su identificador.
     *
     * @param id Identificador del producto
     * @return El producto, o null si no existe
     */
    @TransactionAttribute(TransactionAttributeType.SUPPORTS)
    public Producto buscarPorId(Long id) {
        return em.find(Producto.class, id);
    }

    /**
     * Persiste un nuevo producto en la base de datos.
     *
     * @param producto Producto a guardar
     * @return El producto con el ID generado
     */
    @TransactionAttribute(TransactionAttributeType.REQUIRED)
    public Producto guardar(Producto producto) {
        em.persist(producto);
        LOGGER.info("Producto guardado: " + producto.getNombre());
        return producto;
    }

    /**
     * Actualiza el stock de un producto.
     *
     * @param productoId Identificador del producto
     * @param nuevoStock Nuevo valor del stock
     */
    @TransactionAttribute(TransactionAttributeType.REQUIRED)
    public void actualizarStock(Long productoId, int nuevoStock) {
        Producto producto = em.find(Producto.class, productoId);
        if (producto != null) {
            producto.setStock(nuevoStock);
            LOGGER.info("Stock actualizado — producto=" + productoId + " stock=" + nuevoStock);
        }
    }
}
