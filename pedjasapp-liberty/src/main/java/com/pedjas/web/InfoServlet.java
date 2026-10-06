package com.pedjas.web;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;

/**
 * InfoServlet — expone información de runtime de la aplicación modernizada.
 *
 * Accesible en: /info (requiere sesión activa)
 *
 * Datos expuestos:
 *   - Versión de Java / JVM vendor
 *   - Sistema operativo
 *   - Propiedades del servidor Liberty (cuando disponibles)
 *   - Links a endpoints MicroProfile: /health, /metrics, /openapi/ui
 */
@WebServlet("/info")
public class InfoServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        HttpSession session = req.getSession(false);
        if (session == null || session.getAttribute("clienteId") == null) {
            resp.sendRedirect(req.getContextPath() + "/");
            return;
        }

        // ── JVM ───────────────────────────────────────────────────────────────
        req.setAttribute("javaVersion",  System.getProperty("java.version",       "—"));
        req.setAttribute("javaVendor",   System.getProperty("java.vendor",        "—"));
        req.setAttribute("jvmName",      System.getProperty("java.vm.name",       "—"));
        req.setAttribute("jvmVersion",   System.getProperty("java.vm.version",    "—"));

        // ── OS ────────────────────────────────────────────────────────────────
        req.setAttribute("osName",       System.getProperty("os.name",            "—"));
        req.setAttribute("osArch",       System.getProperty("os.arch",            "—"));
        req.setAttribute("osVersion",    System.getProperty("os.version",         "—"));

        // ── Liberty server ────────────────────────────────────────────────────
        req.setAttribute("libertyVersion",    System.getProperty("wlp.server.name",   "defaultServer"));
        req.setAttribute("wlpInstallDir",     System.getProperty("wlp.install.dir",   "—"));
        req.setAttribute("serverOutputDir",   System.getProperty("server.output.dir", "—"));

        // ── Memory ────────────────────────────────────────────────────────────
        Runtime rt = Runtime.getRuntime();
        long usedMb  = (rt.totalMemory() - rt.freeMemory()) / (1024 * 1024);
        long totalMb = rt.totalMemory() / (1024 * 1024);
        long maxMb   = rt.maxMemory()   / (1024 * 1024);
        req.setAttribute("memUsedMb",  usedMb);
        req.setAttribute("memTotalMb", totalMb);
        req.setAttribute("memMaxMb",   maxMb);

        req.getRequestDispatcher("/views/versioninfo.jsp").forward(req, resp);
    }
}
