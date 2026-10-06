<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"
         import="com.pedjas.web.CatalogoServlet.ProductoDto, java.util.List" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>PedjasApp — Catálogo de Productos</title>
    <style>
        body        { font-family: 'IBM Plex Sans', Arial, sans-serif; background: #f4f4f4; margin: 0; }
        .header     { background: #0f62fe; color: #fff; padding: 1rem 2rem;
                      display: flex; justify-content: space-between; align-items: center; }
        .header h1  { margin: 0; font-size: 1.4rem; }
        .nav a      { color: #a6c8ff; text-decoration: none; margin-left: 1rem; }
        .nav a:hover { color: #fff; }
        .content    { max-width: 1100px; margin: 2rem auto; padding: 0 1rem; }
        .filtros    { margin-bottom: 1.5rem; }
        .filtros select, .filtros button {
                      padding: 0.5rem 1rem; border-radius: 2px; border: 1px solid #8d8d8d; }
        .filtros button { background: #0f62fe; color: #fff; border-color: #0f62fe; cursor: pointer; }
        table       { width: 100%; border-collapse: collapse; background: #fff;
                      box-shadow: 0 1px 4px rgba(0,0,0,.1); }
        th          { background: #0043ce; color: #fff; padding: 0.75rem 1rem; text-align: left; }
        td          { padding: 0.7rem 1rem; border-bottom: 1px solid #e0e0e0; }
        tr:hover td { background: #edf5ff; }
        .btn-pedido { background: #198038; color: #fff; border: none; padding: 0.4rem 0.8rem;
                      cursor: pointer; border-radius: 2px; font-size: 0.85rem; }
        .btn-pedido:hover { background: #0e6027; }
        .stock-bajo { color: #da1e28; font-weight: 600; }
        .error      { background: #fff1f1; color: #da1e28; padding: 0.75rem;
                      border-left: 4px solid #da1e28; margin-bottom: 1rem; }
    </style>
</head>
<body>

<div class="header">
    <h1>🛒 PedjasApp — Catálogo de Productos</h1>
    <nav class="nav">
        <a href="${pageContext.request.contextPath}/pedidos/lista">Mis Pedidos</a>
        <a href="${pageContext.request.contextPath}/inicio?accion=logout">Cerrar Sesión</a>
    </nav>
</div>

<div class="content">

    <c:if test="${not empty error}">
        <div class="error">${error}</div>
    </c:if>

    <div class="filtros">
        <form method="GET" action="${pageContext.request.contextPath}/catalogo">
            <label>Categoría:
                <select name="categoria">
                    <option value="">— Todas —</option>
                    <option value="ELECTRONICA" ${categoriaSeleccionada == 'ELECTRONICA' ? 'selected' : ''}>Electrónica</option>
                    <option value="HOGAR"       ${categoriaSeleccionada == 'HOGAR'       ? 'selected' : ''}>Hogar</option>
                    <option value="ROPA"        ${categoriaSeleccionada == 'ROPA'        ? 'selected' : ''}>Ropa</option>
                    <option value="ALIMENTACION" ${categoriaSeleccionada == 'ALIMENTACION' ? 'selected' : ''}>Alimentación</option>
                </select>
            </label>
            <button type="submit">Filtrar</button>
        </form>
    </div>

    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Precio (€)</th>
                <th>Categoría</th>
                <th>Stock</th>
                <th>Acción</th>
            </tr>
        </thead>
        <tbody>
        <c:choose>
            <c:when test="${empty productos}">
                <tr><td colspan="7" style="text-align:center;color:#6f6f6f;">
                    No hay productos disponibles en esta categoría.
                </td></tr>
            </c:when>
            <c:otherwise>
                <c:forEach var="p" items="${productos}">
                    <tr>
                        <td>${p.id}</td>
                        <td><strong>${p.nombre}</strong></td>
                        <td>${p.descripcion}</td>
                        <td><fmt:formatNumber value="${p.precio}" type="number" minFractionDigits="2" maxFractionDigits="2"/></td>
                        <td>${p.categoria}</td>
                        <td class="${p.stock < 5 ? 'stock-bajo' : ''}">${p.stock}</td>
                        <td>
                            <c:if test="${p.stock > 0}">
                                <form method="POST" action="${pageContext.request.contextPath}/pedidos/nuevo" style="display:inline">
                                    <input type="hidden" name="productoId" value="${p.id}"/>
                                    <input type="number" name="cantidad" value="1" min="1" max="${p.stock}"
                                           style="width:55px;padding:0.3rem;"/>
                                    <button type="submit" class="btn-pedido">Pedir</button>
                                </form>
                            </c:if>
                            <c:if test="${p.stock <= 0}">
                                <span style="color:#6f6f6f">Sin stock</span>
                            </c:if>
                        </td>
                    </tr>
                </c:forEach>
            </c:otherwise>
        </c:choose>
        </tbody>
    </table>

</div>
</body>
</html>
