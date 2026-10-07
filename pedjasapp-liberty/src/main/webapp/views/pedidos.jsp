<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fmt" uri="jakarta.tags.fmt" %>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PedjasApp Liberty — Mis Pedidos</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #0f62fe;
            --primary-hover: #0353e9;
            --bg: #f4f7fb;
            --card-bg: #ffffff;
            --text-main: #161616;
            --text-muted: #525252;
            --border-color: #e0e0e0;
            --success: #198038;
            --danger: #da1e28;
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
            display: flex;
            align-items: center;
            gap: 0.6rem;
            color: #fff;
            text-decoration: none;
            font-size: 1.35rem;
            font-weight: 700;
            letter-spacing: -0.5px;
            transition: opacity 0.2s;
        }
        .header a.brand:hover { opacity: 0.9; }
        .badge {
            background: rgba(36, 161, 72, 0.25);
            color: #42be65;
            border: 1px solid #24a148;
            font-size: 0.72rem;
            font-weight: 600;
            padding: 0.2rem 0.55rem;
            border-radius: 12px;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }
        .nav { display: flex; align-items: center; gap: 1.2rem; }
        .nav .user-greeting {
            color: #d0e2ff;
            font-size: 0.95rem;
            font-weight: 500;
        }
        .nav a.nav-link {
            color: #fff;
            text-decoration: none;
            font-size: 0.92rem;
            padding: 0.45rem 0.9rem;
            border-radius: 6px;
            background: rgba(255,255,255,0.12);
            transition: all 0.2s;
            font-weight: 500;
        }
        .nav a.nav-link:hover { background: rgba(255,255,255,0.22); transform: translateY(-1px); }
        .nav a.nav-link.active { background: rgba(255,255,255,0.25); }
        .nav a.nav-link.logout {
            background: rgba(218,30,40,0.35);
            border: 1px solid rgba(218,30,40,0.5);
        }
        .nav a.nav-link.logout:hover { background: rgba(218,30,40,0.6); }

        .content { max-width: 960px; width: 100%; margin: 2rem auto; padding: 0 1.5rem; flex: 1; }

        .page-header { margin-bottom: 1.5rem; }
        .page-header h2 { margin: 0; font-size: 1.5rem; color: #111827; font-weight: 700; }
        .page-header p { margin: 0.2rem 0 0; color: var(--text-muted); font-size: 0.9rem; }

        .exito {
            background: #defbe6;
            color: #198038;
            padding: 0.85rem 1rem;
            border-left: 4px solid #198038;
            border-radius: 4px;
            margin-bottom: 1.5rem;
            font-size: 0.92rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-weight: 500;
        }

        .table-card {
            background: var(--card-bg);
            border-radius: 10px;
            box-shadow: var(--shadow-md);
            border: 1px solid #e5e7eb;
            overflow: hidden;
        }
        table { width: 100%; border-collapse: collapse; text-align: left; }
        th {
            background: #f8fafc;
            color: #475569;
            padding: 0.9rem 1.2rem;
            font-size: 0.82rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 2px solid #e2e8f0;
        }
        td {
            padding: 1rem 1.2rem;
            border-bottom: 1px solid #edf2f7;
            font-size: 0.92rem;
            vertical-align: middle;
        }
        tr:last-child td { border-bottom: none; }
        tr:hover td { background: #f8fbff; }

        .estado-badge {
            display: inline-block;
            font-size: 0.78rem;
            font-weight: 700;
            padding: 0.25rem 0.7rem;
            border-radius: 12px;
            text-transform: uppercase;
            letter-spacing: 0.4px;
        }
        .estado-PENDIENTE  { background: #fef9c3; color: #92400e; border: 1px solid #fde68a; }
        .estado-PROCESADO  { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
        .estado-ENVIADO    { background: #f5f3ff; color: #6d28d9; border: 1px solid #ddd6fe; }
        .estado-ENTREGADO  { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
        .estado-CANCELADO  { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }

        .empty-state { text-align: center; padding: 3.5rem 1rem; color: #64748b; }
        .empty-state .icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
        .empty-state a { color: var(--primary); font-weight: 600; text-decoration: none; }
        .empty-state a:hover { text-decoration: underline; }

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
    <a href="${pageContext.request.contextPath}/catalogo" class="brand" title="Ir al Catálogo">
        <span>🛒 PedjasApp</span>
        <span class="badge">Liberty</span>
    </a>
    <nav class="nav">
        <span class="user-greeting">👤 <span>Hola, <strong>${sessionScope.nombre}</strong></span></span>
        <a href="${pageContext.request.contextPath}/catalogo" class="nav-link">🏷️ Catálogo</a>
        <a href="${pageContext.request.contextPath}/pedidos/lista" class="nav-link active">📦 Mis Pedidos</a>
        <a href="${pageContext.request.contextPath}/info" class="nav-link">ℹ️ Info</a>
        <a href="${pageContext.request.contextPath}/metrics-dashboard" class="nav-link">📊 Métricas</a>
        <a href="${pageContext.request.contextPath}/inicio?accion=logout" class="nav-link logout">Cerrar Sesión</a>
    </nav>
</div>

<div class="content">

    <c:if test="${not empty param.exito}">
        <div class="exito">
            <span>✅</span>
            <span>Pedido <strong>#${param.exito}</strong> creado correctamente.</span>
        </div>
    </c:if>

    <div class="page-header">
        <h1>📦 Mis Pedidos — ${sessionScope.nombre}</h1>
        <p>Historial completo de pedidos realizados</p>
    </div>

    <div class="table-card">
        <table>
            <thead>
                <tr>
                    <th style="width: 50px;">#</th>
                    <th style="width: 90px;">ID Pedido</th>
                    <th>Fecha</th>
                    <th style="width: 140px;">Estado</th>
                    <th style="width: 120px; text-align: right;">Total (€)</th>
                </tr>
            </thead>
            <tbody>
            <c:choose>
                <c:when test="${empty pedidos}">
                    <tr>
                        <td colspan="5">
                            <div class="empty-state">
                                <div class="icon">📭</div>
                                <p>Aún no tienes pedidos realizados.</p>
                                <a href="${pageContext.request.contextPath}/catalogo">Ver catálogo y realizar tu primer pedido →</a>
                            </div>
                        </td>
                    </tr>
                </c:when>
                <c:otherwise>
                    <c:forEach var="pedido" items="${pedidos}" varStatus="st">
                        <tr>
                            <td style="color:#64748b; font-weight:600;">${st.index + 1}</td>
                            <td><strong style="color:#0f172a;">#${pedido.id}</strong></td>
                            <td><fmt:formatDate value="${pedido.fechaCreacion}" pattern="dd/MM/yyyy HH:mm"/></td>
                            <td><span class="estado-badge estado-${pedido.estado}">${pedido.estado}</span></td>
                            <td style="text-align:right; font-weight:700; color:#0f172a;">
                                <fmt:formatNumber value="${pedido.totalPedido}" type="number" minFractionDigits="2"/>
                            </td>
                        </tr>
                    </c:forEach>
                </c:otherwise>
            </c:choose>
            </tbody>
        </table>
    </div>

</div>

<div class="footer">
    Java Modernization Workshop — WebSphere Liberty 26.0.0.9 &amp; Jakarta EE 10
</div>

</body>
</html>
