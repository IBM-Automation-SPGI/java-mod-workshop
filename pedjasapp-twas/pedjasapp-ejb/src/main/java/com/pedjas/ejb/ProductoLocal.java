package com.pedjas.ejb;

import javax.ejb.EJBLocalObject;

/**
 * EJB 2.x Local Component Interface para ProductoBean.
 *
 * Define los métodos de negocio accesibles en la misma JVM (interfaz local).
 *
 * NOTA AMA — RULE-0006: Este interfaz se elimina en la versión Liberty,
 * donde las entidades son POJOs gestionados por JPA.
 */
public interface ProductoLocal extends EJBLocalObject {

    Long getId();

    String getNombre();
    void setNombre(String nombre);

    String getDescripcion();
    void setDescripcion(String descripcion);

    Double getPrecio();
    void setPrecio(Double precio);

    String getCategoria();
    void setCategoria(String categoria);

    Integer getStock();
    void setStock(Integer stock);
}
