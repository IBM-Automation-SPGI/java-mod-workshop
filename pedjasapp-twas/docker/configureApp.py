##############################################################################
# configureApp.py — Script Jython para desplegar PedjasApp en tWAS via wsadmin
#
# Este script configura los recursos necesarios (DataSource H2, JMS) y despliega
# el EAR de PedjasApp en WebSphere Application Server 9.0.
#
# Uso: ejecutado automáticamente por start_server.sh dentro del contenedor Docker.
##############################################################################

import sys

print("=== PedjasApp tWAS — Configuración automática ===")

cell   = AdminControl.getCell()
node   = AdminControl.getNode()
server = "server1"

# ── 1. Instalar el EAR ──────────────────────────────────────────────────────
earPath = "/tmp/pedjasapp.ear"
print("Instalando EAR desde: " + earPath)

installOptions = (
    "-appname PedjasApp "
    "-contextroot /pedjasapp "
    "-usedefaultbindings "
    "-defaultbinding.virtual.host default_host"
)

AdminApp.install(earPath, "[ " + installOptions + " ]")
print("EAR instalado correctamente.")

# ── 2. Guardar la configuración ──────────────────────────────────────────────
AdminConfig.save()
print("Configuración guardada.")

# ── 3. Iniciar la aplicación ─────────────────────────────────────────────────
appManager = AdminControl.queryNames(
    "cell=" + cell + ",node=" + node +
    ",type=ApplicationManager,process=" + server + ",*"
)
AdminControl.invoke(appManager, "startApplication", "PedjasApp")
print("PedjasApp iniciada. Accede en: http://localhost:9080/pedjasapp/")
