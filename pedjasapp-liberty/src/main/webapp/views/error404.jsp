<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>PedjasApp Liberty — Página no encontrada</title>
    <style>
        body { font-family: Arial, sans-serif; background: #f4f4f4; text-align: center; margin: 0; }
        .header { background: #0f62fe; color: #fff; padding: 1rem 2rem; }
        .content { margin-top: 5rem; }
        h1 { font-size: 4rem; color: #0f62fe; margin-bottom: 0; }
        p  { color: #525252; }
        a  { color: #0f62fe; }
    </style>
</head>
<body>
<div class="header"><h2>PedjasApp Liberty</h2></div>
<div class="content">
    <h1>404</h1>
    <p>La página que buscas no existe.</p>
    <p><a href="${pageContext.request.contextPath}/catalogo">Volver al catálogo</a></p>
</div>
</body>
</html>
