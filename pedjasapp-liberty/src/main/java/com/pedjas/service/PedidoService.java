package com.pedjas.service;

import com.pedjas.entity.Cliente;
import com.pedjas.entity.LineaPedido;
import com.pedjas.entity.Pedido;
import com.pedjas.entity.Producto;

import jakarta.ejb.EJB;
import jakarta.ejb.EJBException;
import jakarta.ejb.Stateless;
import jakarta.ejb.TransactionAttribute;
import jakarta.ejb.TransactionAttributeType;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.logging.Logger;

/**
 * Servicio de gestión de pedidos — EJB 3.x Stateless Session Bean.
 *
 * Cambios respecto a la versión tWAS (PedidoServiceBean):
 *
 *   ELIMINADO — com.ibm.websphere.naming.JndiHelper (RULE-0001)
 *     → Las dependencias se inyectan con @EJB y @PersistenceContext
 *
 *   ELIMINADO — com.ibm.websphere.cache.DistributedMap (RULE-0001)
 *     → Sustituido por ConcurrentHashMap local (suficiente para un nodo)
 *       En entornos multi-nodo se puede usar JCache (JSR-107) con un proveedor
 *       como Hazelcast o EhCache.
 *
 *   ELIMINADO — InitialContext.lookup("jdbc/pedjasappDS") (RULE-0003)
 *     → Sustituido por @PersistenceContext (JPA gestiona el DataSource)
 *
 *   ELIMINADO — Uso del Home Interface ProductoLocalHome (RULE-0006)
 *     → Sustituido por @EJB CatalogoService (inyección directa EJB 3.x)
 *
 *   ELIMINADO — JDBC directo
 *     → Sustituido por EntityManager JPA
 *
 *   NAMESPACE: javax.* → jakarta.*
 */
@Stateless
public class PedidoService {

    private static final Logger LOGGER =
        Logger.getLogger(PedidoService.class.getName());

    @PersistenceContext(unitName = "pedjasappPU")
    private EntityManager em;

    // Inyección directa — no se necesita Home Interface ni InitialContext
    @EJB
    private CatalogoService catalogoService;

    @EJB
    private NotificacionService notificacionService;

    /**
     * Caché local en memoria que reemplaza la DistributedMap WAS.
     * Almacena el ID del último pedido creado por cada cliente.
     * ConcurrentHashMap es thread-safe sin necesidad de sincronización explícita.
     */
    private final ConcurrentHashMap<Long, Long> ultimoPedidoPorCliente =
        new ConcurrentHashMap<>();

    /**
     * Crea un nuevo pedido para el cliente y producto indicados.
     *
     * @param clienteId  Identificador del cliente
     * @param productoId Identificador del producto
     * @param cantidad   Cantidad solicitada
     * @return El pedido creado con su ID generado por la base de datos
     */
    @TransactionAttribute(TransactionAttributeType.REQUIRED)
    public Pedido crearPedido(Long clienteId, Long productoId, int cantidad) {
        LOGGER.info("Creando pedido — cliente=" + clienteId
            + " producto=" + productoId + " cantidad=" + cantidad);

        Cliente cliente = em.find(Cliente.class, clienteId);
        if (cliente == null) {
            throw new EJBException("Cliente no encontrado: " + clienteId);
        }

        Producto producto = catalogoService.buscarPorId(productoId);
        if (producto == null) {
            throw new EJBException("Producto no encontrado: " + productoId);
        }
        if (producto.getStock() < cantidad) {
            throw new EJBException("Stock insuficiente para el producto: " + productoId
                + ". Disponible=" + producto.getStock() + ", solicitado=" + cantidad);
        }

        // Crear el pedido y sus líneas usando JPA
        Pedido pedido = new Pedido(cliente);
        LineaPedido linea = new LineaPedido(pedido, producto, cantidad);
        pedido.getLineas().add(linea);
        em.persist(pedido);

        // Actualizar el stock del producto dentro de la misma transacción JTA
        producto.setStock(producto.getStock() - cantidad);

        // Guardar en la caché local (reemplaza DistributedMap WAS)
        ultimoPedidoPorCliente.put(clienteId, pedido.getId());

        // Enviar notificación asíncrona JMS (fuera de la transacción principal)
        notificacionService.notificarPedidoCreado(pedido.getId(), clienteId);

        LOGGER.info("Pedido creado con ID=" + pedido.getId());
        return pedido;
    }

    /**
     * Obtiene la lista de pedidos de un cliente ordenados por fecha descendente.
     *
     * @param clienteId Identificador del cliente
     * @return Lista de pedidos del cliente
     */
    @TransactionAttribute(TransactionAttributeType.SUPPORTS)
    public List<Pedido> obtenerPedidosCliente(Long clienteId) {
        return em.createNamedQuery("Pedido.findByCliente", Pedido.class)
                 .setParameter("clienteId", clienteId)
                 .getResultList();
    }

    /**
     * Actualiza el estado de un pedido existente.
     *
     * @param pedidoId    Identificador del pedido
     * @param nuevoEstado Nuevo estado
     */
    @TransactionAttribute(TransactionAttributeType.REQUIRED)
    public void actualizarEstadoPedido(Long pedidoId, Pedido.Estado nuevoEstado) {
        Pedido pedido = em.find(Pedido.class, pedidoId);
        if (pedido == null) {
            throw new EJBException("Pedido no encontrado: " + pedidoId);
        }
        pedido.setEstado(nuevoEstado);
        LOGGER.info("Pedido " + pedidoId + " actualizado a estado=" + nuevoEstado);
    }
}
