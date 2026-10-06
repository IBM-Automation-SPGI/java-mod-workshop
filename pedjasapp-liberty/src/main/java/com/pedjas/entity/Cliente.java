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
 * Entidad JPA para el Cliente.
 * Reemplaza la gestión de clientes vía JDBC directo de la versión tWAS.
 */
@Entity
@Table(name = "CLIENTES")
@NamedQueries({
    @NamedQuery(
        name  = "Cliente.findByUsuario",
        query = "SELECT c FROM Cliente c WHERE c.usuario = :usuario"
    ),
    @NamedQuery(
        name  = "Cliente.autenticar",
        query = "SELECT c FROM Cliente c WHERE c.usuario = :usuario AND c.contrasena = :contrasena"
    )
})
public class Cliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "USUARIO", nullable = false, unique = true, length = 50)
    private String usuario;

    @Column(name = "CONTRASENA", nullable = false, length = 100)
    private String contrasena;

    @Column(name = "NOMBRE", length = 100)
    private String nombre;

    @Column(name = "EMAIL", length = 150)
    private String email;

    // Constructores

    public Cliente() {}

    public Cliente(String usuario, String contrasena, String nombre, String email) {
        this.usuario    = usuario;
        this.contrasena = contrasena;
        this.nombre     = nombre;
        this.email      = email;
    }

    // Getters y setters

    public Long getId()                    { return id; }
    public void setId(Long id)             { this.id = id; }

    public String getUsuario()             { return usuario; }
    public void setUsuario(String u)       { this.usuario = u; }

    public String getContrasena()          { return contrasena; }
    public void setContrasena(String c)    { this.contrasena = c; }

    public String getNombre()              { return nombre; }
    public void setNombre(String n)        { this.nombre = n; }

    public String getEmail()               { return email; }
    public void setEmail(String e)         { this.email = e; }
}
