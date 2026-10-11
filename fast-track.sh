#!/usr/bin/env bash
# ==============================================================================
# fast-track.sh — Script para saltar o sincronizar rápidamente cualquier lab
# ==============================================================================
set -euo pipefail

TARGET_LAB="${1:-}"

if [ -z "$TARGET_LAB" ]; then
    echo "Uso: $0 [lab2|lab3|lab4|lab5|lab6|2|3|4|5|6]"
    echo ""
    echo "Opciones:"
    echo "  lab2 | 2  - Prepara el EAR empaquetado para escanear en AMA"
    echo "  lab3 | 3  - Prepara los bundles de análisis de AMA ya generados (*.zip)"
    echo "  lab4 | 4  - Compila y deja listo pedjasapp.war para WebSphere Liberty"
    echo "  lab5 | 5  - Levanta PostgreSQL y PedjasApp Liberty con docker-compose"
    echo "  lab6 | 6  - Valida los manifiestos de Kubernetes/OpenShift (k8s/)"
    exit 1
fi

case "$TARGET_LAB" in
    lab2|2)
        echo "🚀 [Fast-Track] Preparando EAR legado para análisis en AMA..."
        if [ ! -f "pedjasapp-para-ama.ear" ]; then
            cd pedjasapp-twas && mvn clean package -DskipTests && cd ..
            cp pedjasapp-twas/pedjasapp-ear/target/pedjasapp.ear pedjasapp-para-ama.ear
        fi
        echo "✅ EAR listo en: ./pedjasapp-para-ama.ear"
        ;;
    lab3|3|lab3b|3b)
        echo "🚀 [Fast-Track] Verificando bundles de colección para AMA..."
        if [ ! -f "pedjasapp-collection.zip" ]; then
            echo "⚠️ No se encontró pedjasapp-collection.zip localmente."
        else
            echo "✅ Bundle listo: pedjasapp-collection.zip"
        fi
        ;;
    lab4|4)
        echo "🚀 [Fast-Track] Compilando aplicación modernizada Liberty (WAR)..."
        cd pedjasapp-liberty && mvn clean package -DskipTests && cd ..
        echo "✅ WAR generado: pedjasapp-liberty/target/pedjasapp.war"
        ;;
    lab5|5)
        echo "🚀 [Fast-Track] Desplegando PostgreSQL y WebSphere Liberty..."
        cd pedjasapp-liberty && mvn clean package -DskipTests && cd ..
        if command -v docker-compose &>/dev/null; then
            docker-compose up -d
        elif command -v podman-compose &>/dev/null; then
            podman-compose up -d
        elif command -v docker &>/dev/null; then
            docker compose up -d
        else
            echo "ℹ️ Inicia los contenedores con Podman/Docker según el Lab 4."
        fi
        echo "✅ Entorno levantado. Ejecuta ./verify-lab.sh 5 para comprobar."
        ;;
    lab6|6)
        echo "🚀 [Fast-Track] Validando manifiestos de Kubernetes/OpenShift..."
        if [ -f "k8s/postgres-deployment.yaml" ] && [ -f "k8s/open-liberty-application.yaml" ]; then
            echo "✅ Manifiestos listos en el directorio k8s/"
        else
            echo "❌ Faltan archivos en el directorio k8s/"
            exit 1
        fi
        ;;
    *)
        echo "Opción no reconocida: $TARGET_LAB"
        echo "Uso: $0 [lab2|lab3|lab4|lab5|lab6|2|3|4|5|6]"
        exit 1
        ;;
esac
