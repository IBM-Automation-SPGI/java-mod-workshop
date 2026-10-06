package com.pedjas.web;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import javax.sql.DataSource;
import javax.naming.Context;
import javax.naming.InitialContext;
import javax.naming.NamingException;
import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.logging.Logger;

/**
 * Servlet de inicio de sesión y página principal de PedjasApp.
 *
 * NOTA AMA — RULE-0003: El lookup JNDI del DataSource usa el nombre
 * propietario de WAS "jdbc/pedjasappDS" sin el prefijo java:comp/env,
 * ya que en tWAS el contenedor resuelve el nombre directamente en el
 * namespace global del servidor.
 */
@WebServlet("/inicio")
public class InicioServlet extends HttpServlet {

    private static final Logger LOGGER =
        Logger.getLogger(InicioServlet.class.getName());

    /**
     * GET /inicio — muestra la página principal o redirige al catálogo si ya hay sesión.
     */
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        String accion = req.getParameter("accion");
        if ("logout".equalsIgnoreCase(accion)) {
            HttpSession session = req.getSession(false);
            if (session != null) {
                session.invalidate();
            }
            resp.sendRedirect(req.getContextPath() + "/inicio");
            return;
        }

        HttpSession session = req.getSession(false);
        if (session != null && session.getAttribute("clienteId") != null) {
            resp.sendRedirect(req.getContextPath() + "/catalogo");
            return;
        }
        req.getRequestDispatcher("/views/inicio.jsp").forward(req, resp);
    }

    /**
     * POST /inicio — procesa las credenciales y abre sesión si son válidas.
     */
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        String usuario    = req.getParameter("usuario");
        String contrasena = req.getParameter("contrasena");

        if (usuario == null || contrasena == null) {
            req.setAttribute("error", "Introduce usuario y contraseña");
            req.getRequestDispatcher("/views/inicio.jsp").forward(req, resp);
            return;
        }

        try {
            // NOTA AMA — RULE-0003: Lookup JNDI directo sin java:comp/env
            // En tWAS el contenedor resuelve "jdbc/pedjasappDS" en el namespace global.
            // En Liberty se usaría @Resource o el nombre java:comp/env/jdbc/pedjasappDS.
            Context ctx = new InitialContext();
            DataSource ds = (DataSource) ctx.lookup("jdbc/pedjasappDS");

            Long clienteId = autenticarUsuario(ds, usuario, contrasena);

            if (clienteId != null) {
                HttpSession session = req.getSession(true);
                session.setAttribute("clienteId", clienteId);
                session.setAttribute("usuario", usuario);
                resp.sendRedirect(req.getContextPath() + "/catalogo");
            } else {
                req.setAttribute("error", "Usuario o contraseña incorrectos");
                req.getRequestDispatcher("/views/inicio.jsp").forward(req, resp);
            }

        } catch (NamingException e) {
            LOGGER.severe("Error de JNDI al autenticar: " + e.getMessage());
            throw new ServletException("Error de configuración del servidor", e);
        }
    }

    /**
     * Verifica las credenciales del usuario contra la base de datos.
     * En producción, la contraseña estaría hasheada con bcrypt o similar.
     */
    private Long autenticarUsuario(DataSource ds, String usuario, String contrasena) {
        String sql = "SELECT ID FROM CLIENTES WHERE USUARIO = ? AND CONTRASENA = ?";
        try (Connection conn = ds.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, usuario);
            ps.setString(2, contrasena);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return rs.getLong("ID");
                }
            }
        } catch (SQLException e) {
            LOGGER.severe("Error consultando cliente: " + e.getMessage());
        }
        return null;
    }
}
