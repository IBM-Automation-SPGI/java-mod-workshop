package com.pedjas.ejb;

import javax.annotation.PostConstruct;
import javax.ejb.Stateless;
import javax.ejb.TransactionAttribute;
import javax.ejb.TransactionAttributeType;
import javax.jms.Connection;
import javax.jms.ConnectionFactory;
import javax.jms.JMSException;
import javax.jms.MessageProducer;
import javax.jms.Queue;
import javax.jms.QueueConnection;
import javax.jms.QueueConnectionFactory;
import javax.jms.QueueSender;
import javax.jms.QueueSession;
import javax.jms.Session;
import javax.jms.TextMessage;
import javax.naming.Context;
import javax.naming.InitialContext;
import javax.naming.NamingException;
import java.util.logging.Logger;

/**
 * EJB 3.x Stateless Session Bean para el envío de notificaciones por JMS.
 *
 * NOTA AMA — RULE-0003: El lookup JNDI de la QueueConnectionFactory y la Queue
 * usa nombres de binding propietarios de WebSphere configurados en ibm-ejb-jar-bnd.xml.
 *
 * NOTA AMA — RULE-0005: El uso de QueueConnectionFactory / QueueSession / QueueSender
 * es la API JMS 1.1 antigua. En Liberty se recomienda JMSContext (JMS 2.0).
 *
 * En la versión Liberty estos recursos se declaran en server.xml y se inyectan
 * con @JMSConnectionFactory y @Resource.
 */
@Stateless
public class NotificacionBean implements NotificacionLocal {

    private static final Logger LOGGER =
        Logger.getLogger(NotificacionBean.class.getName());

    // Nombres JNDI — binding de WAS definido en ibm-ejb-jar-bnd.xml
    // NOTA AMA — RULE-0003
    private static final String JNDI_QCF   = "java:comp/env/jms/PedjasQCF";
    private static final String JNDI_QUEUE = "java:comp/env/jms/PedjasNotificacionesQ";

    /**
     * Envía una notificación JMS cuando se crea un pedido.
     *
     * Utiliza la API JMS 1.1 con QueueSender/QueueSession, compatible con
     * los recursos JMS configurados en WebSphere Application Server tradicional.
     *
     * @param pedidoId  Identificador del pedido recién creado
     * @param clienteId Identificador del cliente que realizó el pedido
     */
    @Override
    @TransactionAttribute(TransactionAttributeType.REQUIRED)
    public void notificarPedidoCreado(Long pedidoId, Long clienteId) {
        QueueConnection queueConnection = null;
        QueueSession    queueSession    = null;

        try {
            Context ctx = new InitialContext();

            // NOTA AMA — RULE-0003: Lookup JMS de recursos WAS
            QueueConnectionFactory qcf =
                (QueueConnectionFactory) ctx.lookup(JNDI_QCF);
            Queue cola = (Queue) ctx.lookup(JNDI_QUEUE);

            // Establecer conexión JMS 1.1
            // NOTA AMA — RULE-0005: API JMS 1.1 antigua — sustituir por JMSContext en Liberty
            queueConnection = qcf.createQueueConnection();
            queueSession    = queueConnection.createQueueSession(
                false, Session.AUTO_ACKNOWLEDGE);
            QueueSender sender = queueSession.createSender(cola);

            // Construir el mensaje de notificación
            TextMessage mensaje = queueSession.createTextMessage();
            mensaje.setText(construirMensajeJSON(pedidoId, clienteId));
            mensaje.setStringProperty("tipo", "PEDIDO_CREADO");

            // Enviar el mensaje
            sender.send(mensaje);
            LOGGER.info("Notificación JMS enviada para pedido=" + pedidoId);

        } catch (NamingException | JMSException e) {
            LOGGER.severe("Error enviando notificación JMS: " + e.getMessage());
            // No relanzamos la excepción para no revertir la transacción del pedido
        } finally {
            // Cerrar la sesión y la conexión JMS en orden correcto
            if (queueSession != null) {
                try { queueSession.close(); } catch (JMSException ignored) {}
            }
            if (queueConnection != null) {
                try { queueConnection.close(); } catch (JMSException ignored) {}
            }
        }
    }

    /**
     * Genera el contenido JSON del mensaje de notificación.
     */
    private String construirMensajeJSON(Long pedidoId, Long clienteId) {
        return String.format(
            "{\"tipo\":\"PEDIDO_CREADO\",\"pedidoId\":%d,\"clienteId\":%d,\"timestamp\":%d}",
            pedidoId, clienteId, System.currentTimeMillis()
        );
    }
}
