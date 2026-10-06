<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>PedjasApp — Mis Pedidos</title>
    <style>
        body       { font-family: 'IBM Plex Sans', Arial, sans-serif; background: #f4f4f4; margin: 0; }
        .header    { background: #0f62fe; color: #fff; padding: 1rem 2rem;
                     display: flex; justify-content: space-between; align-items: center; }
        .header h1 { margin: 0; font-size: 1.4rem; }
        .nav a     { color: #a6c8ff; text-decoration: none; margin-left: 1rem; }
        .nav a:hover { color: #fff; }
        .content   { max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
        .exito     { background: #defbe6; color: #198038; padding: 0.75rem;
                     border-left: 4px solid #198038; margin-bottom: 1rem; }
        table      { width: 100%; border-collapse: collapse; background: #fff;
                     box-shadow: 0 1px 4px rgba(0,0,0,.1); }
        th         { background: #0043ce; color: #fff; padding: 0.75rem 1rem; text-align: left; }
        td         { padding: 0.7rem 1rem; border-bottom: 1px solid #e0e0e0; }
        tr:hover td { background: #edf5ff; }
    </style>
</head>
<body>

<div class="header">
    <h1>🛒 PedjasApp — Mis Pedidos</h1>
    <nav class="nav">
        <a href="${pageContext.request.contextPath}/catalogo">Catálogo</a>
        <a href="${pageContext.request.contextPath}/inicio">Cerrar Sesión</a>
    </nav>
</div>

<div class="content">

    <c:if test="${not empty param.exito}">
        <div class="exito">✅ Pedido #${param.exito} creado correctamente.</div>
    </c:if>

    <h2>Historial de Pedidos</h2>

    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Número de Pedido</th>
                <th>Estado</th>
            </tr>
        </thead>
        <tbody>
        <c:choose>
            <c:when test="${empty pedidosIds}">
                <tr><td colspan="3" style="text-align:center;color:#6f6f6f;">
                    No tienes pedidos todavía. <a href="${pageContext.request.contextPath}/catalogo">Ver catálogo</a>
                </td></tr>
            </c:when>
            <c:otherwise>
                <c:forEach var="pedidoId" items="${pedidosIds}" varStatus="st">
                    <tr>
                        <td>${st.index + 1}</td>
                        <td><strong>#${pedidoId}</strong></td>
                        <td>PENDIENTE</td>
                    </tr>
                </c:forEach>
            </c:otherwise>
        </c:choose>
        </tbody>
    </table>

</div>
</body>
</html>
