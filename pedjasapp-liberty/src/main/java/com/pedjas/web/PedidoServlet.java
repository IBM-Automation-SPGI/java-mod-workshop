package com.pedjas.web;

import com.pedjas.entity.Cliente;
import com.pedjas.entity.Pedido;
import com.pedjas.service.PedidoService;

import jakarta.ejb.EJB;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import java.util.List;
import java.util.logging.Logger;

/**
 * Servlet de gestión de pedidos — versión Liberty modernizada.
 * Compatible con WebSphere Liberty 24.x.
 * NAMESPACE: javax.* → jakarta.*
 */
@WebServlet(urlPatterns = {"/pedidos/*"})
public class PedidoServlet extends HttpServlet {

    private static final Logger LOGGER =
        Logger.getLogger(PedidoServlet.class.getName());

    @EJB
    private PedidoService pedidoService;

    /**
     * GET /pedidos/lista — historial de pedidos del cliente en sesión.
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
        List<Pedido> pedidos = pedidoService.obtenerPedidosCliente(clienteId);

        req.setAttribute("pedidos", pedidos);
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

        Long   clienteId     = (Long) session.getAttribute("clienteId");
        String productoIdStr = req.getParameter("productoId");
        String cantidadStr   = req.getParameter("cantidad");

        if (productoIdStr == null || cantidadStr == null) {
            resp.sendRedirect(req.getContextPath() + "/catalogo?error=parametros");
            return;
        }

        try {
            Long productoId = Long.parseLong(productoIdStr);
            int  cantidad   = Integer.parseInt(cantidadStr);

            Pedido pedido = pedidoService.crearPedido(clienteId, productoId, cantidad);
            resp.sendRedirect(req.getContextPath()
                + "/pedidos/lista?exito=" + pedido.getId());

        } catch (NumberFormatException e) {
            resp.sendRedirect(req.getContextPath() + "/catalogo?error=formato");
        } catch (Exception e) {
            LOGGER.severe("Error creando pedido: " + e.getMessage());
            req.setAttribute("error", "Error al procesar el pedido: " + e.getMessage());
            req.getRequestDispatcher("/views/catalogo.jsp").forward(req, resp);
        }
    }
}
