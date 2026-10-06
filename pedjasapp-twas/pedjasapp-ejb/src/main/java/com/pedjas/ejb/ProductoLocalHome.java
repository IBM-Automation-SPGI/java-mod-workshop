package com.pedjas.ejb;

import javax.ejb.EJBLocalHome;
import javax.ejb.CreateException;
import javax.ejb.FinderException;
import java.util.Collection;

/**
 * EJB 2.x Local Home Interface para ProductoBean.
 *
 * NOTA AMA — RULE-0006: Los Home Interfaces son un patrón obsoleto de EJB 2.x.
 * En la versión modernizada se elimina este interface y se usa inyección @EJB.
 */
public interface ProductoLocalHome extends EJBLocalHome {

    /**
     * Crea un nuevo producto en la base de datos.
     *
     * @param id        Identificador único del producto
     * @param nombre    Nombre descriptivo del producto
     * @param precio    Precio unitario
     * @param categoria Categoría del producto
     * @return Referencia local al ProductoLocal recién creado
     * @throws CreateException si la creación falla
     */
    ProductoLocal create(Long id, String nombre, Double precio, String categoria)
        throws CreateException;

    /**
     * Localiza un producto por su clave primaria.
     *
     * @param id Clave primaria del producto
     * @return Referencia local al producto
     * @throws FinderException si no se encuentra el producto
     */
    ProductoLocal findByPrimaryKey(Long id) throws FinderException;

    /**
     * Devuelve todos los productos del catálogo.
     *
     * @return Colección de referencias ProductoLocal
     * @throws FinderException si la consulta falla
     */
    Collection<ProductoLocal> findAll() throws FinderException;

    /**
     * Localiza productos por categoría.
     *
     * @param categoria Categoría a filtrar
     * @return Colección de referencias ProductoLocal de esa categoría
     * @throws FinderException si la consulta falla
     */
    Collection<ProductoLocal> findByCategoria(String categoria) throws FinderException;
}
