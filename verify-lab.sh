#!/usr/bin/env bash
# ==============================================================================
# verify-lab.sh — Script interactivo de verificación paso a paso del workshop
# ==============================================================================
set -euo pipefail

# Colores para salida de terminal
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

pass() { echo -e "  [${GREEN}✅ PASS${NC}] $1"; }
fail() { echo -e "  [${RED}❌ FAIL${NC}] $1"; }
info() { echo -e "  [${BLUE}ℹ️ INFO${NC}] $1"; }
warn() { echo -e "  [${YELLOW}⚠️ WARN${NC}] $1"; }

LAB="${1:-all}"

echo -e "\n${BLUE}════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  VERIFICADOR DE LABORATORIO — JAVA MODERNIZATION WORKSHOP          ${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}\n"

check_cmd() {
    if command -v "$1" &> /dev/null; then
        pass "Comando disponible: $1 ($($1 --version 2>&1 | head -n 1))"
    else
        fail "Comando no encontrado: $1. Revisa los requisitos del Lab 0."
    fi
}

# ------------------------------------------------------------------------------
# LAB 0: Requisitos Previos
# ------------------------------------------------------------------------------
verify_lab0() {
    echo -e "\n${YELLOW}--- Verificando Lab 0: Entorno y Herramientas ---${NC}"
    check_cmd java
    check_cmd mvn
    if command -v podman &> /dev/null; then
        pass "Contenedores: Podman detectado ($(podman --version))"
    elif command -v docker &> /dev/null; then
        pass "Contenedores: Docker detectado ($(docker --version))"
    else
        fail "No se encontró Docker ni Podman instalados."
    fi
    check_cmd curl
}

# ------------------------------------------------------------------------------
# LAB 1: Despliegue en tWAS
# ------------------------------------------------------------------------------
verify_lab1() {
    echo -e "\n${YELLOW}--- Verificando Lab 1: tWAS y PedjasApp Legada ---${NC}"
    if [ -f "pedjasapp-twas/pedjasapp-ear/target/pedjasapp.ear" ] || [ -f "pedjasapp-para-ama.ear" ]; then
        pass "Artefacto EAR detectado (pedjasapp.ear)"
    else
        warn "No se encuentra pedjasapp.ear compilado en pedjasapp-twas/."
    fi

    if curl -s -k -m 3 "https://localhost:9043/ibm/console/login.do" &> /dev/null; then
        pass "Consola administrativa tWAS respondiendo en https://localhost:9043/ibm/console/"
    else
        info "Contenedor tWAS (pedjasapp-twas) no detectado en localhost:9043 (opcional si ya fue analizado)."
    fi
}

# ------------------------------------------------------------------------------
# LAB 2: Análisis con AMA
# ------------------------------------------------------------------------------
verify_lab2() {
    echo -e "\n${YELLOW}--- Verificando Lab 2: AMA / Transformation Advisor ---${NC}"
    if [ -f "pedjasapp-collection.zip" ] || [ -f "AppSrv01-collection.zip" ]; then
        pass "Bundle de colección Data Collector detectado (*.zip)"
    else
        warn "No se ha generado el bundle .zip con Data Collector."
    fi

    if curl -s -k -m 3 "https://localhost:2220/lands_advisor/advisor/v2/workspaces" &> /dev/null; then
        pass "API REST de IBM AMA respondiendo en https://localhost:2220"
        WS_COUNT=$(curl -s -k "https://localhost:2220/lands_advisor/advisor/v2/workspaces" | grep -o '"id":' | wc -l || echo "0")
        info "Total workspaces en AMA: ${WS_COUNT}"
    else
        warn "Servidor AMA no detectado en https://localhost:2220 (verificar contenedor taserver)."
    fi
}

# ------------------------------------------------------------------------------
# LAB 3 & 3B: Modernización de Código
# ------------------------------------------------------------------------------
verify_lab3() {
    echo -e "\n${YELLOW}--- Verificando Lab 3 / 3B: Código Fuente Modernizado ---${NC}"
    if [ -f "pedjasapp-liberty/pom.xml" ]; then
        pass "Proyecto Maven Liberty presente (pedjasapp-liberty/pom.xml)"
    else
        fail "Falta pedjasapp-liberty/pom.xml"
    fi

    if grep -q "jakarta.persistence" "pedjasapp-liberty/src/main/java/com/pedjas/entity/Pedido.java" 2>/dev/null; then
        pass "Entidades modernizadas a Jakarta Persistence (JPA)"
    else
        fail "La entidad Pedido.java no utiliza el paquete jakarta.persistence."
    fi

    if grep -q "jakarta.ejb" "pedjasapp-liberty/src/main/java/com/pedjas/service/PedidoService.java" 2>/dev/null; then
        pass "Servicios EJB modernizados a Jakarta Enterprise Beans"
    else
        fail "El servicio PedidoService.java no utiliza jakarta.ejb."
    fi
}

