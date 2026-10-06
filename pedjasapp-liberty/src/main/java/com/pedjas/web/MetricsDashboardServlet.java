package com.pedjas.web;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;

/**
 * Sirve la página del Dashboard de Métricas MicroProfile.
 * Los datos se obtienen en el cliente vía fetch("/metrics") para evitar
 * problemas de CORS — el browser está en el mismo origen que la app.
 */
@WebServlet("/metrics-dashboard")
public class MetricsDashboardServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        HttpSession session = req.getSession(false);
        if (session == null || session.getAttribute("clienteId") == null) {
            resp.sendRedirect(req.getContextPath() + "/inicio");
            return;
        }
        req.getRequestDispatcher("/views/metrics-dashboard.jsp").forward(req, resp);
    }
}
