package com.pedjas.web;

import com.pedjas.entity.Producto;
import com.pedjas.service.CatalogoService;

import jakarta.ejb.EJB;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import java.util.logging.Logger;

/**
 * Servlet del catálogo de productos — versión Liberty modernizada.
 *
 * Cambios respecto a la versión tWAS (CatalogoServlet):
 *
 *   ELIMINADO — JndiHelper.getEJBLocalHome() (RULE-0001)
 *     → Sustituido por @EJB inyección directa del CatalogoService
 *
 *   ELIMINADO — ProductoLocalHome / ProductoLocal (EJB 2.x) (RULE-0006)
 *     → Sustituido por CatalogoService (EJB 3.x) que usa JPA
 *
 *   NAMESPACE: javax.servlet.* → jakarta.servlet.*
 */
@WebServlet("/catalogo")
public class CatalogoServlet extends HttpServlet {

    private static final Logger LOGGER =
        Logger.getLogger(CatalogoServlet.class.getName());

    /**
     * Inyección directa del EJB — sin InitialContext ni Home Interface.
     * Liberty gestiona la inyección automáticamente.
     */
    @EJB
    private CatalogoService catalogoService;

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        String categoriaFiltro = req.getParameter("categoria");

        List<Producto> productos;
        if (categoriaFiltro != null && !categoriaFiltro.trim().isEmpty()) {
            productos = catalogoService.obtenerPorCategoria(categoriaFiltro.trim());
        } else {
            productos = catalogoService.obtenerTodos();
        }

        req.setAttribute("productos",            productos);
        req.setAttribute("categoriaSeleccionada", categoriaFiltro);
        req.getRequestDispatcher("/views/catalogo.jsp").forward(req, resp);
    }
}
