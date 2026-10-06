<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PedjasApp — Inicio de Sesión</title>
    <style>
        body        { font-family: 'IBM Plex Sans', Arial, sans-serif; background: #f4f4f4; margin: 0; }
        .header     { background: #0f62fe; color: #fff; padding: 1rem 2rem; }
        .header h1  { margin: 0; font-size: 1.5rem; }
        .container  { max-width: 400px; margin: 4rem auto; background: #fff;
                      padding: 2rem; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,.1); }
        h2          { color: #262626; margin-top: 0; }
        label       { display: block; margin-bottom: 0.3rem; color: #525252; font-size: 0.9rem; }
        input       { width: 100%; padding: 0.6rem; margin-bottom: 1rem; border: 1px solid #8d8d8d;
                      border-radius: 2px; box-sizing: border-box; font-size: 1rem; }
        input:focus { outline: 2px solid #0f62fe; border-color: #0f62fe; }
        button      { width: 100%; background: #0f62fe; color: #fff; border: none; padding: 0.75rem;
                      font-size: 1rem; cursor: pointer; border-radius: 2px; }
        button:hover { background: #0043ce; }
        .error      { background: #fff1f1; color: #da1e28; padding: 0.75rem;
                      border-left: 4px solid #da1e28; margin-bottom: 1rem; font-size: 0.9rem; }
        .footer     { text-align: center; margin-top: 2rem; color: #6f6f6f; font-size: 0.8rem; }
    </style>
</head>
<body>

<div class="header">
    <h1>🛒 PedjasApp — Sistema de Gestión de Pedidos</h1>
</div>

<div class="container">
    <h2>Iniciar Sesión</h2>

    <c:if test="${not empty error}">
        <div class="error">${error}</div>
    </c:if>

    <form method="POST" action="${pageContext.request.contextPath}/inicio">
        <label for="usuario">Usuario</label>
        <input type="text" id="usuario" name="usuario"
               placeholder="admin" required autocomplete="username"/>

        <label for="contrasena">Contraseña</label>
        <input type="password" id="contrasena" name="contrasena"
               placeholder="••••••••" required autocomplete="current-password"/>

        <button type="submit">Entrar</button>
    </form>

    <div class="footer">
        Demo: usuario <strong>admin</strong> / contraseña <strong>admin123</strong>
    </div>
</div>

</body>
</html>
