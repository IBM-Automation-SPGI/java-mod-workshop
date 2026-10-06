#!/usr/bin/env bash
# ============================================================
#  audit-ux.sh — Auditoría UX/UI de PedjasApp Liberty
#  Uso: bash .bob/skills/ux-ui-java-workshop/audit-ux.sh
#  Salida: tabla de diagnóstico por fichero + puntuación total
# ============================================================
set -euo pipefail

# ── Colores de terminal ─────────────────────────────────────
RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

VIEWS_DIR="pedjasapp-liberty/src/main/webapp/views"
STYLES_DIR="pedjasapp-liberty/src/main/webapp/styles"
DOCS_CSS="docs/styles"

TOTAL_CHECKS=0
PASS=0
FAIL=0
WARN=0

# ── Helpers ─────────────────────────────────────────────────
check() {
  local label="$1" file="$2" pattern="$3" mode="${4:-present}"
  TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

  if [ ! -f "$file" ]; then
    printf "  ${YELLOW}[SKIP]${RESET}  %-55s → fichero no encontrado\n" "$label"
    WARN=$((WARN + 1))
    return
  fi

  local found=0
  grep -qE "$pattern" "$file" 2>/dev/null && found=1

  if [ "$mode" = "present" ]; then
    if [ "$found" -eq 1 ]; then
      printf "  ${GREEN}[OK]${RESET}    %-55s\n" "$label"
      PASS=$((PASS + 1))
    else
      printf "  ${RED}[FALLO]${RESET} %-55s\n" "$label"
      FAIL=$((FAIL + 1))
    fi
  else  # mode = absent (no debería estar)
    if [ "$found" -eq 0 ]; then
      printf "  ${GREEN}[OK]${RESET}    %-55s\n" "$label"
      PASS=$((PASS + 1))
    else
      printf "  ${RED}[FALLO]${RESET} %-55s\n" "$label"
      FAIL=$((FAIL + 1))
    fi
  fi
}

section() {
  echo ""
  printf "${BOLD}${CYAN}▶ %s${RESET}\n" "$1"
  echo "  $(printf '─%.0s' {1..65})"
}

# ── Cabecera ────────────────────────────────────────────────
echo ""
printf "${BOLD}╔══════════════════════════════════════════════════════════════╗${RESET}\n"
printf "${BOLD}║       AUDITORÍA UX/UI — PedjasApp Liberty                    ║${RESET}\n"
printf "${BOLD}║       Estándar: WCAG 2.2 AA + IBM Carbon + Nielsen           ║${RESET}\n"
printf "${BOLD}╚══════════════════════════════════════════════════════════════╝${RESET}\n"
echo ""

# ── 1. Estructura de ficheros ───────────────────────────────
section "1. ESTRUCTURA DE FICHEROS"

if [ -d "$VIEWS_DIR" ]; then
  printf "  ${GREEN}[OK]${RESET}    Directorio de vistas: %s\n" "$VIEWS_DIR"
  PASS=$((PASS + 1))
else
  printf "  ${RED}[FALLO]${RESET} Directorio de vistas no encontrado: %s\n" "$VIEWS_DIR"
  FAIL=$((FAIL + 1))
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

if [ -f "$STYLES_DIR/tokens.css" ]; then
  printf "  ${GREEN}[OK]${RESET}    tokens.css centralizado existe\n"
  PASS=$((PASS + 1))
else
  printf "  ${RED}[FALLO]${RESET} tokens.css NO existe — debe crearse en %s/tokens.css\n" "$STYLES_DIR"
  FAIL=$((FAIL + 1))
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

