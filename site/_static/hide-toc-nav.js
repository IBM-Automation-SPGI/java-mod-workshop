// Oculta entradas de TOC de la navegación lateral en la vista web
document.addEventListener("DOMContentLoaded", function () {
  const tocLink = Array.from(document.querySelectorAll(".md-nav__link"))
    .find(link => link.href && (link.href.endsWith("/toc/") || link.href.endsWith("/toc.html")));

  if (tocLink) {
    const listItem = tocLink.closest("li.md-nav__item");
    if (listItem) {
      listItem.style.display = "none";
    }
  }
});
