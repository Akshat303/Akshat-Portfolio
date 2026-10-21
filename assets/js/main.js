const menuToggle = document.querySelector(".menu-toggle");
const primaryNav = document.querySelector("#primary-nav");

const revealSelector = [
  ".section-kicker",
  ".about-grid > *",
  ".principle-card",
  ".experience-heading > *",
  ".experience-card",
  ".stack-heading > *",
  ".stack-group",
  ".stack-footnote",
  ".focus-grid > *",
  ".projects-callout",
  ".home-achievements-content",
  ".contact-content",
  ".project-detail-hero > *",
  ".detail-panel",
  ".roadmap-step"
].join(",");

if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -36px 0px" });

  const observeReveals = (root) => {
    if (root.matches?.(revealSelector)) {
      root.classList.add("scroll-reveal");
      revealObserver.observe(root);
    }
    root.querySelectorAll?.(revealSelector).forEach((element) => {
      element.classList.add("scroll-reveal");
      revealObserver.observe(element);
    });
  };

  observeReveals(document);
  document.body.classList.add("motion-ready");
  new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof Element) observeReveals(node);
      });
    });
  }).observe(document.querySelector("main") || document.body, { childList: true, subtree: true });
}

if (menuToggle && primaryNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Open navigation" : "Close navigation");
    primaryNav.classList.toggle("is-open", !isOpen);
  });

  primaryNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open navigation");
      primaryNav.classList.remove("is-open");
    });
  });
}

const year = document.querySelector("#year");
if (year) year.textContent = new Date().getFullYear();
