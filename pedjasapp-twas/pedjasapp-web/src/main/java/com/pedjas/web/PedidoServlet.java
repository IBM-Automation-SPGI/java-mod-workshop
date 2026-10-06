package com.pedjas.web;

import com.pedjas.ejb.NotificacionLocal;
import com.pedjas.ejb.PedidoServiceLocal;

import javax.ejb.EJB;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.io.IOException;
import java.util.List;
import java.util.logging.Logger;

/**
 * Servlet para gestión de pedidos.
 * Permite crear nuevos pedidos y consultar el histórico del cliente.
 *
 * Este servlet inyecta los EJBs usando la anotación @EJB estándar (EJB 3.x),
 * por lo que este mecanismo es compatible con Liberty sin modificaciones.
 * Sin embargo, los EJBs inyectados (PedidoServiceBean, NotificacionBean)
 * contienen código que AMA marcará como problemático.
 */
@WebServlet(urlPatterns = {"/pedidos/*"})
public class PedidoServlet extends HttpServlet {

    private static final Logger LOGGER =
        Logger.getLogger(PedidoServlet.class.getName());

    // Inyección EJB 3.x — este mecanismo SÍ es portable entre tWAS y Liberty
    @EJB(name = "ejb/PedidoServiceEJB",
         beanInterface = PedidoServiceLocal.class)
    private PedidoServiceLocal pedidoService;

    @EJB(name = "ejb/NotificacionEJB",
         beanInterface = NotificacionLocal.class)
    private NotificacionLocal notificacionService;

    /**
     * GET /pedidos/lista — muestra el histórico de pedidos del cliente autenticado.
     */
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        HttpSession session = req.getSession(false);
        if (session == null || session.getAttribute("clienteId") == null) {
            resp.sendRedirect(req.getContextPath() + "/");
            return;
        }

        Long clienteId = (Long) session.getAttribute("clienteId");
        List<Long> pedidosIds = pedidoService.obtenerPedidosCliente(clienteId);

        req.setAttribute("pedidosIds", pedidosIds);
        req.getRequestDispatcher("/views/pedidos.jsp").forward(req, resp);
    }

    /**
     * POST /pedidos/nuevo — crea un nuevo pedido.
     */
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        HttpSession session = req.getSession(false);
        if (session == null || session.getAttribute("clienteId") == null) {
            resp.sendRedirect(req.getContextPath() + "/");
            return;
        }

        Long   clienteId  = (Long) session.getAttribute("clienteId");
        String productoIdStr = req.getParameter("productoId");
        String cantidadStr   = req.getParameter("cantidad");

        if (productoIdStr == null || cantidadStr == null) {
            resp.sendRedirect(req.getContextPath() + "/catalogo?error=parametros");
            return;
        }

        try {
            Long productoId = Long.parseLong(productoIdStr);
            int  cantidad   = Integer.parseInt(cantidadStr);

            Long pedidoId = pedidoService.crearPedido(clienteId, productoId, cantidad);

            // Enviar notificación asíncrona por JMS
            notificacionService.notificarPedidoCreado(pedidoId, clienteId);

            LOGGER.info("Pedido " + pedidoId + " creado por cliente " + clienteId);
            resp.sendRedirect(req.getContextPath() + "/pedidos/lista?exito=" + pedidoId);

        } catch (NumberFormatException e) {
            resp.sendRedirect(req.getContextPath() + "/catalogo?error=formato");
        } catch (Exception e) {
            LOGGER.severe("Error creando pedido: " + e.getMessage());
            req.setAttribute("error", "Error al procesar el pedido: " + e.getMessage());
            req.getRequestDispatcher("/views/catalogo.jsp").forward(req, resp);
        }
    }
}
