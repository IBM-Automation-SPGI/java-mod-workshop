<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PedjasApp Liberty — Información del Sistema</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #0f62fe;
            --bg: #f4f7fb;
            --card-bg: #ffffff;
            --text-main: #161616;
            --text-muted: #525252;
            --border: #e0e0e0;
            --shadow-sm: 0 2px 6px rgba(0,0,0,0.05);
            --shadow-md: 0 4px 16px rgba(0,0,0,0.08);
        }
        * { box-sizing: border-box; }
        body {
            font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: var(--bg);
            margin: 0;
            color: var(--text-main);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }

        /* ── Header ─────────────────────────────────────────────────────── */
        .header {
            background: linear-gradient(90deg, #161616 0%, #0f62fe 100%);
            color: #fff;
            padding: 1rem 2.5rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.15);
        }
        .header a.brand {
            display: flex; align-items: center; gap: 0.6rem;
            color: #fff; text-decoration: none;
            font-size: 1.35rem; font-weight: 700; letter-spacing: -0.5px;
            transition: opacity 0.2s;
        }
        .header a.brand:hover { opacity: 0.9; }
        .badge {
            background: rgba(36,161,72,0.25); color: #42be65;
            border: 1px solid #24a148; font-size: 0.72rem; font-weight: 600;
            padding: 0.2rem 0.55rem; border-radius: 12px;
            letter-spacing: 0.5px; text-transform: uppercase;
        }
        .nav { display: flex; align-items: center; gap: 1.2rem; }
        .nav a.nav-link {
            color: #fff; text-decoration: none; font-size: 0.92rem;
            padding: 0.45rem 0.9rem; border-radius: 6px;
            background: rgba(255,255,255,0.12); transition: all 0.2s; font-weight: 500;
        }
        .nav a.nav-link:hover { background: rgba(255,255,255,0.22); transform: translateY(-1px); }
        .nav a.nav-link.active { background: rgba(255,255,255,0.25); }
        .nav a.nav-link.logout {
            background: rgba(218,30,40,0.35); border: 1px solid rgba(218,30,40,0.5);
        }
        .nav a.nav-link.logout:hover { background: rgba(218,30,40,0.6); }

        /* ── Layout ──────────────────────────────────────────────────────── */
        .content { max-width: 900px; width: 100%; margin: 2rem auto; padding: 0 1.5rem; flex: 1; }

        .page-header { margin-bottom: 1.8rem; }
        .page-header h2 { margin: 0; font-size: 1.5rem; color: #111827; font-weight: 700; }
        .page-header p  { margin: 0.2rem 0 0; color: var(--text-muted); font-size: 0.9rem; }

        /* ── Info grid ───────────────────────────────────────────────────── */
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1.25rem;
        }
        @media (max-width: 680px) { .info-grid { grid-template-columns: 1fr; } }

        .info-card {
            background: var(--card-bg);
            border-radius: 10px;
            box-shadow: var(--shadow-md);
            border: 1px solid #e5e7eb;
            overflow: hidden;
        }
        .info-card.full-width { grid-column: 1 / -1; }

        .info-card-header {
            background: #f8fafc;
            border-bottom: 2px solid #e2e8f0;
            padding: 0.75rem 1.2rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .info-card-header h3 {
            margin: 0;
            font-size: 0.85rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #475569;
        }

        .info-table { width: 100%; border-collapse: collapse; }
        .info-table td {
            padding: 0.65rem 1.2rem;
            border-bottom: 1px solid #edf2f7;
            font-size: 0.9rem;
            vertical-align: middle;
        }
        .info-table tr:last-child td { border-bottom: none; }
        .info-table .label {
            color: #64748b;
            font-weight: 600;
            width: 45%;
            font-size: 0.85rem;
        }
        .info-table .value {
            color: #0f172a;
            font-family: 'IBM Plex Mono', monospace;
            font-size: 0.85rem;
            word-break: break-all;
        }
        .info-table .value .tag {
            display: inline-block;
            background: #eff6ff;
            color: #1d4ed8;
            border: 1px solid #dbeafe;
            padding: 0.15rem 0.5rem;
            border-radius: 8px;
            font-size: 0.8rem;
            font-weight: 600;
            font-family: 'IBM Plex Sans', sans-serif;
        }
        .info-table .value .tag.green {
            background: #f0fdf4; color: #15803d; border-color: #bbf7d0;
        }
        .info-table .value .tag.purple {
            background: #f5f3ff; color: #6d28d9; border-color: #ddd6fe;
        }

        /* ── Memory bar ──────────────────────────────────────────────────── */
        .mem-bar-wrap {
            background: #e2e8f0;
            border-radius: 6px;
            height: 10px;
            overflow: hidden;
            margin-top: 0.4rem;
            flex: 1;
        }
        .mem-bar-fill {
            height: 100%;
            border-radius: 6px;
            background: linear-gradient(90deg, #0f62fe, #0043ce);
            transition: width 0.4s;
        }
        .mem-row {
            display: flex;
            align-items: center;
            gap: 0.7rem;
        }
        .mem-label { font-size: 0.82rem; color: #64748b; white-space: nowrap; }

        /* ── Endpoints ───────────────────────────────────────────────────── */
        .endpoints-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 0.9rem;
            padding: 1rem 1.2rem;
        }
        .endpoint-btn {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.4rem;
            padding: 1rem;
            background: #f8fafc;
            border: 1.5px solid #e2e8f0;
            border-radius: 8px;
            text-decoration: none;
            transition: all 0.2s;
            color: var(--text-main);
        }
        .endpoint-btn:hover {
            background: #eff6ff;
            border-color: #93c5fd;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(15,98,254,0.12);
        }
        .endpoint-btn .ep-icon { font-size: 1.6rem; }
        .endpoint-btn .ep-name { font-weight: 700; font-size: 0.9rem; color: #0f172a; }
        .endpoint-btn .ep-url {
            font-family: 'IBM Plex Mono', monospace;
            font-size: 0.75rem;
            color: var(--primary);
        }
        .endpoint-btn .ep-desc { font-size: 0.78rem; color: #64748b; text-align: center; }

        .footer {
            text-align: center;
            padding: 1.2rem;
            color: #64748b;
            font-size: 0.82rem;
            border-top: 1px solid #e2e8f0;
            background: #fff;
            margin-top: 2rem;
        }
    </style>
</head>
<body>

<div class="header">
    <a href="${pageContext.request.contextPath}/catalogo" class="brand" title="Volver al Catálogo">
        <span>🛒 PedjasApp</span>
        <span class="badge">Liberty</span>
    </a>
    <nav class="nav">
        <span style="color:#d0e2ff; font-size:0.95rem; font-weight:500;">👤 ${sessionScope.nombre}</span>
        <a href="${pageContext.request.contextPath}/catalogo"  class="nav-link">🏷️ Catálogo</a>
        <a href="${pageContext.request.contextPath}/pedidos/lista" class="nav-link">📦 Pedidos</a>
        <a href="${pageContext.request.contextPath}/info"      class="nav-link active">ℹ️ Info</a>
        <a href="${pageContext.request.contextPath}/inicio?accion=logout" class="nav-link logout">Cerrar Sesión</a>
    </nav>
</div>

<div class="content">

    <div class="page-header">
        <h2>ℹ️ Información del Sistema</h2>
        <p>Datos de runtime del servidor Liberty modernizado — PedjasApp Jakarta EE 10</p>
    </div>

    <div class="info-grid">

        <!-- ── Java / JVM ───────────────────────────────────────────────── -->
        <div class="info-card">
            <div class="info-card-header">
                <span>☕</span>
                <h3>Java / JVM</h3>
            </div>
            <table class="info-table">
                <tr>
                    <td class="label">Versión Java</td>
                    <td class="value"><span class="tag green">${javaVersion}</span></td>
                </tr>
                <tr>
                    <td class="label">Vendor</td>
                    <td class="value">${javaVendor}</td>
                </tr>
                <tr>
                    <td class="label">JVM</td>
                    <td class="value">${jvmName}</td>
                </tr>
                <tr>
                    <td class="label">JVM versión</td>
                    <td class="value">${jvmVersion}</td>
                </tr>
            </table>
        </div>

        <!-- ── Liberty / OS ─────────────────────────────────────────────── -->
        <div class="info-card">
            <div class="info-card-header">
                <span>🖥️</span>
                <h3>Sistema Operativo</h3>
            </div>
            <table class="info-table">
                <tr>
                    <td class="label">SO</td>
                    <td class="value">${osName}</td>
                </tr>
                <tr>
                    <td class="label">Arquitectura</td>
                    <td class="value"><span class="tag">${osArch}</span></td>
                </tr>
                <tr>
                    <td class="label">Versión SO</td>
                    <td class="value">${osVersion}</td>
                </tr>
                <tr>
                    <td class="label">Servidor</td>
                    <td class="value"><span class="tag purple">${libertyVersion}</span></td>
                </tr>
            </table>
        </div>

        <!-- ── Memoria ──────────────────────────────────────────────────── -->
        <div class="info-card">
            <div class="info-card-header">
                <span>📊</span>
                <h3>Memoria JVM (Heap)</h3>
            </div>
            <table class="info-table">
                <tr>
                    <td class="label">En uso</td>
                    <td class="value"><strong>${memUsedMb} MB</strong></td>
                </tr>
                <tr>
                    <td class="label">Asignado</td>
                    <td class="value">${memTotalMb} MB</td>
                </tr>
                <tr>
                    <td class="label">Máximo (-Xmx)</td>
                    <td class="value">${memMaxMb} MB</td>
                </tr>
                <tr>
                    <td class="label">Uso actual</td>
                    <td class="value">
                        <div class="mem-row">
                            <div class="mem-bar-wrap">
                                <%
                                    long used  = (Long) request.getAttribute("memUsedMb");
                                    long total = (Long) request.getAttribute("memTotalMb");
                                    int  pct   = total > 0 ? (int) (used * 100 / total) : 0;
                                %>
                                <div class="mem-bar-fill" style="width: <%= pct %>%;"></div>
                            </div>
                            <span class="mem-label"><%= pct %>%</span>
                        </div>
                    </td>
                </tr>
            </table>
        </div>

        <!-- ── Stack tecnológico ────────────────────────────────────────── -->
        <div class="info-card">
            <div class="info-card-header">
                <span>⚙️</span>
                <h3>Stack Tecnológico</h3>
            </div>
            <table class="info-table">
                <tr>
                    <td class="label">Runtime</td>
                    <td class="value"><span class="tag green">WebSphere Liberty 26.0.0.9</span></td>
                </tr>
                <tr>
                    <td class="label">Jakarta EE</td>
                    <td class="value"><span class="tag">Jakarta EE 10</span></td>
                </tr>
                <tr>
                    <td class="label">MicroProfile</td>
                    <td class="value"><span class="tag">MicroProfile 6.1</span></td>
                </tr>
                <tr>
                    <td class="label">Base de datos</td>
                    <td class="value"><span class="tag purple">PostgreSQL 16</span></td>
                </tr>
                <tr>
                    <td class="label">JPA Provider</td>
                    <td class="value">EclipseLink 4.x</td>
                </tr>
                <tr>
                    <td class="label">Origen (legacy)</td>
                    <td class="value">tWAS 9.0 + EJB 2.x CMP</td>
                </tr>
            </table>
        </div>

        <!-- ── Endpoints MicroProfile ────────────────────────────────────── -->
        <div class="info-card full-width">
            <div class="info-card-header">
                <span>🔗</span>
                <h3>Endpoints MicroProfile</h3>
            </div>
            <div class="endpoints-grid">
                <a href="/health" target="_blank" class="endpoint-btn">
                    <span class="ep-icon">❤️</span>
                    <span class="ep-name">Health</span>
                    <span class="ep-url">/health</span>
                    <span class="ep-desc">Estado global del servidor (liveness + readiness)</span>
                </a>
                <a href="/health/live" target="_blank" class="endpoint-btn">
                    <span class="ep-icon">💓</span>
                    <span class="ep-name">Liveness</span>
                    <span class="ep-url">/health/live</span>
                    <span class="ep-desc">Probe de liveness para Kubernetes</span>
                </a>
                <a href="/health/ready" target="_blank" class="endpoint-btn">
                    <span class="ep-icon">✅</span>
                    <span class="ep-name">Readiness</span>
                    <span class="ep-url">/health/ready</span>
                    <span class="ep-desc">Probe de readiness para Kubernetes</span>
                </a>
                <a href="/metrics" target="_blank" class="endpoint-btn">
                    <span class="ep-icon">📈</span>
                    <span class="ep-name">Metrics</span>
                    <span class="ep-url">/metrics</span>
                    <span class="ep-desc">Métricas Prometheus (MicroProfile Metrics 5.0)</span>
                </a>
                <a href="/openapi/ui/" target="_blank" class="endpoint-btn">
                    <span class="ep-icon">📋</span>
                    <span class="ep-name">OpenAPI UI</span>
                    <span class="ep-url">/openapi/ui/</span>
                    <span class="ep-desc">Explorador Swagger de la API REST</span>
                </a>
            </div>
        </div>

    </div><!-- /info-grid -->
</div><!-- /content -->

<div class="footer">
    Java Modernization Workshop — WebSphere Liberty 26.0.0.9 &amp; Jakarta EE 10
</div>

</body>
</html>
