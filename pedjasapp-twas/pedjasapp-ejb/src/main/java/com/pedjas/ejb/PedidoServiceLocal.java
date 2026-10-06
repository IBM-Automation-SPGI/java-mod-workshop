package com.pedjas.ejb;

import java.util.List;

/**
 * Local Business Interface del EJB PedidoServiceBean.
 * Accesible únicamente desde la misma JVM (módulos del mismo EAR).
 */
public interface PedidoServiceLocal {

    /**
     * Crea un nuevo pedido.
     *
     * @param clienteId  Identificador del cliente
     * @param productoId Identificador del producto
     * @param cantidad   Cantidad solicitada
     * @return Identificador del pedido creado
     */
    Long crearPedido(Long clienteId, Long productoId, int cantidad);

    /**
     * Obtiene la lista de identificadores de pedidos de un cliente.
     *
     * @param clienteId Identificador del cliente
     * @return Lista de IDs de pedidos
     */
    List<Long> obtenerPedidosCliente(Long clienteId);

    /**
     * Actualiza el estado de un pedido existente.
     *
     * @param pedidoId    Identificador del pedido
     * @param nuevoEstado Nuevo estado (PENDIENTE, PROCESADO, ENVIADO, ENTREGADO)
     */
    void actualizarEstadoPedido(Long pedidoId, String nuevoEstado);
}
