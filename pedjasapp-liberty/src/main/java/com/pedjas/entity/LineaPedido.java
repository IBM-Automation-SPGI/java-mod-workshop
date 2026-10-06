package com.pedjas.entity;

import jakarta.json.bind.annotation.JsonbTransient;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * Entidad JPA para una línea individual de un pedido.
 */
@Entity
@Table(name = "LINEAS_PEDIDO")
public class LineaPedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @JsonbTransient           // evita la referencia circular Pedido ↔ LineaPedido en JSON
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PEDIDO_ID", nullable = false)
    private Pedido pedido;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PRODUCTO_ID", nullable = false)
    private Producto producto;

    @Column(name = "CANTIDAD", nullable = false)
    private Integer cantidad;

    @Column(name = "PRECIO_UNITARIO", nullable = false)
    private Double precioUnitario;

    // Constructores

    public LineaPedido() {}

    public LineaPedido(Pedido pedido, Producto producto, Integer cantidad) {
        this.pedido         = pedido;
        this.producto       = producto;
        this.cantidad       = cantidad;
        this.precioUnitario = producto.getPrecio();
    }

    // Getters y setters

    public Long getId()                           { return id; }
    public void setId(Long id)                    { this.id = id; }

    public Pedido getPedido()                     { return pedido; }
    public void setPedido(Pedido p)               { this.pedido = p; }

    public Producto getProducto()                 { return producto; }
    public void setProducto(Producto p)           { this.producto = p; }

    public Integer getCantidad()                  { return cantidad; }
    public void setCantidad(Integer c)            { this.cantidad = c; }

    public Double getPrecioUnitario()             { return precioUnitario; }
    public void setPrecioUnitario(Double p)       { this.precioUnitario = p; }

    public Double getSubtotal()                   { return precioUnitario * cantidad; }
}
