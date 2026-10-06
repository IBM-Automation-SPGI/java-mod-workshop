package com.pedjas.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.NamedQueries;
import jakarta.persistence.NamedQuery;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

/**
 * Entidad JPA para un Pedido.
 * Reemplaza el JDBC directo de PedidoServiceBean (tWAS).
 */
@Entity
@Table(name = "PEDIDOS")
@NamedQueries({
    @NamedQuery(
        name  = "Pedido.findByCliente",
        query = "SELECT p FROM Pedido p WHERE p.cliente.id = :clienteId ORDER BY p.fechaCreacion DESC"
    ),
    @NamedQuery(
        name  = "Pedido.findAll",
        query = "SELECT p FROM Pedido p ORDER BY p.fechaCreacion DESC"
    )
})
public class Pedido {

    public enum Estado {
        PENDIENTE, PROCESADO, ENVIADO, ENTREGADO, CANCELADO
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "CLIENTE_ID", nullable = false)
    private Cliente cliente;

    @Enumerated(EnumType.STRING)
    @Column(name = "ESTADO", nullable = false, length = 20)
    private Estado estado = Estado.PENDIENTE;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "FECHA_CREACION", nullable = false)
    private Date fechaCreacion;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "FECHA_ACTUALIZACION")
    private Date fechaActualizacion;

    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<LineaPedido> lineas = new ArrayList<>();

    // Callbacks JPA

    @PrePersist
    protected void onCreate() {
        fechaCreacion       = new Date();
        fechaActualizacion  = new Date();
    }

    @PreUpdate
    protected void onUpdate() {
        fechaActualizacion = new Date();
    }

    // Constructores

    public Pedido() {}

    public Pedido(Cliente cliente) {
        this.cliente = cliente;
    }

    // Getters y setters

    public Long getId()                       { return id; }
    public void setId(Long id)                { this.id = id; }

    public Cliente getCliente()               { return cliente; }
    public void setCliente(Cliente c)         { this.cliente = c; }

    public Estado getEstado()                 { return estado; }
    public void setEstado(Estado estado)      { this.estado = estado; }

    public Date getFechaCreacion()            { return fechaCreacion; }
    public Date getFechaActualizacion()       { return fechaActualizacion; }

    public List<LineaPedido> getLineas()      { return lineas; }
    public void setLineas(List<LineaPedido> l) { this.lineas = l; }

    /** Calcula el importe total del pedido sumando las líneas. */
    public Double getTotalPedido() {
        return lineas.stream()
            .mapToDouble(l -> l.getPrecioUnitario() * l.getCantidad())
            .sum();
    }
}