# ------------------------------------------------------------------------------
# LAB 4: Despliegue en Liberty
# ------------------------------------------------------------------------------
verify_lab4() {
    echo -e "\n${YELLOW}--- Verificando Lab 4: Configuración y Despliegue Liberty ---${NC}"
    if [ -f "pedjasapp-liberty/target/pedjasapp.war" ]; then
        pass "WAR modernizado compilado: pedjasapp-liberty/target/pedjasapp.war"
    else
        warn "WAR no compilado aún. Ejecuta: cd pedjasapp-liberty && mvn clean package"
    fi

    if [ -f "pedjasapp-liberty/server.xml" ]; then
        pass "Archivo server.xml de Liberty presente"
    else
        fail "No se encuentra pedjasapp-liberty/server.xml"
    fi

    # Verificar conectividad con PostgreSQL
    if nc -z localhost 5432 2>/dev/null || (command -v pg_isready &>/dev/null && pg_isready -h localhost -p 5432 &>/dev/null); then
        pass "PostgreSQL escuchando en localhost:5432"
    else
        warn "PostgreSQL no responde en el puerto 5432."
    fi
}

# ------------------------------------------------------------------------------
# LAB 5: Validación
# ------------------------------------------------------------------------------
verify_lab5() {
    echo -e "\n${YELLOW}--- Verificando Lab 5: Salud, OpenAPI y Funcionamiento E2E ---${NC}"
    
    # Probar endpoint Liberty HTTP (9080 o 9081)
    PORT=9080
    if curl -s -m 2 "http://localhost:9081/pedjasapp/" &>/dev/null; then
        PORT=9081
    fi

    if curl -s -m 3 "http://localhost:${PORT}/pedjasapp/" &>/dev/null; then
        pass "PedjasApp respondiendo en http://localhost:${PORT}/pedjasapp/"
    else
        fail "No se pudo conectar a PedjasApp en http://localhost:${PORT}/pedjasapp/"
    fi

    # Health Live
    LIVE_STATUS=$(curl -s -m 3 "http://localhost:${PORT}/health/live" 2>/dev/null | grep -o '"status":"UP"' || echo "")
    if [ -n "$LIVE_STATUS" ]; then
        pass "MicroProfile Liveness Check (/health/live) -> UP"
    else
        fail "Liveness Check no reporta UP en http://localhost:${PORT}/health/live"
    fi

    # Health Ready
    READY_STATUS=$(curl -s -m 3 "http://localhost:${PORT}/health/ready" 2>/dev/null | grep -o '"status":"UP"' || echo "")
    if [ -n "$READY_STATUS" ]; then
        pass "MicroProfile Readiness Check (/health/ready) -> UP"
    else
        fail "Readiness Check no reporta UP en http://localhost:${PORT}/health/ready"
    fi

    # OpenAPI UI
    if curl -s -m 3 "http://localhost:${PORT}/openapi/ui/" | grep -qi "swagger" 2>/dev/null; then
        pass "MicroProfile OpenAPI / Swagger UI activo en http://localhost:${PORT}/openapi/ui/"
    else
        warn "Swagger UI no detectado en http://localhost:${PORT}/openapi/ui/"
    fi
}

# ------------------------------------------------------------------------------
# Dispatcher
# ------------------------------------------------------------------------------
case "$LAB" in
    lab0|0) verify_lab0 ;;
    lab1|1) verify_lab1 ;;
    lab2|2) verify_lab2 ;;
    lab3|3|lab3b|3b) verify_lab3 ;;
    lab4|4) verify_lab4 ;;
    lab5|5) verify_lab5 ;;
    all)
        verify_lab0
        verify_lab1
        verify_lab2
        verify_lab3
        verify_lab4
        verify_lab5
        ;;
    *)
        echo "Uso: $0 [lab0|lab1|lab2|lab3|lab4|lab5|all]"
        exit 1
        ;;
esac

echo -e "\n${GREEN}════════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Verificación completada para: ${LAB}                             ${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════════════${NC}\n"
