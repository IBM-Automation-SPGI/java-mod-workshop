package com.pedjas.ejb;

/**
 * Local Business Interface del EJB NotificacionBean.
 */
public interface NotificacionLocal {

    /**
     * Envía una notificación asíncrona por JMS al crear un pedido.
     *
     * @param pedidoId  Identificador del pedido
     * @param clienteId Identificador del cliente
     */
    void notificarPedidoCreado(Long pedidoId, Long clienteId);
}