# Listar vistas encontradas
echo ""
printf "  ${BOLD}Vistas JSP encontradas:${RESET}\n"
for jsp in "$VIEWS_DIR"/*.jsp 2>/dev/null; do
  [ -f "$jsp" ] && printf "    • %s\n" "$(basename "$jsp")"
done

# ── 2. Metadatos HTML básicos ───────────────────────────────
section "2. METADATOS HTML BÁSICOS"
for view in inicio catalogo pedidos error404 error500; do
  f="$VIEWS_DIR/${view}.jsp"
  check "$view.jsp — <meta viewport>"        "$f" 'name="viewport"'
  check "$view.jsp — charset UTF-8"          "$f" 'charset.*UTF-8'
  check "$view.jsp — lang=\"es\""            "$f" 'lang="es"'
  check "$view.jsp — <title> presente"       "$f" '<title>'
done

# ── 3. Design tokens centralizados ─────────────────────────
section "3. DESIGN TOKENS CENTRALIZADOS"
for view in inicio catalogo pedidos error404 error500; do
  f="$VIEWS_DIR/${view}.jsp"
  check "$view.jsp — enlace a tokens.css"    "$f" 'tokens\.css'
done

# Detectar duplicación de tokens :root
echo ""
printf "  ${BOLD}Duplicación de :root {} por vista:${RESET}\n"
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
root_count=0
for jsp in "$VIEWS_DIR"/*.jsp 2>/dev/null; do
  [ -f "$jsp" ] && grep -q ':root' "$jsp" && root_count=$((root_count + 1))
done
if [ "$root_count" -gt 0 ]; then
  printf "  ${YELLOW}[AVISO]${RESET} Se encontraron bloques :root en %d vista(s) — deben eliminarse\n" "$root_count"
  WARN=$((WARN + 1))
else
  printf "  ${GREEN}[OK]${RESET}    Sin bloques :root duplicados\n"
  PASS=$((PASS + 1))
fi

# ── 4. Accesibilidad WCAG ───────────────────────────────────
section "4. ACCESIBILIDAD WCAG 2.2"
for view in inicio catalogo pedidos error404 error500; do
  f="$VIEWS_DIR/${view}.jsp"
  check "$view.jsp — skip-to-content (WCAG 2.4.1)"       "$f" 'skip-to-content|skip_to_content|saltar al contenido'
  check "$view.jsp — landmark <main> (WCAG 1.3.6)"       "$f" '<main'
  check "$view.jsp — role=\"banner\" (WCAG 1.3.6)"       "$f" 'role="banner"'
  check "$view.jsp — role=\"contentinfo\" (WCAG 1.3.6)"  "$f" 'role="contentinfo"'
done

# aria-hidden en emojis
section "4.1 EMOJIS SIN aria-hidden (WCAG 1.1.1)"
for view in inicio catalogo pedidos error404 error500; do
  f="$VIEWS_DIR/${view}.jsp"
  TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
  emoji_count=0
  [ -f "$f" ] && emoji_count=$(grep -oP '[\x{1F300}-\x{1FAFF}]|[\x{2600}-\x{26FF}]|[\x{2700}-\x{27BF}]' "$f" 2>/dev/null | wc -l || echo 0)
  if [ "$emoji_count" -gt 0 ]; then
    printf "  ${YELLOW}[AVISO]${RESET} %-50s → %d emoji(s) potencialmente sin aria-hidden\n" "$view.jsp" "$emoji_count"
    WARN=$((WARN + 1))
  else
    printf "  ${GREEN}[OK]${RESET}    %-50s → sin emojis detectados\n" "$view.jsp"
    PASS=$((PASS + 1))
  fi
done

# role="alert" en mensajes de error
section "4.2 MENSAJES DE ERROR ACCESIBLES (WCAG 4.1.3)"
for view in inicio catalogo pedidos; do
  f="$VIEWS_DIR/${view}.jsp"
  check "$view.jsp — role=\"alert\" en errores"  "$f" 'role="alert"'
done
check "pedidos.jsp — role=\"status\" en éxito"   "$VIEWS_DIR/pedidos.jsp" 'role="status"'

# Tablas accesibles
section "4.3 TABLAS ACCESIBLES (WCAG 1.3.1)"
for view in catalogo pedidos; do
  f="$VIEWS_DIR/${view}.jsp"
  check "$view.jsp — scope=\"col\" en <th>"     "$f" 'scope="col"'
  check "$view.jsp — <caption> descriptivo"     "$f" '<caption'
done

# focus-visible
section "4.4 FOCUS VISIBLE (WCAG 2.4.7 / 2.4.11)"
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
if [ -f "$STYLES_DIR/tokens.css" ] && grep -q 'focus-visible' "$STYLES_DIR/tokens.css" 2>/dev/null; then
  printf "  ${GREEN}[OK]${RESET}    focus-visible definido en tokens.css\n"
  PASS=$((PASS + 1))
else
  printf "  ${RED}[FALLO]${RESET} focus-visible NO definido en tokens.css\n"
  FAIL=$((FAIL + 1))
fi

# autocomplete en formularios de login
section "4.5 AUTOCOMPLETADO (WCAG 1.3.5)"
check "inicio.jsp — autocomplete=\"username\""           "$VIEWS_DIR/inicio.jsp" 'autocomplete="username"'
check "inicio.jsp — autocomplete=\"current-password\""  "$VIEWS_DIR/inicio.jsp" 'autocomplete="current-password"'

# ── 5. Modo oscuro ──────────────────────────────────────────
section "5. MODO OSCURO (prefers-color-scheme)"
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
if [ -f "$STYLES_DIR/tokens.css" ] && grep -q 'prefers-color-scheme' "$STYLES_DIR/tokens.css" 2>/dev/null; then
  printf "  ${GREEN}[OK]${RESET}    prefers-color-scheme implementado en tokens.css\n"
  PASS=$((PASS + 1))
else
  printf "  ${RED}[FALLO]${RESET} prefers-color-scheme NO implementado\n"
  FAIL=$((FAIL + 1))
fi

# ── 6. Consistencia visual ──────────────────────────────────
section "6. CONSISTENCIA VISUAL"

# Verificar que pedidos.jsp tiene IBM Plex Sans
check "pedidos.jsp — IBM Plex Sans referenciada"    "$VIEWS_DIR/pedidos.jsp" 'IBM Plex Sans'
# Verificar que las páginas de error usan IBM Plex Sans
check "error404.jsp — IBM Plex Sans referenciada"   "$VIEWS_DIR/error404.jsp" 'IBM Plex Sans'
check "error500.jsp — IBM Plex Sans referenciada"   "$VIEWS_DIR/error500.jsp" 'IBM Plex Sans'
# Verificar que no queda Arial como fuente primaria
check "pedidos.jsp — Arial NO como fuente primaria" "$VIEWS_DIR/pedidos.jsp" "font-family: 'IBM Plex Sans', Arial" "absent"
check "error404.jsp — Arial NO como única fuente"   "$VIEWS_DIR/error404.jsp" "font-family: Arial" "absent"
check "error500.jsp — Arial NO como única fuente"   "$VIEWS_DIR/error500.jsp" "font-family: Arial" "absent"

# ── 7. Semántica HTML ───────────────────────────────────────
section "7. SEMÁNTICA HTML (HTML5)"
for view in inicio catalogo pedidos error404 error500; do
  f="$VIEWS_DIR/${view}.jsp"
  check "$view.jsp — DOCTYPE html"       "$f" '<!DOCTYPE html>'
  check "$view.jsp — <header> semántico" "$f" '<header'
  check "$view.jsp — <footer> semántico" "$f" '<footer'
done

# ── 8. Responsive ───────────────────────────────────────────
section "8. DISEÑO RESPONSIVO"
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
if [ -f "$STYLES_DIR/tokens.css" ] && grep -q '@media' "$STYLES_DIR/tokens.css" 2>/dev/null; then
  media_count=$(grep -c '@media' "$STYLES_DIR/tokens.css" 2>/dev/null || echo 0)
  printf "  ${GREEN}[OK]${RESET}    %d breakpoint(s) @media definidos en tokens.css\n" "$media_count"
  PASS=$((PASS + 1))
else
  printf "  ${RED}[FALLO]${RESET} Sin @media queries en tokens.css\n"
  FAIL=$((FAIL + 1))
fi

# ── 9. Documentación MkDocs ─────────────────────────────────
section "9. ESTILOS DE DOCUMENTACIÓN (MkDocs)"
check "custom.css — tokens IBM Carbon"         "$DOCS_CSS/custom.css" '\-\-ibm-blue'
check "custom.css — .lab-badge definido"       "$DOCS_CSS/custom.css" '\.lab-badge'
check "custom.css — .objetivos-box definido"   "$DOCS_CSS/custom.css" '\.objetivos-box'
check "override-print.css — @media print"      "$DOCS_CSS/override-print.css" '@media print'

# ── Resumen ─────────────────────────────────────────────────
echo ""
printf "${BOLD}╔══════════════════════════════════════════════════════════════╗${RESET}\n"
printf "${BOLD}║                    RESUMEN DE AUDITORÍA                      ║${RESET}\n"
printf "${BOLD}╠══════════════════════════════════════════════════════════════╣${RESET}\n"
printf "${BOLD}║  ${GREEN}✔ Pasados:${RESET}  %-5d                                         ${BOLD}║${RESET}\n" "$PASS"
printf "${BOLD}║  ${RED}✘ Fallidos:${RESET} %-5d  ← requieren corrección                  ${BOLD}║${RESET}\n" "$FAIL"
printf "${BOLD}║  ${YELLOW}⚠ Avisos:${RESET}   %-5d  ← revisar manualmente                  ${BOLD}║${RESET}\n" "$WARN"
printf "${BOLD}║  Total:      %-5d                                         ${BOLD}║${RESET}\n" "$TOTAL_CHECKS"

SCORE=0
[ "$TOTAL_CHECKS" -gt 0 ] && SCORE=$(( (PASS * 100) / TOTAL_CHECKS ))

printf "${BOLD}╠══════════════════════════════════════════════════════════════╣${RESET}\n"
if [ "$SCORE" -ge 90 ]; then
  printf "${BOLD}║  Puntuación: ${GREEN}%d/100 — Excelente${RESET}${BOLD}                               ║${RESET}\n" "$SCORE"
elif [ "$SCORE" -ge 70 ]; then
  printf "${BOLD}║  Puntuación: ${YELLOW}%d/100 — Necesita mejoras${RESET}${BOLD}                         ║${RESET}\n" "$SCORE"
else
  printf "${BOLD}║  Puntuación: ${RED}%d/100 — Requiere refactorización urgente${RESET}${BOLD}            ║${RESET}\n" "$SCORE"
fi
printf "${BOLD}╚══════════════════════════════════════════════════════════════╝${RESET}\n"
echo ""

if [ "$FAIL" -gt 0 ]; then
  echo "  → Ejecuta la skill ux-ui-java-workshop en Bob para corregir los fallos."
fi

exit 0
