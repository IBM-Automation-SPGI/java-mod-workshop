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
 * Entidad JPA que reemplaza el EJB 2.x CMP ProductoBean de la versión tWAS.
 *
 * Cambios respecto a tWAS:
 *   - Eliminado: ProductoBean (implements EntityBean), ProductoLocalHome, ProductoLocal
 *   - Añadido: @Entity JPA con @NamedQueries equivalentes a los EJB-QL del ejb-jar.xml
 *   - Namespace: jakarta.persistence (en lugar de javax.persistence)
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
        query = "SELECT p FROM Producto p WHERE p.categoria = :categoria ORDER BY p.nombre"
    ),
    @NamedQuery(
        name  = "Producto.findById",
        query = "SELECT p FROM Producto p WHERE p.id = :id"
    )
})
public class Producto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "NOMBRE", nullable = false, unique = true, length = 100)
    private String nombre;

    @Column(name = "DESCRIPCION", length = 500)
    private String descripcion;

    @Column(name = "PRECIO", nullable = false)
    private Double precio;

    @Column(name = "CATEGORIA", length = 50)
    private String categoria;

    @Column(name = "STOCK", nullable = false)
    private Integer stock = 0;

    // Constructores

    public Producto() {}

    public Producto(String nombre, String descripcion, Double precio,
                    String categoria, Integer stock) {
        this.nombre      = nombre;
        this.descripcion = descripcion;
        this.precio      = precio;
        this.categoria   = categoria;
        this.stock       = stock;
    }

    // Getters y setters

    public Long getId()                      { return id; }
    public void setId(Long id)               { this.id = id; }

    public String getNombre()                { return nombre; }
    public void setNombre(String nombre)     { this.nombre = nombre; }

    public String getDescripcion()           { return descripcion; }
    public void setDescripcion(String d)     { this.descripcion = d; }

    public Double getPrecio()                { return precio; }
    public void setPrecio(Double precio)     { this.precio = precio; }

    public String getCategoria()             { return categoria; }
    public void setCategoria(String c)       { this.categoria = c; }

    public Integer getStock()                { return stock; }
    public void setStock(Integer stock)      { this.stock = stock; }

    @Override
    public String toString() {
        return "Producto{id=" + id + ", nombre='" + nombre + "', precio=" + precio + "}";
    }
}
