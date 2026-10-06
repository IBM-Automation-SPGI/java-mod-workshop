package com.pedjas.service;

import com.pedjas.entity.Cliente;

import jakarta.ejb.Stateless;
import jakarta.ejb.TransactionAttribute;
import jakarta.ejb.TransactionAttributeType;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.persistence.PersistenceContext;
import java.util.logging.Logger;

/**
 * Servicio de gestión de clientes — EJB 3.x Stateless Session Bean.
 * Reemplaza el JDBC directo del método autenticarUsuario de InicioServlet (tWAS).
 */
@Stateless
public class ClienteService {

    private static final Logger LOGGER =
        Logger.getLogger(ClienteService.class.getName());

    @PersistenceContext(unitName = "pedjasappPU")
    private EntityManager em;

    /**
     * Verifica las credenciales del usuario.
     *
     * @param usuario    Nombre de usuario
     * @param contrasena Contraseña (en texto plano; en producción usar hash)
     * @return El Cliente autenticado, o null si las credenciales son inválidas
     */
    @TransactionAttribute(TransactionAttributeType.SUPPORTS)
    public Cliente autenticar(String usuario, String contrasena) {
        try {
            return em.createNamedQuery("Cliente.autenticar", Cliente.class)
                     .setParameter("usuario",    usuario)
                     .setParameter("contrasena", contrasena)
                     .getSingleResult();
        } catch (NoResultException e) {
            LOGGER.fine("Autenticación fallida para usuario: " + usuario);
            return null;
        }
    }

    /**
     * Busca un cliente por su identificador.
     *
     * @param id Identificador del cliente
     * @return El cliente, o null si no existe
     */
    @TransactionAttribute(TransactionAttributeType.SUPPORTS)
    public Cliente buscarPorId(Long id) {
        return em.find(Cliente.class, id);
    }

    /**
     * Registra un nuevo cliente en el sistema.
     *
     * @param usuario    Nombre de usuario único
     * @param contrasena Contraseña
     * @param nombre     Nombre completo del cliente
     * @param email      Correo electrónico del cliente
     * @return El cliente registrado con su ID generado
     */
    @TransactionAttribute(TransactionAttributeType.REQUIRED)
    public Cliente registrar(String usuario, String contrasena,
                              String nombre, String email) {
        Cliente cliente = new Cliente(usuario, contrasena, nombre, email);
        em.persist(cliente);
        LOGGER.info("Cliente registrado: " + usuario);
        return cliente;
    }
}
