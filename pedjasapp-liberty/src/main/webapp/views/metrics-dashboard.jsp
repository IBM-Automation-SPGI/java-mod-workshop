<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PedjasApp Liberty — Dashboard de Métricas</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary:    #0f62fe;
            --primary-dk: #0043ce;
            --success:    #24a148;
            --warning:    #f1c21b;
            --danger:     #da1e28;
            --bg:         #f4f7fb;
            --card-bg:    #ffffff;
            --text-main:  #161616;
            --text-muted: #525252;
            --border:     #e0e0e0;
            --shadow-md:  0 4px 16px rgba(0,0,0,0.08);
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'IBM Plex Sans', -apple-system, sans-serif;
            background: var(--bg);
            color: var(--text-main);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }

        /* ── Header ──────────────────────────────────────────────────────── */
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
        }
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

        /* ── Page ────────────────────────────────────────────────────────── */
        .content { max-width: 1200px; width: 100%; margin: 2rem auto; padding: 0 1.5rem; flex: 1; }

        .page-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 1.8rem;
            flex-wrap: wrap;
            gap: 0.75rem;
        }
        .page-header-left h2 { font-size: 1.5rem; color: #111827; font-weight: 700; }
        .page-header-left p  { margin-top: 0.2rem; color: var(--text-muted); font-size: 0.9rem; }

        .refresh-controls {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }
        .refresh-status {
            font-size: 0.82rem;
            color: var(--text-muted);
            font-family: 'IBM Plex Mono', monospace;
        }
        .refresh-status .dot {
            display: inline-block;
            width: 8px; height: 8px;
            border-radius: 50%;
            background: var(--success);
            margin-right: 4px;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50%       { opacity: 0.3; }
        }
        .btn-refresh {
            background: var(--primary);
            color: #fff;
            border: none;
            padding: 0.45rem 1rem;
            border-radius: 6px;
            font-size: 0.88rem;
            font-weight: 600;
            cursor: pointer;
            font-family: 'IBM Plex Sans', sans-serif;
            transition: background 0.2s;
        }
        .btn-refresh:hover { background: var(--primary-dk); }

        /* ── KPI row ─────────────────────────────────────────────────────── */
        .kpi-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
            gap: 1rem;
            margin-bottom: 1.5rem;
        }
        .kpi-card {
            background: var(--card-bg);
            border-radius: 10px;
            border: 1px solid var(--border);
            box-shadow: var(--shadow-md);
            padding: 1.1rem 1.25rem;
            display: flex;
            flex-direction: column;
            gap: 0.3rem;
        }
        .kpi-card .kpi-label {
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--text-muted);
        }
        .kpi-card .kpi-value {
            font-size: 1.9rem;
            font-weight: 700;
            color: var(--text-main);
            line-height: 1;
            font-family: 'IBM Plex Mono', monospace;
        }
        .kpi-card .kpi-unit {
            font-size: 0.78rem;
            color: var(--text-muted);
        }
        .kpi-card .kpi-icon { font-size: 1.4rem; margin-bottom: 0.25rem; }

        /* colour tints */
        .kpi-card.blue   { border-top: 3px solid var(--primary); }
        .kpi-card.green  { border-top: 3px solid var(--success); }
        .kpi-card.yellow { border-top: 3px solid #f59e0b; }
        .kpi-card.purple { border-top: 3px solid #7c3aed; }
        .kpi-card.teal   { border-top: 3px solid #0d9488; }

        /* ── Section grid ────────────────────────────────────────────────── */
        .dash-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1.25rem;
            margin-bottom: 1.5rem;
        }
        @media (max-width: 780px) { .dash-grid { grid-template-columns: 1fr; } }

        .dash-card {
            background: var(--card-bg);
            border-radius: 10px;
            border: 1px solid var(--border);
            box-shadow: var(--shadow-md);
            overflow: hidden;
        }
        .dash-card.full { grid-column: 1 / -1; }

        .dash-card-header {
            background: #f8fafc;
            border-bottom: 2px solid #e2e8f0;
            padding: 0.7rem 1.2rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .dash-card-header h3 {
            font-size: 0.82rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #475569;
        }

        /* ── Bar chart ───────────────────────────────────────────────────── */
        .bar-list { padding: 0.75rem 1.2rem; display: flex; flex-direction: column; gap: 0.7rem; }
        .bar-item { display: flex; flex-direction: column; gap: 0.2rem; }
        .bar-label-row {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
        }
        .bar-name  { font-size: 0.82rem; font-weight: 600; color: #374151; }
        .bar-val   { font-size: 0.82rem; color: var(--text-muted); font-family: 'IBM Plex Mono', monospace; }
        .bar-track {
            height: 8px;
            background: #e2e8f0;
            border-radius: 6px;
            overflow: hidden;
        }
        .bar-fill {
            height: 100%;
            border-radius: 6px;
            background: linear-gradient(90deg, var(--primary), var(--primary-dk));
            transition: width 0.5s ease;
            min-width: 2px;
        }
        .bar-fill.green  { background: linear-gradient(90deg, #22c55e, #16a34a); }
        .bar-fill.orange { background: linear-gradient(90deg, #f59e0b, #d97706); }
        .bar-fill.purple { background: linear-gradient(90deg, #8b5cf6, #7c3aed); }
        .bar-fill.teal   { background: linear-gradient(90deg, #14b8a6, #0d9488); }

        /* ── Metric table ────────────────────────────────────────────────── */
        .metric-table { width: 100%; border-collapse: collapse; }
        .metric-table td {
            padding: 0.6rem 1.2rem;
            border-bottom: 1px solid #f1f5f9;
            font-size: 0.88rem;
            vertical-align: middle;
        }
        .metric-table tr:last-child td { border-bottom: none; }
        .metric-table .ml { color: #64748b; font-weight: 600; font-size: 0.83rem; width: 55%; }
        .metric-table .mv {
            color: #0f172a;
            font-family: 'IBM Plex Mono', monospace;
            font-size: 0.83rem;
            text-align: right;
        }
        .tag {
            display: inline-block;
            padding: 0.15rem 0.5rem;
            border-radius: 8px;
            font-size: 0.78rem;
            font-weight: 600;
            font-family: 'IBM Plex Sans', sans-serif;
        }
        .tag.blue   { background: #eff6ff; color: #1d4ed8; border: 1px solid #dbeafe; }
        .tag.green  { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
        .tag.orange { background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa; }

        /* ── REST table ──────────────────────────────────────────────────── */
        .rest-table { width: 100%; border-collapse: collapse; }
        .rest-table th, .rest-table td {
            padding: 0.55rem 1rem;
            text-align: left;
            font-size: 0.82rem;
            border-bottom: 1px solid #f1f5f9;
        }
        .rest-table th {
            background: #f8fafc;
            font-weight: 700;
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            color: #64748b;
        }
        .rest-table td { font-family: 'IBM Plex Mono', monospace; color: #1e293b; }
        .rest-table td.method-name { font-family: 'IBM Plex Sans', sans-serif; color: #374151; font-weight: 600; max-width: 260px; word-break: break-all; }
        .rest-table tr:last-child td { border-bottom: none; }

        /* ── Error state ─────────────────────────────────────────────────── */
        .error-box {
            background: #fff1f2;
            border: 1px solid #fecdd3;
            border-radius: 8px;
            padding: 1rem 1.25rem;
            color: #be123c;
            font-size: 0.88rem;
            margin: 1rem 1.2rem;
        }

        /* ── Footer ──────────────────────────────────────────────────────── */
        .footer {
            text-align: center;
            padding: 1.2rem;
            color: #64748b;
            font-size: 0.82rem;
            border-top: 1px solid var(--border);
            background: #fff;
            margin-top: 2rem;
        }
    </style>
</head>
<body>

<!-- ── Header ──────────────────────────────────────────────────────────── -->
<div class="header">
    <a href="${pageContext.request.contextPath}/catalogo" class="brand" title="Volver al Catálogo">
        <span>🛒 PedjasApp</span>
        <span class="badge">Liberty</span>
    </a>
    <nav class="nav">
        <span style="color:#d0e2ff; font-size:0.95rem; font-weight:500;">👤 ${sessionScope.nombre}</span>
        <a href="${pageContext.request.contextPath}/catalogo"        class="nav-link">🏷️ Catálogo</a>
        <a href="${pageContext.request.contextPath}/pedidos/lista"   class="nav-link">📦 Pedidos</a>
        <a href="${pageContext.request.contextPath}/info"            class="nav-link">ℹ️ Info</a>
        <a href="${pageContext.request.contextPath}/metrics-dashboard" class="nav-link active">📊 Métricas</a>
        <a href="${pageContext.request.contextPath}/inicio?accion=logout" class="nav-link logout">Cerrar Sesión</a>
    </nav>
</div>

<!-- ── Content ──────────────────────────────────────────────────────────── -->
<div class="content">

    <div class="page-header">
        <div class="page-header-left">
            <h2>📊 Dashboard de Métricas</h2>
            <p>MicroProfile Metrics 5.0 — WebSphere Liberty 26.0.0.9 — actualización automática cada 5 s</p>
        </div>
        <div class="refresh-controls">
            <span class="refresh-status"><span class="dot"></span><span id="lastUpdate">—</span></span>
            <button class="btn-refresh" onclick="fetchMetrics()">↻ Actualizar</button>
        </div>
    </div>

    <!-- ── KPI row ──────────────────────────────────────────────────────── -->
    <div class="kpi-row" id="kpiRow">
        <div class="kpi-card blue">  <div class="kpi-icon">🧠</div><div class="kpi-label">Heap en uso</div><div class="kpi-value" id="kpi-heap">—</div><div class="kpi-unit">MB</div></div>
        <div class="kpi-card green"> <div class="kpi-icon">⏱️</div><div class="kpi-label">Uptime</div>   <div class="kpi-value" id="kpi-uptime">—</div><div class="kpi-unit">min</div></div>
        <div class="kpi-card yellow"><div class="kpi-icon">🧵</div><div class="kpi-label">Hilos</div>    <div class="kpi-value" id="kpi-threads">—</div><div class="kpi-unit">activos</div></div>
        <div class="kpi-card purple"><div class="kpi-icon">⚙️</div><div class="kpi-label">CPU proceso</div><div class="kpi-value" id="kpi-cpu">—</div><div class="kpi-unit">%</div></div>
        <div class="kpi-card teal">  <div class="kpi-icon">📡</div><div class="kpi-label">Clases cargadas</div><div class="kpi-value" id="kpi-classes">—</div><div class="kpi-unit">clases</div></div>
        <div class="kpi-card blue">  <div class="kpi-icon">🗄️</div><div class="kpi-label">Conexiones BD</div><div class="kpi-value" id="kpi-dbconn">—</div><div class="kpi-unit">libres</div></div>
    </div>

    <!-- ── Row 1: Memory + Threads ──────────────────────────────────────── -->
    <div class="dash-grid">

        <div class="dash-card">
            <div class="dash-card-header"><span>🧠</span><h3>Memoria JVM (Heap)</h3></div>
            <div class="bar-list" id="memBars">
                <div class="error-box">Cargando…</div>
            </div>
        </div>

        <div class="dash-card">
            <div class="dash-card-header"><span>🧵</span><h3>Hilos y Pool de Threads</h3></div>
            <table class="metric-table" id="threadTable">
                <tr><td class="ml">Cargando…</td><td class="mv">—</td></tr>
            </table>
        </div>

    </div>

    <!-- ── Row 2: GC + Connection Pool ─────────────────────────────────── -->
    <div class="dash-grid">

        <div class="dash-card">
            <div class="dash-card-header"><span>🗑️</span><h3>Garbage Collection</h3></div>
            <table class="metric-table" id="gcTable">
                <tr><td class="ml">Cargando…</td><td class="mv">—</td></tr>
            </table>
        </div>

        <div class="dash-card">
            <div class="dash-card-header"><span>🗄️</span><h3>Connection Pool — JDBC</h3></div>
            <table class="metric-table" id="dbTable">
                <tr><td class="ml">Cargando…</td><td class="mv">—</td></tr>
            </table>
        </div>

    </div>

    <!-- ── Row 3: Servlet response times ────────────────────────────────── -->
    <div class="dash-grid">
        <div class="dash-card full">
            <div class="dash-card-header"><span>🌐</span><h3>Tiempo medio de respuesta por Servlet (ms)</h3></div>
            <div class="bar-list" id="servletBars">
                <div class="error-box">Cargando…</div>
            </div>
        </div>
    </div>

    <!-- ── Row 4: REST API ──────────────────────────────────────────────── -->
    <div class="dash-grid">
        <div class="dash-card full">
            <div class="dash-card-header"><span>📡</span><h3>REST API — Invocaciones y Latencia (JAX-RS)</h3></div>
            <div style="overflow-x:auto;">
                <table class="rest-table" id="restTable">
                    <thead>
                        <tr>
                            <th>Método</th>
                            <th style="text-align:right">Llamadas</th>
                            <th style="text-align:right">Total (s)</th>
                            <th style="text-align:right">Promedio (ms)</th>
                            <th style="text-align:right">Errores</th>
                        </tr>
                    </thead>
                    <tbody id="restBody">
                        <tr><td colspan="5" style="text-align:center; padding:1.2rem; color:#64748b;">Cargando…</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- ── Row 5: Sessions ──────────────────────────────────────────────── -->
    <div class="dash-grid">
        <div class="dash-card">
            <div class="dash-card-header"><span>🔐</span><h3>Sesiones HTTP</h3></div>
            <table class="metric-table" id="sessionTable">
                <tr><td class="ml">Cargando…</td><td class="mv">—</td></tr>
            </table>
        </div>

        <div class="dash-card">
            <div class="dash-card-header"><span>⚡</span><h3>CPU y Sistema</h3></div>
            <table class="metric-table" id="cpuTable">
                <tr><td class="ml">Cargando…</td><td class="mv">—</td></tr>
            </table>
        </div>
    </div>

</div><!-- /content -->

<div class="footer">
    Java Modernization Workshop — WebSphere Liberty 26.0.0.9 &amp; Jakarta EE 10
</div>

<script>
// ─── Prometheus text parser ────────────────────────────────────────────────
function parsePrometheus(text) {
    const metrics = {};
    for (const line of text.split('\n')) {
        if (line.startsWith('#') || !line.trim()) continue;
        const braceOpen = line.indexOf('{');
        let key, labelsStr = '', value;
        if (braceOpen !== -1) {
            const braceClose = line.indexOf('}', braceOpen);
            key       = line.slice(0, braceOpen).trim();
            labelsStr = line.slice(braceOpen + 1, braceClose);
            value     = parseFloat(line.slice(braceClose + 2).trim().split(' ')[0]);
        } else {
            const spaceIdx = line.lastIndexOf(' ');
            key   = line.slice(0, spaceIdx).trim();
            value = parseFloat(line.slice(spaceIdx + 1).split(' ')[0]);
        }
        if (isNaN(value)) continue;
        if (!metrics[key]) metrics[key] = [];
        const labels = {};
        if (labelsStr) {
            for (const pair of labelsStr.matchAll(/(\w+)="([^"]*)"/g)) {
                labels[pair[1]] = pair[2];
            }
        }
        metrics[key].push({ labels, value });
    }
    return metrics;
}

// Return first value matching label predicate, or fallback
function get(m, key, pred = () => true, fallback = 0) {
    if (!m[key]) return fallback;
    const hit = m[key].find(e => pred(e.labels));
    return hit ? hit.value : fallback;
}

// All values for key matching predicate
function getAll(m, key, pred = () => true) {
    if (!m[key]) return [];
    return m[key].filter(e => pred(e.labels));
}

// ─── Helpers ──────────────────────────────────────────────────────────────
const fmt  = (n, d = 1) => n.toFixed(d);
const fmtMs = s => (s * 1000).toFixed(1);
const MB    = b => (b / 1048576).toFixed(1);

function bar(pct, cls) {
    cls = cls || '';
    const w = Math.min(100, Math.max(0, pct));
    return '<div class="bar-track"><div class="bar-fill ' + cls + '" style="width:' + w + '%"></div></div>';
}

function barItem(name, value, unit, pct, cls) {
    cls = cls || '';
    return '<div class="bar-item">'
        + '<div class="bar-label-row">'
        + '<span class="bar-name">' + name + '</span>'
        + '<span class="bar-val">' + value + ' ' + unit + '</span>'
        + '</div>'
        + bar(pct, cls)
        + '</div>';
}

function tableRow(label, value) {
    return '<tr><td class="ml">' + label + '</td><td class="mv">' + value + '</td></tr>';
}

// ─── Render ───────────────────────────────────────────────────────────────
function render(m) {
    // ── KPIs ──────────────────────────────────────────────────────────────
    const heapUsed  = get(m, 'memory_usedHeap_bytes');
    const heapMax   = get(m, 'memory_maxHeap_bytes') || 1;
    const uptimeSec = get(m, 'jvm_uptime_seconds');
    const threads   = get(m, 'thread_count');
    const cpuPct    = get(m, 'cpu_processCpuUtilization_percent') * 100;
    const classes   = get(m, 'classloader_loadedClasses_count');
    const dbFree    = get(m, 'connectionpool_freeConnections', l => l.datasource === 'jdbc_pedjasappDS');

    document.getElementById('kpi-heap').textContent    = MB(heapUsed);
    document.getElementById('kpi-uptime').textContent  = (uptimeSec / 60).toFixed(1);
    document.getElementById('kpi-threads').textContent = threads.toFixed(0);
    document.getElementById('kpi-cpu').textContent     = cpuPct.toFixed(2);
    document.getElementById('kpi-classes').textContent = classes.toFixed(0);
    document.getElementById('kpi-dbconn').textContent  = dbFree.toFixed(0);

    // ── Memory bars ────────────────────────────────────────────────────────
    const heapCommit = get(m, 'memory_committedHeap_bytes');
    const heapPct    = heapMax > 0 ? (heapUsed / heapMax) * 100 : 0;
    const commitPct  = heapMax > 0 ? (heapCommit / heapMax) * 100 : 0;
    const memCls     = heapPct > 80 ? 'orange' : heapPct > 60 ? 'teal' : '';
    document.getElementById('memBars').innerHTML =
        barItem('Heap en uso',   MB(heapUsed)   + ' / ' + MB(heapMax),   'MB', heapPct, memCls) +
        barItem('Heap asignado', MB(heapCommit) + ' / ' + MB(heapMax),   'MB', commitPct, 'teal') +
        barItem('% uso heap',    heapPct.toFixed(1),                      '%',  heapPct, memCls);

    // ── Thread table ───────────────────────────────────────────────────────
    const tDaemon  = get(m, 'thread_daemon_count');
    const tMax     = get(m, 'thread_max_count');
    const tpActive = get(m, 'threadpool_activeThreads');
    const tpSize   = get(m, 'threadpool_size');
    const tpPct    = tpSize > 0 ? (tpActive / tpSize) * 100 : 0;
    document.getElementById('threadTable').innerHTML =
        tableRow('Hilos totales',           '<span class="tag blue">' + threads.toFixed(0) + '</span>') +
        tableRow('Hilos daemon',            tDaemon.toFixed(0)) +
        tableRow('Máximo histórico',        tMax.toFixed(0)) +
        tableRow('Pool activos / tamaño',   tpActive.toFixed(0) + ' / ' + tpSize.toFixed(0)) +
        tableRow('Utilización pool',        '<span class="tag ' + (tpPct > 80 ? 'orange' : 'green') + '">' + tpPct.toFixed(1) + '%</span>');

    // ── GC table ───────────────────────────────────────────────────────────
    const gcGlobal   = get(m, 'gc_time_seconds',     l => l.name === 'global');
    const gcScav     = get(m, 'gc_time_seconds',     l => l.name === 'scavenge');
    const gcTotalG   = get(m, 'gc_total',            l => l.name === 'global');
    const gcTotalS   = get(m, 'gc_total',            l => l.name === 'scavenge');
    const gcCycleG   = get(m, 'gc_time_per_cycle_seconds', l => l.name === 'global') * 1000;
    const gcCycleS   = get(m, 'gc_time_per_cycle_seconds', l => l.name === 'scavenge') * 1000;
    document.getElementById('gcTable').innerHTML =
        tableRow('GC Global — tiempo total',   gcGlobal.toFixed(3) + ' s') +
        tableRow('GC Global — ciclos',         gcTotalG.toFixed(0)) +
        tableRow('GC Global — ms/ciclo',       '<span class="tag blue">' + gcCycleG.toFixed(1) + ' ms</span>') +
        tableRow('GC Scavenge — tiempo total', gcScav.toFixed(3) + ' s') +
        tableRow('GC Scavenge — ciclos',       gcTotalS.toFixed(0)) +
        tableRow('GC Scavenge — ms/ciclo',     '<span class="tag blue">' + gcCycleS.toFixed(1) + ' ms</span>');

    // ── DB / Connection pool ───────────────────────────────────────────────
    const dbInUse   = get(m, 'connectionpool_connectionHandles',  l => l.datasource === 'jdbc_pedjasappDS');
    const dbManaged = get(m, 'connectionpool_managedConnections', l => l.datasource === 'jdbc_pedjasappDS');
    const dbCreated = get(m, 'connectionpool_create_total',       l => l.datasource === 'jdbc_pedjasappDS');
    const dbQueued  = get(m, 'connectionpool_queuedRequests_total', l => l.datasource === 'jdbc_pedjasappDS');
    const dbWait    = get(m, 'connectionpool_waitTime_per_queuedRequest_seconds', l => l.datasource === 'jdbc_pedjasappDS') * 1000;
    const dbInUse2  = get(m, 'connectionpool_inUseTime_per_usedConnection_seconds', l => l.datasource === 'jdbc_pedjasappDS') * 1000;
    document.getElementById('dbTable').innerHTML =
        tableRow('DataSource',              '<span class="tag blue">jdbc/pedjasappDS</span>') +
        tableRow('Conexiones libres',       '<span class="tag green">' + dbFree.toFixed(0) + '</span>') +
        tableRow('Conexiones en uso',       dbInUse.toFixed(0)) +
        tableRow('Conexiones gestionadas',  dbManaged.toFixed(0)) +
        tableRow('Creadas (total)',          dbCreated.toFixed(0)) +
        tableRow('Solicitudes encoladas',   dbQueued.toFixed(0)) +
        tableRow('Espera promedio',         dbWait.toFixed(1) + ' ms') +
        tableRow('Tiempo en uso promedio',  dbInUse2.toFixed(1) + ' ms');

    // ── Servlet bars ───────────────────────────────────────────────────────
    const servletEntries = getAll(m, 'servlet_request_elapsedTime_per_request_seconds');
    const appServlets = servletEntries
        .filter(e => e.labels.servlet && e.labels.servlet.startsWith('pedjasapp_'))
        .map(e => ({
            name: e.labels.servlet
                .replace('pedjasapp_com_pedjas_web_', '')
                .replace('pedjasapp_com_pedjas_rest_', 'REST/')
                .replace('pedjasapp__views_', 'JSP/')
                .replace('_', ' → ')
                .replace('Servlet', '')
                .trim(),
            ms: e.value * 1000
        }))
        .sort((a, b) => b.ms - a.ms);

    const maxMs = appServlets.reduce((mx, e) => Math.max(mx, e.ms), 1);
    const colors = ['', 'teal', 'green', 'orange', 'purple', '', 'teal'];
    document.getElementById('servletBars').innerHTML =
        appServlets.length === 0
            ? '<div class="error-box">Sin datos de servlets todavía.</div>'
            : appServlets.map((s, i) =>
                barItem(s.name, s.ms.toFixed(1), 'ms', (s.ms / maxMs) * 100, colors[i % colors.length])
              ).join('');

    // ── REST table ─────────────────────────────────────────────────────────
    const restCounts   = getAll(m, 'REST_request_seconds_count');
    const restSums     = {};
    for (const e of getAll(m, 'REST_request_seconds_sum')) {
        restSums[e.labels.class + '#' + e.labels.method] = e.value;
    }
    const restErrors   = {};
    for (const e of getAll(m, 'REST_request_unmappedException_total')) {
        restErrors[e.labels.class + '#' + e.labels.method] = e.value;
    }

    const restRows = restCounts.map(e => {
        const k      = e.labels.class + '#' + e.labels.method;
        const count  = e.value;
        const total  = restSums[k]  || 0;
        const errors = restErrors[k] || 0;
        const avg    = count > 0 ? (total / count * 1000) : 0;
        const name   = (e.labels.class || '').replace('com.pedjas.rest.', '') +
                       '.' + (e.labels.method || '').replace(/_java\.lang\./g, '(').replace(/_/g, ', ');
        const avgTag   = '<span class="tag ' + (avg > 100 ? 'orange' : 'green') + '">' + avg.toFixed(1) + '</span>';
        const errCell  = errors > 0 ? '<span class="tag orange">' + errors + '</span>' : '0';
        return '<tr>'
            + '<td class="method-name">' + name + '</td>'
            + '<td style="text-align:right">' + count.toFixed(0) + '</td>'
            + '<td style="text-align:right">' + total.toFixed(4) + '</td>'
            + '<td style="text-align:right">' + avgTag + '</td>'
            + '<td style="text-align:right">' + errCell + '</td>'
            + '</tr>';
    });
    document.getElementById('restBody').innerHTML =
        restRows.length ? restRows.join('') :
        '<tr><td colspan="5" style="text-align:center; padding:1.2rem; color:#64748b;">Sin invocaciones REST todavía.</td></tr>';

    // ── Sessions ───────────────────────────────────────────────────────────
    const sessActive  = get(m, 'session_activeSessions');
    const sessLive    = get(m, 'session_liveSessions');
    const sessCreated = get(m, 'session_create_total');
    const sessInv     = get(m, 'session_invalidated_total');
    const sessTimeout = get(m, 'session_invalidatedbyTimeout_total');
    document.getElementById('sessionTable').innerHTML =
        tableRow('Sesiones activas',          '<span class="tag ' + (sessActive > 0 ? 'green' : 'blue') + '">' + sessActive.toFixed(0) + '</span>') +
        tableRow('Sesiones vivas',             sessLive.toFixed(0)) +
        tableRow('Sesiones creadas (total)',   sessCreated.toFixed(0)) +
        tableRow('Sesiones invalidadas',       sessInv.toFixed(0)) +
        tableRow('Invalidadas por timeout',    sessTimeout.toFixed(0));

    // ── CPU & System ───────────────────────────────────────────────────────
    const cpuLoad   = get(m, 'cpu_processCpuLoad_percent') * 100;
    const cpuTime   = get(m, 'cpu_processCpuTime_seconds');
    const cpuProcs  = get(m, 'cpu_availableProcessors');
    const sysLoad   = get(m, 'cpu_systemLoadAverage');
    document.getElementById('cpuTable').innerHTML =
        tableRow('CPU proceso (utilización)', '<span class="tag ' + (cpuPct > 50 ? 'orange' : 'green') + '">' + cpuPct.toFixed(3) + '%</span>') +
        tableRow('CPU proceso (carga)',        cpuLoad.toFixed(3) + '%') +
        tableRow('Tiempo CPU proceso',         cpuTime.toFixed(2) + ' s') +
        tableRow('Procesadores disponibles',   cpuProcs.toFixed(0)) +
        tableRow('Carga media del sistema',    sysLoad.toFixed(2));
}

// ─── Fetch loop ───────────────────────────────────────────────────────────
async function fetchMetrics() {
    try {
        const resp = await fetch('/metrics', { cache: 'no-store' });
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        const text = await resp.text();
        const m    = parsePrometheus(text);
        render(m);
        const now = new Date();
        document.getElementById('lastUpdate').textContent =
            now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch (err) {
        console.error('Error al obtener métricas:', err);
        document.getElementById('lastUpdate').textContent = 'Error: ' + err.message;
    }
}

fetchMetrics();
setInterval(fetchMetrics, 5000);
</script>

</body>
</html>
