package com.pedjas.web;

import com.pedjas.entity.Cliente;
import com.pedjas.service.ClienteService;

import jakarta.ejb.EJB;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import java.util.logging.Logger;

/**
 * Servlet de inicio de sesión — versión Liberty modernizada.
 *
 * Cambios respecto a la versión tWAS (InicioServlet):
 *
 *   ELIMINADO — InitialContext.lookup("jdbc/pedjasappDS") (RULE-0003)
 *     → Sustituido por @EJB ClienteService que usa JPA internamente
 *
 *   ELIMINADO — JDBC directo para autenticación
 *     → Delegado en ClienteService / EntityManager JPA
 *
 *   NAMESPACE: javax.* → jakarta.*
 */
@WebServlet(urlPatterns = {"/inicio", "/"})
public class InicioServlet extends HttpServlet {

    private static final Logger LOGGER =
        Logger.getLogger(InicioServlet.class.getName());

    @EJB
    private ClienteService clienteService;

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        String accion = req.getParameter("accion");
        if ("logout".equalsIgnoreCase(accion)) {
            HttpSession session = req.getSession(false);
            if (session != null) {
                session.invalidate();
            }
            req.getRequestDispatcher("/views/inicio.jsp").forward(req, resp);
            return;
        }

        HttpSession session = req.getSession(false);
        if (session != null && session.getAttribute("clienteId") != null) {
            resp.sendRedirect(req.getContextPath() + "/catalogo");
            return;
        }
        req.getRequestDispatcher("/views/inicio.jsp").forward(req, resp);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        String usuario    = req.getParameter("usuario");
        String contrasena = req.getParameter("contrasena");

        if (usuario == null || contrasena == null
                || usuario.trim().isEmpty() || contrasena.trim().isEmpty()) {
            req.setAttribute("error", "Introduce usuario y contraseña");
            req.getRequestDispatcher("/views/inicio.jsp").forward(req, resp);
            return;
        }

        // Autenticación vía EJB + JPA — sin JDBC directo ni APIs WAS
        Cliente cliente = clienteService.autenticar(usuario.trim(), contrasena);

        if (cliente != null) {
            HttpSession session = req.getSession(true);
            session.setAttribute("clienteId", cliente.getId());
            session.setAttribute("usuario",   cliente.getUsuario());
            session.setAttribute("nombre",    cliente.getNombre());
            resp.sendRedirect(req.getContextPath() + "/catalogo");
        } else {
            req.setAttribute("error", "Usuario o contraseña incorrectos");
            req.getRequestDispatcher("/views/inicio.jsp").forward(req, resp);
        }
    }
}
