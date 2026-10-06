package com.pedjas.ejb;

import com.ibm.websphere.naming.JndiHelper;
import com.ibm.websphere.cache.DistributedMap;

import javax.annotation.Resource;
import javax.ejb.EJBException;
import javax.ejb.SessionContext;
import javax.ejb.Stateless;
import javax.ejb.TransactionAttribute;
import javax.ejb.TransactionAttributeType;
import javax.naming.Context;
import javax.naming.InitialContext;
import javax.naming.NamingException;
import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.List;
import java.util.logging.Logger;

/**
 * EJB 3.x Stateless Session Bean para la gestión de pedidos.
 *
 * NOTA AMA — RULE-0001: Este bean usa APIs propietarias de WebSphere:
 *   - com.ibm.websphere.naming.JndiHelper  (lookup WAS-específico)
 *   - com.ibm.websphere.cache.DistributedMap (caché distribuida WAS)
 *
 * NOTA AMA — RULE-0003: El lookup JNDI del DataSource usa el namespace
 *   propietario de WAS sin prefijo estándar java:comp/env.
 *
 * Ambos problemas se resuelven en la versión Liberty:
 *   - JndiHelper → javax.naming.InitialContext estándar
 *   - DistributedMap → ConcurrentHashMap o JCache estándar
 *   - JNDI lookup → inyección @Resource
 */
@Stateless
public class PedidoServiceBean implements PedidoServiceLocal {

    private static final Logger LOGGER =
        Logger.getLogger(PedidoServiceBean.class.getName());

    // La caché distribuida de WAS se usa para almacenar el último pedido
    // de cada cliente. NO disponible en Liberty.
    // NOTA AMA — RULE-0001
    private DistributedMap cachePedidos;

    @Resource
    private SessionContext sessionContext;

    /**
     * Inicializa la caché distribuida de WebSphere.
     * NOTA AMA — RULE-0001: JndiHelper.lookup() es una API WAS-específica.
     */
    private DistributedMap getCachePedidos() {
        if (cachePedidos == null) {
            try {
                // NOTA AMA — RULE-0001: JndiHelper no existe en Liberty
                cachePedidos = (DistributedMap)
                    JndiHelper.lookup("services/cache/pedidos");
            } catch (NamingException e) {
                LOGGER.warning("No se pudo inicializar la caché distribuida WAS: "
                    + e.getMessage());
            }
        }
        return cachePedidos;
    }

    /**
     * Obtiene la conexión JDBC a través del DataSource WAS.
     * NOTA AMA — RULE-0003: El nombre JNDI "jdbc/pedjasappDS" se resuelve
     * en el namespace propietario de WebSphere.
     */
    private DataSource getDataSource() throws NamingException {
        Context ctx = new InitialContext();
        // NOTA AMA — RULE-0003: En tWAS el namespace real es cell/persistent/jdbc/...
        // En Liberty se usaría @Resource(name="jdbc/pedjasappDS") en su lugar.
        return (DataSource) ctx.lookup("jdbc/pedjasappDS");
    }

    /**
     * Crea un nuevo pedido para el cliente dado.
     *
     * @param clienteId  Identificador del cliente
     * @param productoId Identificador del producto
     * @param cantidad   Cantidad solicitada
     * @return El identificador del pedido creado
     */
    @Override
    @TransactionAttribute(TransactionAttributeType.REQUIRED)
    public Long crearPedido(Long clienteId, Long productoId, int cantidad) {
        LOGGER.info("Creando pedido para cliente=" + clienteId
            + ", producto=" + productoId + ", cantidad=" + cantidad);

        try {
            DataSource ds = getDataSource();
            try (Connection conn = ds.getConnection()) {
                // Obtener el Home Interface del ProductoBean EJB 2.x
                // NOTA AMA — RULE-0006: Uso del Home Interface — patrón obsoleto EJB 2.x
                Context ctx = new InitialContext();
                ProductoLocalHome productoHome = (ProductoLocalHome)
                    ctx.lookup("java:comp/env/ejb/ProductoEJB");
                ProductoLocal producto = productoHome.findByPrimaryKey(productoId);

                if (producto.getStock() < cantidad) {
                    throw new EJBException("Stock insuficiente para el producto: " + productoId);
                }

                // Insertar el pedido en la base de datos
                Long pedidoId = insertarPedido(conn, clienteId, productoId, cantidad,
                    producto.getPrecio());

                // Actualizar el stock del producto
                producto.setStock(producto.getStock() - cantidad);

                // Guardar el último pedido en la caché distribuida WAS
                // NOTA AMA — RULE-0001
                DistributedMap cache = getCachePedidos();
                if (cache != null) {
                    cache.put("ultimo-pedido-cliente-" + clienteId, pedidoId);
                }

                LOGGER.info("Pedido creado con ID=" + pedidoId);
                return pedidoId;
            }
        } catch (NamingException | SQLException | javax.ejb.FinderException e) {
            LOGGER.severe("Error al crear pedido: " + e.getMessage());
            throw new EJBException("Error interno al crear el pedido", e);
        }
    }

