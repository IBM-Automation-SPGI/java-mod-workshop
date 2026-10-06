<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fmt" uri="jakarta.tags.fmt" %>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PedjasApp Liberty — Catálogo</title>
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
            --success-hover: #0e6027;
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
        .nav {
            display: flex;
            align-items: center;
            gap: 1.2rem;
        }
        .nav .user-greeting {
            color: #d0e2ff;
            font-size: 0.95rem;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 0.4rem;
        }
        .nav a.nav-link {
            color: #fff;
            text-decoration: none;
            font-size: 0.92rem;
            padding: 0.45rem 0.9rem;
            border-radius: 6px;
            background: rgba(255, 255, 255, 0.12);
            transition: all 0.2s;
            font-weight: 500;
        }
        .nav a.nav-link:hover {
            background: rgba(255, 255, 255, 0.22);
            transform: translateY(-1px);
        }
        .nav a.nav-link.logout {
            background: rgba(218, 30, 40, 0.35);
            border: 1px solid rgba(218, 30, 40, 0.5);
        }
        .nav a.nav-link.logout:hover {
            background: rgba(218, 30, 40, 0.6);
        }

        .content {
            max-width: 1200px;
            width: 100%;
            margin: 2rem auto;
            padding: 0 1.5rem;
            flex: 1;
        }

        .page-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
            flex-wrap: wrap;
            gap: 1rem;
        }
        .page-title h2 {
            margin: 0;
            font-size: 1.5rem;
            color: #111827;
            font-weight: 700;
        }
        .page-title p {
            margin: 0.2rem 0 0;
            color: var(--text-muted);
            font-size: 0.9rem;
        }

        .filtros-card {
            background: var(--card-bg);
            padding: 1rem 1.3rem;
            border-radius: 8px;
            box-shadow: var(--shadow-sm);
            border: 1px solid #e5e7eb;
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        .filtros-card form {
            display: flex;
            align-items: center;
            gap: 0.8rem;
            margin: 0;
        }
        .filtros-card label {
            font-size: 0.9rem;
            font-weight: 600;
            color: #374151;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .filtros-card select {
            padding: 0.5rem 0.8rem;
            border-radius: 6px;
            border: 1.5px solid #d1d5db;
            font-size: 0.9rem;
            font-family: inherit;
            background: #fff;
            outline: none;
            cursor: pointer;
        }
        .filtros-card select:focus {
            border-color: var(--primary);
        }
        .filtros-card button {
            background: var(--primary);
            color: #fff;
            border: none;
            padding: 0.55rem 1.1rem;
            border-radius: 6px;
            font-weight: 600;
            font-size: 0.9rem;
            cursor: pointer;
            transition: all 0.2s;
        }
        .filtros-card button:hover {
            background: var(--primary-hover);
        }

        .table-card {
            background: var(--card-bg);
            border-radius: 10px;
            box-shadow: var(--shadow-md);
            border: 1px solid #e5e7eb;
            overflow: hidden;
            margin-top: 1rem;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
        }
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

        .prod-id {
            color: #64748b;
            font-weight: 600;
            font-size: 0.85rem;
        }
        .prod-name {
            font-weight: 600;
            color: #0f172a;
            font-size: 0.98rem;
        }
        .prod-desc {
            color: #64748b;
            font-size: 0.85rem;
            max-width: 320px;
            line-height: 1.35;
        }
        .prod-price {
            font-weight: 700;
            color: #0f172a;
            font-size: 1.05rem;
            white-space: nowrap;
        }
        .cat-tag {
            display: inline-block;
            background: #eff6ff;
            color: #1d4ed8;
            font-size: 0.75rem;
            font-weight: 600;
            padding: 0.25rem 0.6rem;
            border-radius: 12px;
            border: 1px solid #dbeafe;
        }

        .stock-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
            font-weight: 600;
            font-size: 0.85rem;
            padding: 0.2rem 0.6rem;
            border-radius: 12px;
        }
        .stock-ok {
            background: #f0fdf4;
            color: #15803d;
            border: 1px solid #bbf7d0;
        }
        .stock-bajo {
            background: #fef2f2;
            color: #b91c1c;
            border: 1px solid #fecaca;
        }
        .stock-out {
            background: #f1f5f9;
            color: #64748b;
            border: 1px solid #e2e8f0;
        }

        /* Order form in table cell: inline layout with input and button side by side */
        .order-form {
            display: inline-flex;
            align-items: center;
            gap: 0.45rem;
            margin: 0;
            white-space: nowrap;
        }
        .order-form input[type="number"] {
            width: 58px;
            height: 36px;
            padding: 0.3rem 0.4rem;
            border: 1.5px solid #d1d5db;
            border-radius: 6px;
            text-align: center;
            font-size: 0.92rem;
            font-family: inherit;
            outline: none;
            transition: all 0.2s;
            background: #fff;
        }
        .order-form input[type="number"]:focus {
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(15, 98, 254, 0.15);
        }
        .btn-pedido {
            height: 36px;
            background: linear-gradient(135deg, #198038 0%, #0e6027 100%);
            color: #fff;
            border: none;
            padding: 0 0.95rem;
            border-radius: 6px;
            font-size: 0.88rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
            box-shadow: 0 2px 6px rgba(25, 128, 56, 0.25);
            white-space: nowrap;
        }
        .btn-pedido:hover {
            background: linear-gradient(135deg, #24a148 0%, #198038 100%);
            box-shadow: 0 4px 10px rgba(25, 128, 56, 0.35);
            transform: translateY(-1px);
        }
        .btn-pedido:active {
            transform: translateY(0);
        }

        .error {
            background: #fff1f1;
            color: #da1e28;
            padding: 0.85rem 1rem;
            border-left: 4px solid #da1e28;
            border-radius: 4px;
            margin-bottom: 1.3rem;
            font-size: 0.9rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

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
        <a href="${pageContext.request.contextPath}/pedidos/lista" class="nav-link">📦 Mis Pedidos</a>
        <a href="${pageContext.request.contextPath}/info" class="nav-link">ℹ️ Info</a>
        <a href="${pageContext.request.contextPath}/metrics" class="nav-link" target="_blank">📊 Métricas</a>
        <a href="${pageContext.request.contextPath}/inicio?accion=logout" class="nav-link logout">Cerrar Sesión</a>
    </nav>
</div>

<div class="content">

    <c:if test="${not empty error}">
        <div class="error">
            <span>⚠️</span>
            <span>${error}</span>
        </div>
    </c:if>

    <div class="page-header">
        <div class="page-title">
            <h2>Catálogo de Productos</h2>
            <p>Selecciona la cantidad y realiza tu pedido al instante</p>
        </div>

        <div class="filtros-card">
            <form method="GET" action="${pageContext.request.contextPath}/catalogo">
                <label for="categoriaSelect">Categoría:</label>
                <select id="categoriaSelect" name="categoria">
                    <option value="">— Todas las categorías —</option>
                    <option value="ELECTRONICA"  ${categoriaSeleccionada == 'ELECTRONICA'  ? 'selected' : ''}>Electrónica</option>
                    <option value="HOGAR"        ${categoriaSeleccionada == 'HOGAR'        ? 'selected' : ''}>Hogar</option>
                    <option value="ROPA"         ${categoriaSeleccionada == 'ROPA'         ? 'selected' : ''}>Ropa</option>
                    <option value="ALIMENTACION" ${categoriaSeleccionada == 'ALIMENTACION' ? 'selected' : ''}>Alimentación</option>
                </select>
                <button type="submit">Filtrar</button>
            </form>
        </div>
    </div>

    <div class="table-card">
        <table>
            <thead>
                <tr>
                    <th style="width: 50px;">ID</th>
                    <th>Producto</th>
                    <th>Descripción</th>
                    <th style="width: 120px;">Precio</th>
                    <th style="width: 140px;">Categoría</th>
                    <th style="width: 110px;">Stock</th>
                    <th style="width: 180px; text-align: center;">Acción</th>
                </tr>
            </thead>
            <tbody>
            <c:choose>
                <c:when test="${empty productos}">
                    <tr>
                        <td colspan="7" style="text-align:center; padding: 3rem; color:#64748b;">
                            <div style="font-size: 2rem; margin-bottom: 0.5rem;">🔍</div>
                            No se encontraron productos en esta categoría.
                        </td>
                    </tr>
                </c:when>
                <c:otherwise>
                    <c:forEach var="p" items="${productos}">
                        <tr>
                            <td class="prod-id">#${p.id}</td>
                            <td class="prod-name">${p.nombre}</td>
                            <td class="prod-desc">${p.descripcion}</td>
                            <td class="prod-price"><fmt:formatNumber value="${p.precio}" type="number" minFractionDigits="2"/> €</td>
                            <td><span class="cat-tag">${p.categoria}</span></td>
                            <td>
                                <c:choose>
                                    <c:when test="${p.stock <= 0}">
                                        <span class="stock-badge stock-out">Agotado</span>
                                    </c:when>
                                    <c:when test="${p.stock < 5}">
                                        <span class="stock-badge stock-bajo">${p.stock} uds</span>
                                    </c:when>
                                    <c:otherwise>
                                        <span class="stock-badge stock-ok">${p.stock} uds</span>
                                    </c:otherwise>
                                </c:choose>
                            </td>
                            <td style="text-align: center;">
                                <c:if test="${p.stock > 0}">
                                    <form method="POST" action="${pageContext.request.contextPath}/pedidos/nuevo" class="order-form">
                                        <input type="hidden" name="productoId" value="${p.id}"/>
                                        <input type="number" name="cantidad" value="1" min="1" max="${p.stock}"
                                               aria-label="Cantidad para ${p.nombre}"/>
                                        <button type="submit" class="btn-pedido">
                                            <span>🛒</span>
                                            <span>Pedir</span>
                                        </button>
                                    </form>
                                </c:if>
                                <c:if test="${p.stock <= 0}">
                                    <span style="color:#94a3b8; font-size: 0.85rem; font-weight: 500;">Sin stock</span>
                                </c:if>
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
    Java Modernization Workshop — WebSphere Liberty 26.0.0.9 & PostgreSQL
</div>

</body>
</html>
