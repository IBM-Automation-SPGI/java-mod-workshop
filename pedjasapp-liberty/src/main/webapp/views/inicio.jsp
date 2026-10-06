<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PedjasApp Liberty — Inicio de Sesión</title>
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
            --border-color: #d1d5db;
            --success: #198038;
            --danger: #da1e28;
            --shadow-sm: 0 2px 8px rgba(0,0,0,0.06);
            --shadow-md: 0 10px 25px -5px rgba(15, 98, 254, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
        }

        * { box-sizing: border-box; }
        body {
            font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: linear-gradient(135deg, #edf2f7 0%, #e2e8f0 100%);
            margin: 0;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            color: var(--text-main);
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

        .main-container {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem 1rem;
        }

        .card {
            width: 100%;
            max-width: 440px;
            background: var(--card-bg);
            padding: 2.5rem;
            border-radius: 12px;
            box-shadow: var(--shadow-md);
            border: 1px solid rgba(255, 255, 255, 0.8);
        }

        .card-header {
            text-align: center;
            margin-bottom: 2rem;
        }
        .card-header .icon-wrap {
            width: 56px;
            height: 56px;
            background: #edf5ff;
            color: var(--primary);
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 1.6rem;
            margin-bottom: 1rem;
            box-shadow: 0 4px 12px rgba(15, 98, 254, 0.15);
        }
        .card-header h2 {
            margin: 0;
            font-size: 1.6rem;
            font-weight: 700;
            color: #111827;
        }
        .card-header p {
            margin: 0.4rem 0 0;
            color: var(--text-muted);
            font-size: 0.92rem;
        }

        .form-group {
            margin-bottom: 1.3rem;
        }
        label {
            display: block;
            margin-bottom: 0.4rem;
            color: #374151;
            font-size: 0.88rem;
            font-weight: 600;
        }
        input {
            width: 100%;
            padding: 0.75rem 0.9rem;
            border: 1.5px solid #d1d5db;
            border-radius: 6px;
            font-size: 0.95rem;
            font-family: inherit;
            transition: all 0.2s ease-in-out;
            background: #fbfbfb;
        }
        input:focus {
            outline: none;
            border-color: var(--primary);
            background: #fff;
            box-shadow: 0 0 0 4px rgba(15, 98, 254, 0.12);
        }

        button.btn-primary {
            width: 100%;
            background: linear-gradient(135deg, #0f62fe 0%, #0043ce 100%);
            color: #fff;
            border: none;
            padding: 0.85rem;
            font-size: 1.05rem;
            font-weight: 600;
            cursor: pointer;
            border-radius: 6px;
            transition: all 0.2s ease;
            box-shadow: 0 4px 12px rgba(15, 98, 254, 0.3);
            margin-top: 0.5rem;
        }
        button.btn-primary:hover {
            background: linear-gradient(135deg, #0353e9 0%, #002d9c 100%);
            box-shadow: 0 6px 16px rgba(15, 98, 254, 0.4);
            transform: translateY(-1px);
        }
        button.btn-primary:active {
            transform: translateY(0);
        }

        .error {
            background: #fff1f1;
            color: #da1e28;
            padding: 0.85rem 1rem;
            border-left: 4px solid #da1e28;
            border-radius: 4px;
            margin-bottom: 1.3rem;
            font-size: 0.88rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .demo-box {
            margin-top: 1.8rem;
            padding: 0.9rem;
            background: #f4f4f4;
            border-radius: 6px;
            font-size: 0.85rem;
            color: #4b5563;
            text-align: center;
            border: 1px dashed #cbd5e1;
        }
        .demo-box code {
            background: #e2e8f0;
            padding: 0.15rem 0.4rem;
            border-radius: 4px;
            color: #1e293b;
            font-weight: 600;
            font-family: monospace;
        }

        .footer {
            text-align: center;
            padding: 1rem;
            color: #64748b;
            font-size: 0.82rem;
        }
    </style>
</head>
<body>

<div class="header">
    <a href="${pageContext.request.contextPath}/" class="brand">
        <span>🛒 PedjasApp</span>
        <span class="badge">Liberty</span>
    </a>
</div>

<div class="main-container">
    <div class="card">
        <div class="card-header">
            <div class="icon-wrap">🔐</div>
            <h2>Iniciar Sesión</h2>
            <p>Accede al panel de gestión y catálogo modernizado</p>
        </div>

        <c:if test="${not empty error}">
            <div class="error">
                <span>⚠️</span>
                <span>${error}</span>
            </div>
        </c:if>

        <form id="loginForm" method="POST" action="${pageContext.request.contextPath}/inicio">
            <div class="form-group">
                <label for="usuario">Usuario</label>
                <input type="text" id="usuario" name="usuario"
                       placeholder="Ej: admin" required autocomplete="username" autofocus/>
            </div>

            <div class="form-group">
                <label for="contrasena">Contraseña</label>
                <input type="password" id="contrasena" name="contrasena"
                       placeholder="••••••••" required autocomplete="current-password"/>
            </div>

            <button type="submit" id="btnEntrar" class="btn-primary">Entrar a PedjasApp</button>
        </form>


        <div class="demo-box">
            Credenciales Demo: <code>admin</code> / <code>admin123</code>
        </div>
    </div>
</div>

<div class="footer">
    Java Modernization Workshop — WebSphere Liberty 26.0.0.9 & Jakarta EE 10
</div>

</body>
</html>
