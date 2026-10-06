package com.pedjas.web;

import com.pedjas.ejb.ProductoLocal;
import com.pedjas.ejb.ProductoLocalHome;

import com.ibm.websphere.naming.JndiHelper;

import javax.naming.Context;
import javax.naming.InitialContext;
import javax.naming.NamingException;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.logging.Logger;

/**
 * Servlet de catálogo de productos.
 *
 * NOTA AMA — RULE-0001: Usa com.ibm.websphere.naming.JndiHelper para obtener
 * el Home Interface del ProductoBean. Esta clase no existe en Liberty.
 *
 * NOTA AMA — RULE-0003: El lookup JNDI usa nombres propietarios de WAS.
 *
 * NOTA AMA — RULE-0006: Usa el patrón EJB Home Interface de EJB 2.x.
 */
@WebServlet("/catalogo")
public class CatalogoServlet extends HttpServlet {

    private static final Logger LOGGER =
        Logger.getLogger(CatalogoServlet.class.getName());

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        HttpSession session = req.getSession(false);
        if (session == null || session.getAttribute("clienteId") == null) {
            resp.sendRedirect(req.getContextPath() + "/");
            return;
        }

        String categoriaFiltro = req.getParameter("categoria");
        List<ProductoDto> productos = new ArrayList<>();

        try {
            // NOTA AMA — RULE-0001: JndiHelper.getEJBLocalHome() no existe en Liberty
            ProductoLocalHome productoHome =
                (ProductoLocalHome) JndiHelper.getEJBLocalHome(
                    "java:comp/env/ejb/ProductoCatalogoHome");

            Collection<ProductoLocal> resultados;
            if (categoriaFiltro != null && !categoriaFiltro.isEmpty()) {
                resultados = productoHome.findByCategoria(categoriaFiltro);
            } else {
                resultados = productoHome.findAll();
            }

            for (ProductoLocal prod : resultados) {
                productos.add(new ProductoDto(
                    prod.getId(),
                    prod.getNombre(),
                    prod.getDescripcion(),
                    prod.getPrecio(),
                    prod.getCategoria(),
                    prod.getStock()
                ));
            }

        } catch (NamingException | javax.ejb.FinderException e) {
            LOGGER.severe("Error consultando el catálogo: " + e.getMessage());
            throw new ServletException("Error al cargar el catálogo de productos", e);
        }

        req.setAttribute("productos", productos);
        req.setAttribute("categoriaSeleccionada", categoriaFiltro);
        req.getRequestDispatcher("/views/catalogo.jsp").forward(req, resp);
    }

    // ─── DTO interno para pasar datos a la vista ──────────────────────────────

    public static class ProductoDto {
        public final Long    id;
        public final String  nombre;
        public final String  descripcion;
        public final Double  precio;
        public final String  categoria;
        public final Integer stock;

        public ProductoDto(Long id, String nombre, String descripcion,
                           Double precio, String categoria, Integer stock) {
            this.id          = id;
            this.nombre      = nombre;
            this.descripcion = descripcion;
            this.precio      = precio;
            this.categoria   = categoria;
            this.stock       = stock;
        }
    }
}
