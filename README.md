# Workshop de Modernización de Aplicaciones Java

[![Publicar en GitHub Pages](https://github.com/IBM-Automation-SPGI/java-mod-workshop/actions/workflows/deploy.yml/badge.svg)](https://github.com/IBM-Automation-SPGI/java-mod-workshop/actions/workflows/deploy.yml)
[![MkDocs Material](https://img.shields.io/badge/MkDocs-Material-blue)](https://squidfunk.github.io/mkdocs-material/)
[![Licencia Apache 2.0](https://img.shields.io/badge/Licencia-Apache%202.0-green)](LICENSE)

## Descripción

Workshop práctico de modernización de aplicaciones Java empresariales. Los participantes aprenderán a analizar una aplicación desplegada en **WebSphere Application Server tradicional (tWAS)** y a modernizarla a **WebSphere Liberty** utilizando **IBM Application Modernization Accelerator (AMA)**.

La aplicación de ejemplo, **PedjasApp**, simula un sistema de gestión de pedidos empresarial desarrollado sobre tecnologías Java EE / tWAS, con EJBs, Servlets, JMS, JNDI propietario y APIs IBM WebSphere.

---

## 📚 Módulos del Workshop

| Lab | Título | Descripción |
|-----|--------|-------------|
| **Lab 0** | Introducción y Requisitos Previos | Objetivos, arquitectura, herramientas y configuración del entorno |
| **Lab 1** | Despliegue en tWAS | Despliegue y verificación de PedjasApp en WebSphere tradicional |
| **Lab 2** | Análisis con AMA | Ejecución e interpretación de IBM Application Modernization Accelerator |
| **Lab 3** | Modernización Manual | Modificaciones de código guiadas por los resultados de AMA |
| **Lab 3B** | Modernización con Bob | Modernización asistida por IA con IBM Bob y paquetes agénticos |
| **Lab 4** | Despliegue en Liberty | server.xml, Dockerfile y despliegue en WebSphere Liberty |
| **Lab 5** | Validación y Siguientes Pasos | Checklist post-modernización, rendimiento y próximos pasos |
| **Lab 6** | Kubernetes & OpenShift | Despliegue cloud-native con Open Liberty Operator (Opcional) |

---

## ⚡ Herramientas y Scripts de Aceleración

- **`./verify-lab.sh [lab#|all]`** — Validador interactivo de salud y requisitos en tiempo real.
- **`./fast-track.sh [lab#]`** — Script de sincronización para ponerse al día rápidamente en cualquier punto del workshop.
- **`docker-compose.yml`** — Despliegue de PostgreSQL y WebSphere Liberty en un solo comando (`podman-compose up -d` / `docker compose up -d`).
- **`k8s/`** — Manifiestos de `OpenLibertyApplication` y base de datos para Kubernetes / OpenShift.

---

## 🌐 Versión publicada

El workshop está disponible en línea en:  
**[https://ibm-automation-spgi.github.io/java-mod-workshop/](https://ibm-automation-spgi.github.io/java-mod-workshop/)**

---

## 🛠️ Ejecución local

### Requisitos previos

- Python 3.9 o superior
- pip

### Instalación y arranque

```bash
# Clonar el repositorio
git clone https://github.com/IBM-Automation-SPGI/java-mod-workshop.git
cd java-mod-workshop

# Instalar dependencias Python
pip install -r requirements.txt

# Arrancar el servidor de desarrollo MkDocs
mkdocs serve
```

El sitio estará disponible en [http://127.0.0.1:8000](http://127.0.0.1:8000).

---

## 🏗️ Estructura del repositorio

```
java-mod-workshop/
├── docs/                          # Contenido del sitio MkDocs
│   ├── index.md                   # Página de inicio del workshop
│   ├── lab0/                      # Lab 0: Introducción y Requisitos Previos
│   ├── lab1/                      # Lab 1: Despliegue en tWAS
│   ├── lab2/                      # Lab 2: Análisis con AMA
│   ├── lab3/                      # Lab 3: Modernización Manual
│   ├── lab4/                      # Lab 4: Despliegue en Liberty
│   ├── lab5/                      # Lab 5: Validación y Siguientes Pasos
│   ├── styles/                    # CSS personalizado
│   └── _static/                   # JavaScript estático
├── pedjasapp-twas/                # Código fuente versión tWAS
├── pedjasapp-liberty/             # Código fuente versión Liberty modernizada
├── mkdocs.yml                     # Configuración de MkDocs
├── requirements.txt               # Dependencias Python
└── .github/workflows/deploy.yml   # Pipeline de GitHub Actions
```

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un *issue* o un *pull request* describiendo los cambios propuestos.

---

## 📄 Licencia

Este proyecto está licenciado bajo la [Licencia Apache 2.0](LICENSE).