    /**
     * Consulta todos los pedidos de un cliente.
     *
     * @param clienteId Identificador del cliente
     * @return Lista de identificadores de pedidos del cliente
     */
    @Override
    @TransactionAttribute(TransactionAttributeType.SUPPORTS)
    public List<Long> obtenerPedidosCliente(Long clienteId) {
        List<Long> pedidos = new ArrayList<>();
        try {
            DataSource ds = getDataSource();
            try (Connection conn = ds.getConnection();
                 PreparedStatement ps = conn.prepareStatement(
                     "SELECT ID FROM PEDIDOS WHERE CLIENTE_ID = ? ORDER BY FECHA_CREACION DESC")) {
                ps.setLong(1, clienteId);
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        pedidos.add(rs.getLong("ID"));
                    }
                }
            }
        } catch (NamingException | SQLException e) {
            LOGGER.severe("Error consultando pedidos: " + e.getMessage());
            throw new EJBException("Error interno al consultar pedidos", e);
        }
        return pedidos;
    }

    /**
     * Actualiza el estado de un pedido.
     *
     * @param pedidoId  Identificador del pedido
     * @param nuevoEstado Nuevo estado del pedido (PENDIENTE, PROCESADO, ENVIADO, ENTREGADO)
     */
    @Override
    @TransactionAttribute(TransactionAttributeType.REQUIRED)
    public void actualizarEstadoPedido(Long pedidoId, String nuevoEstado) {
        try {
            DataSource ds = getDataSource();
            try (Connection conn = ds.getConnection();
                 PreparedStatement ps = conn.prepareStatement(
                     "UPDATE PEDIDOS SET ESTADO = ?, FECHA_ACTUALIZACION = ? WHERE ID = ?")) {
                ps.setString(1, nuevoEstado);
                ps.setTimestamp(2, new java.sql.Timestamp(new Date().getTime()));
                ps.setLong(3, pedidoId);
                int filasActualizadas = ps.executeUpdate();
                if (filasActualizadas == 0) {
                    throw new EJBException("No se encontró el pedido con ID=" + pedidoId);
                }
                LOGGER.info("Pedido " + pedidoId + " actualizado a estado=" + nuevoEstado);
            }
        } catch (NamingException | SQLException e) {
            LOGGER.severe("Error actualizando pedido: " + e.getMessage());
            throw new EJBException("Error interno al actualizar el pedido", e);
        }
    }

    // ─── Métodos privados ─────────────────────────────────────────────────────

    private Long insertarPedido(Connection conn, Long clienteId, Long productoId,
                                 int cantidad, Double precioUnitario)
            throws SQLException {
        String sql = "INSERT INTO PEDIDOS (CLIENTE_ID, PRODUCTO_ID, CANTIDAD, "
            + "PRECIO_UNITARIO, ESTADO, FECHA_CREACION) "
            + "VALUES (?, ?, ?, ?, 'PENDIENTE', ?)";

        try (PreparedStatement ps = conn.prepareStatement(sql,
                new String[]{"ID"})) {
            ps.setLong(1, clienteId);
            ps.setLong(2, productoId);
            ps.setInt(3, cantidad);
            ps.setDouble(4, precioUnitario);
            ps.setTimestamp(5, new java.sql.Timestamp(new Date().getTime()));
            ps.executeUpdate();
            try (ResultSet generatedKeys = ps.getGeneratedKeys()) {
                if (generatedKeys.next()) {
                    return generatedKeys.getLong(1);
                }
                throw new SQLException("No se pudo obtener la clave generada para el pedido");
            }
        }
    }
}
