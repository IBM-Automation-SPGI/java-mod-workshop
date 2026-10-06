<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fmt" uri="jakarta.tags.fmt" %>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>PedjasApp Liberty — Mis Pedidos</title>
    <style>
        body       { font-family: 'IBM Plex Sans', Arial, sans-serif; background: #f4f4f4; margin: 0; }
        .header    { background: #0f62fe; color: #fff; padding: 1rem 2rem;
                     display: flex; justify-content: space-between; align-items: center; }
        .header h1 { margin: 0; font-size: 1.4rem; }
        .badge     { background: #198038; color: #fff; font-size: 0.7rem; padding: 0.15rem 0.5rem;
                     border-radius: 10px; vertical-align: middle; margin-left: 0.4rem; }
        .nav a     { color: #a6c8ff; text-decoration: none; margin-left: 1rem; }
        .nav a:hover { color: #fff; }
        .content   { max-width: 900px; margin: 2rem auto; padding: 0 1rem; }
        .exito     { background: #defbe6; color: #198038; padding: 0.75rem;
                     border-left: 4px solid #198038; margin-bottom: 1rem; }
        table      { width: 100%; border-collapse: collapse; background: #fff;
                     box-shadow: 0 1px 4px rgba(0,0,0,.1); }
        th         { background: #0043ce; color: #fff; padding: 0.75rem 1rem; text-align: left; }
        td         { padding: 0.7rem 1rem; border-bottom: 1px solid #e0e0e0; }
        tr:hover td { background: #edf5ff; }
        .estado-PENDIENTE  { color: #f1c21b; font-weight: 600; }
        .estado-PROCESADO  { color: #0f62fe; font-weight: 600; }
        .estado-ENVIADO    { color: #8a3ffc; font-weight: 600; }
        .estado-ENTREGADO  { color: #198038; font-weight: 600; }
        .estado-CANCELADO  { color: #da1e28; font-weight: 600; }
    </style>
</head>
<body>

<div class="header">
    <h1>🛒 PedjasApp <span class="badge">Liberty</span> — Mis Pedidos</h1>
    <nav class="nav">
        <a href="${pageContext.request.contextPath}/catalogo">Catálogo</a>
        <a href="${pageContext.request.contextPath}/inicio">Cerrar Sesión</a>
    </nav>
</div>

<div class="content">

    <c:if test="${not empty param.exito}">
        <div class="exito">✅ Pedido #${param.exito} creado correctamente.</div>
    </c:if>

    <h2>Historial de Pedidos — ${sessionScope.nombre}</h2>

    <table>
        <thead>
            <tr>
                <th>#</th><th>Pedido</th><th>Fecha</th><th>Estado</th><th>Total (€)</th>
            </tr>
        </thead>
        <tbody>
        <c:choose>
            <c:when test="${empty pedidos}">
                <tr><td colspan="5" style="text-align:center;color:#6f6f6f;">
                    No tienes pedidos todavía.
                    <a href="${pageContext.request.contextPath}/catalogo">Ver catálogo</a>
                </td></tr>
            </c:when>
            <c:otherwise>
                <c:forEach var="pedido" items="${pedidos}" varStatus="st">
                    <tr>
                        <td>${st.index + 1}</td>
                        <td><strong>#${pedido.id}</strong></td>
                        <td><fmt:formatDate value="${pedido.fechaCreacion}" pattern="dd/MM/yyyy HH:mm"/></td>
                        <td><span class="estado-${pedido.estado}">${pedido.estado}</span></td>
                        <td><fmt:formatNumber value="${pedido.totalPedido}" type="number" minFractionDigits="2"/></td>
                    </tr>
                </c:forEach>
            </c:otherwise>
        </c:choose>
        </tbody>
    </table>

</div>
</body>
</html>
