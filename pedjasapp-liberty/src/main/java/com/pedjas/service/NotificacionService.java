package com.pedjas.service;

import jakarta.annotation.Resource;
import jakarta.ejb.Stateless;
import jakarta.ejb.TransactionAttribute;
import jakarta.ejb.TransactionAttributeType;
import jakarta.jms.JMSConnectionFactory;
import jakarta.jms.JMSContext;
import jakarta.jms.JMSException;
import jakarta.jms.Queue;
import jakarta.jms.TextMessage;
import jakarta.inject.Inject;
import java.util.logging.Logger;

/**
 * Servicio de notificaciones mediante JMS 3.0.
 *
 * Cambios respecto a la versión tWAS (NotificacionBean):
 *
 *   ELIMINADO — QueueConnectionFactory / QueueSession / QueueSender (JMS 1.1) (RULE-0005)
 *     → Sustituido por JMSContext (API JMS 2.0/3.0 simplificada)
 *
 *   ELIMINADO — InitialContext.lookup("jms/PedjasQCF") (RULE-0003)
 *     → Sustituido por @Inject @JMSConnectionFactory (inyección estándar)
 *
 *   ELIMINADO — InitialContext.lookup("jms/PedjasNotificacionesQ") (RULE-0003)
 *     → Sustituido por @Resource (inyección estándar)
 *
 *   Los recursos jms/PedjasQCF y jms/PedjasNotificacionesQ están definidos en server.xml.
 *
 *   NAMESPACE: javax.jms.* → jakarta.jms.*
 */
@Stateless
public class NotificacionService {

    private static final Logger LOGGER =
        Logger.getLogger(NotificacionService.class.getName());

    /**
     * Liberty inyecta el JMSContext usando la ConnectionFactory declarada en server.xml
     * con jndiName="jms/PedjasQCF".
     * La API JMSContext es la forma simplificada de JMS 2.0/3.0: no requiere crear
     * Connection ni Session de forma explícita.
     */
    @Inject
    @JMSConnectionFactory("jms/PedjasQCF")
    private JMSContext jmsContext;

    /**
     * La cola de notificaciones declarada en server.xml como
     * wasJmsQueue jndiName="jms/PedjasNotificacionesQ".
     */
    @Resource(name = "jms/PedjasNotificacionesQ")
    private Queue colaNotificaciones;

    /**
     * Envía una notificación asíncrona cuando se crea un pedido.
     *
     * La transacción JTA del método crearPedido (PedidoService) garantiza que el
     * mensaje JMS solo se entrega si la transacción del pedido se confirma correctamente
     * (transacciones distribuidas XA entre JDBC y JMS).
     *
     * @param pedidoId  Identificador del pedido recién creado
     * @param clienteId Identificador del cliente que realizó el pedido
     */
    @TransactionAttribute(TransactionAttributeType.REQUIRES_NEW)
    public void notificarPedidoCreado(Long pedidoId, Long clienteId) {
        try {
            String cuerpoMensaje = construirMensajeJSON(pedidoId, clienteId);
            TextMessage mensaje = jmsContext.createTextMessage(cuerpoMensaje);
            mensaje.setStringProperty("tipo", "PEDIDO_CREADO");
            jmsContext.createProducer().send(colaNotificaciones, mensaje);
            LOGGER.info("Notificación JMS enviada — pedidoId=" + pedidoId);
        } catch (JMSException e) {
            // El error de JMS no debe revertir la transacción del pedido
            LOGGER.warning("No se pudo enviar la notificación JMS para pedido="
                + pedidoId + ": " + e.getMessage());
        }
    }

    private String construirMensajeJSON(Long pedidoId, Long clienteId) {
        return String.format(
            "{\"tipo\":\"PEDIDO_CREADO\",\"pedidoId\":%d,\"clienteId\":%d,\"timestamp\":%d}",
            pedidoId, clienteId, System.currentTimeMillis()
        );
    }
}
