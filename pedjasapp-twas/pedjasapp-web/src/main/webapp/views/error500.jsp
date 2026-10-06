<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"
         isErrorPage="true" %>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>PedjasApp — Error interno</title>
    <style>
        body { font-family: Arial, sans-serif; background: #f4f4f4; text-align: center; margin: 0; }
        .header { background: #da1e28; color: #fff; padding: 1rem 2rem; }
        .content { margin-top: 5rem; }
        h1 { font-size: 4rem; color: #da1e28; margin-bottom: 0; }
        p  { color: #525252; }
        a  { color: #0f62fe; }
    </style>
</head>
<body>
<div class="header"><h2>PedjasApp</h2></div>
<div class="content">
    <h1>500</h1>
    <p>Se ha producido un error interno en el servidor.</p>
    <p><a href="${pageContext.request.contextPath}/catalogo">Volver al catálogo</a></p>
</div>
</body>
</html>
