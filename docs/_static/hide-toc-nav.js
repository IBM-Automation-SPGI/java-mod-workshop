// Scripts de personalización UI para el workshop
document.addEventListener("DOMContentLoaded", function () {
  // 1. Oculta entradas de TOC de la navegación lateral en la vista web
  const tocLink = Array.from(document.querySelectorAll(".md-nav__link"))
    .find(link => link.href && (link.href.endsWith("/toc/") || link.href.endsWith("/toc.html")));

  if (tocLink) {
    const listItem = tocLink.closest("li.md-nav__item");
    if (listItem) {
      listItem.style.display = "none";
    }
  }

  // 2. Abrir todos los enlaces externos en nueva pestaña (target="_blank" y rel="noopener noreferrer")
  const currentHost = window.location.hostname;
  document.querySelectorAll("a").forEach(link => {
    const href = link.getAttribute("href");
    if (!href) return;

    // Verificar si es un enlace externo HTTP/HTTPS
    if (href.startsWith("http://") || href.startsWith("https://")) {
      try {
        const linkUrl = new URL(href);
        if (linkUrl.hostname !== currentHost) {
          link.setAttribute("target", "_blank");
          link.setAttribute("rel", "noopener noreferrer");
        }
      } catch (e) {
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener noreferrer");
      }
    }
  });
});
