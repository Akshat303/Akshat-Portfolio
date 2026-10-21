const detailRoot = document.querySelector("#project-detail-content");
const selectedProject = new URLSearchParams(window.location.search).get("project");

function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

function makeList(items, className) {
  const list = makeElement("ul", className);
  items.forEach((item) => list.append(makeElement("li", "", item)));
  return list;
}

function makeProjectPreview(project, copy) {
  const panel = makeElement("section", "project-visual-panel");
  panel.setAttribute("aria-label", `${project.name} project concept screen preview`);
  panel.append(makeElement("span", "project-visual-label", copy.previewLabel));

  const frame = makeElement("div", "project-screen-frame");
  const toolbar = makeElement("div", "project-screen-toolbar");
  const screenTitle = makeElement("span", "project-screen-title");
  toolbar.append(makeElement("span", "project-screen-dots", "● ● ●"), screenTitle, makeElement("span", "project-screen-menu", "•••"));

  const screen = makeElement("div", "project-screen-content");
  screen.setAttribute("aria-live", "off");
  const screenshotSlides = (project.screenshots || []).map((screenshot, index) => {
    if (typeof screenshot.url !== "string" || !screenshot.url.trim()) {
      throw new Error(`Screenshot ${index + 1} for ${project.name} needs a non-empty URL in projects.json.`);
    }
    return {
      title: screenshot.title || `Screenshot ${index + 1}`,
      imageUrl: screenshot.url
    };
  });
  const slides = [...project.screens, ...screenshotSlides];
  let activeSlide = 0;

  const pagination = makeElement("div", "project-carousel-pagination");
  pagination.setAttribute("role", "group");
  pagination.setAttribute("aria-label", copy.carouselChooseLabel);
  const indicators = slides.map((slide, index) => {
    const indicator = makeElement("button", "project-carousel-indicator");
    indicator.type = "button";
    indicator.setAttribute("aria-label", `Show ${slide.title} preview`);
    indicator.setAttribute("aria-pressed", String(index === activeSlide));
    pagination.append(indicator);
    return indicator;
  });

  const previous = makeElement("button", "project-carousel-arrow", "←");
  previous.type = "button";
  previous.setAttribute("aria-label", copy.carouselPreviousLabel);
  const next = makeElement("button", "project-carousel-arrow", "→");
  next.type = "button";
  next.setAttribute("aria-label", copy.carouselNextLabel);
  const controls = makeElement("div", "project-carousel-controls");
  controls.append(previous, pagination, next);

  function updateSlide(index) {
    activeSlide = (index + slides.length) % slides.length;
    screen.classList.remove("is-sliding");
    const slide = slides[activeSlide];
    screen.classList.toggle("has-image", Boolean(slide.imageUrl));
    screenTitle.textContent = `${project.name} · ${slide.title.toLowerCase()}`;
    if (slide.imageUrl) {
      const image = makeElement("img", "project-screen-image");
      image.src = slide.imageUrl;
      image.alt = `${project.name} — ${slide.title}`;
      image.addEventListener("error", () => {
        console.error(`Could not load project screenshot: ${slide.imageUrl}`);
        screen.replaceChildren(makeElement("p", "project-image-error", `${copy.imageError} ${slide.imageUrl}`));
      }, { once: true });
      screen.replaceChildren(image);
    } else {
      screen.innerHTML = slide.content;
    }
    caption.textContent = slide.imageUrl ? copy.imageCaption : copy.mockupCaption;
    indicators.forEach((indicator, indicatorIndex) => {
      indicator.setAttribute("aria-pressed", String(indicatorIndex === activeSlide));
    });
    requestAnimationFrame(() => screen.classList.add("is-sliding"));
  }

  let rotationTimer;
  function stopRotation() {
    window.clearInterval(rotationTimer);
  }
  function startRotation() {
    stopRotation();
    if (
      slides.length > 1 &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
      !panel.matches(":hover") &&
      !panel.contains(document.activeElement)
    ) {
      rotationTimer = window.setInterval(() => updateSlide(activeSlide + 1), 6000);
    }
  }

  previous.addEventListener("click", () => { updateSlide(activeSlide - 1); startRotation(); });
  next.addEventListener("click", () => { updateSlide(activeSlide + 1); startRotation(); });
  indicators.forEach((indicator, index) => indicator.addEventListener("click", () => {
    updateSlide(index);
    startRotation();
  }));
  panel.addEventListener("mouseenter", stopRotation);
  panel.addEventListener("mouseleave", startRotation);
  panel.addEventListener("focusin", stopRotation);
  panel.addEventListener("focusout", (event) => {
    if (!panel.contains(event.relatedTarget)) startRotation();
  });

  const caption = makeElement("span", "project-visual-caption");
  updateSlide(activeSlide);
  startRotation();
  frame.append(toolbar, screen);
  panel.append(frame, controls, caption);
  return panel;
}

function makeOrganizationPanel(project, labels) {
  const panel = makeElement("section", "project-organization-panel");
  panel.append(makeElement("span", "project-organization-kicker", labels.associatedLabel));
  const identity = makeElement("div", "project-organization-identity");
  const mark = makeElement("span", "project-organization-mark", project.associatedWith.slice(0, 2).toUpperCase());
  if (project.organizationLogo) {
    const logo = makeElement("img", "project-organization-logo");
    logo.src = project.organizationLogo;
    logo.alt = "";
    logo.addEventListener("load", () => {
      mark.hidden = true;
    }, { once: true });
    logo.addEventListener("error", () => {
      console.error(`Could not load organization logo: ${project.organizationLogo}`);
      logo.remove();
    }, { once: true });
    identity.append(logo, mark);
  } else {
    identity.append(mark);
  }
  identity.append(makeElement("strong", "", project.associatedWith));
  panel.append(identity);
  if (project.period) panel.append(makeElement("span", "project-organization-period", project.period));
  return panel;
}

function renderPortfolioProject(project, labels, site) {
  detailRoot.replaceChildren();
  document.title = `${project.name} — ${labels.projectLabel} | ${site.name}`;

  const hero = makeElement("section", "project-detail-hero portfolio-project-hero");
  const copy = makeElement("div", "project-detail-copy");
  const kicker = makeElement("div", "section-kicker");
  kicker.append(makeElement("span", "", "01"), makeElement("span", "kicker-rule"), makeElement("span", "", labels.projectLabel));
  copy.append(kicker, makeElement("span", "project-detail-category", project.category));
  copy.append(makeElement("h1", "project-detail-title", project.name));
  copy.append(makeElement("span", "project-concept-label project-detail-label", labels.projectLabel));
  copy.append(makeElement("p", "project-detail-summary", project.summary));
  const back = makeElement("a", "project-back-link", labels.backLabel);
  back.href = "projects.html";
  copy.append(back);
  hero.append(copy, makeOrganizationPanel(project, labels));
  detailRoot.append(hero);

  const details = makeElement("div", "project-detail-grid portfolio-project-information");
  const overview = makeElement("section", "detail-panel detail-purpose");
  overview.append(
    makeElement("span", "detail-overline", labels.overviewLabel),
    makeElement("h2", "", labels.overviewTitle),
    makeElement("p", "", project.description)
  );
  const technology = makeElement("section", "detail-panel detail-stack");
  technology.append(
    makeElement("span", "detail-overline", labels.projectTechnologiesLabel),
    makeElement("h2", "", labels.toolsTitle),
    makeList(project.technologies, "stack-detail-list")
  );
  details.append(overview, technology);
  detailRoot.append(details);
}

function renderProject(project, labels, site) {
  if (project.type === "project") {
    renderPortfolioProject(project, labels, site);
    return;
  }

  detailRoot.replaceChildren();
  document.title = `${project.name} — ${labels.conceptLabel} | ${site.name}`;

  const hero = makeElement("section", "project-detail-hero");
  const copy = makeElement("div", "project-detail-copy");
  const kicker = makeElement("div", "section-kicker");
  kicker.append(makeElement("span", "", "01"), makeElement("span", "kicker-rule"), makeElement("span", "", labels.conceptLabel));
  copy.append(kicker, makeElement("span", "project-detail-category", project.category));
  copy.append(makeElement("h1", "project-detail-title", project.name));
  copy.append(makeElement("span", "project-concept-label project-detail-label", labels.sampleLabel));
  copy.append(makeElement("p", "project-detail-summary", project.description));
  const back = makeElement("a", "project-back-link", labels.backLabel);
  back.href = "projects.html";
  copy.append(back);
  hero.append(copy, makeProjectPreview(project, labels));
  detailRoot.append(hero);

  const ideaGrid = makeElement("div", "project-detail-grid");
  const purpose = makeElement("section", "detail-panel detail-purpose");
  purpose.append(makeElement("span", "detail-overline", labels.ideaLabel));
  purpose.append(makeElement("h2", "", labels.ideaTitle), makeElement("p", "", project.purpose));
  const features = makeElement("section", "detail-panel");
  features.append(makeElement("span", "detail-overline", labels.featuresLabel));
  features.append(makeElement("h2", "", labels.featuresTitle), makeList(project.features, "detail-feature-list"));
  ideaGrid.append(purpose, features);
  detailRoot.append(ideaGrid);

  const roadmap = makeElement("section", "detail-roadmap");
  const roadmapHeading = makeElement("div", "detail-section-heading");
  roadmapHeading.append(makeElement("div", "detail-overline", labels.roadmapLabel), makeElement("h2", "", labels.roadmapTitle));
  const steps = makeElement("ol", "roadmap-list");
  project.roadmap.forEach((step, index) => {
    const item = makeElement("li", "roadmap-step");
    item.append(makeElement("span", "roadmap-number", String(index + 1).padStart(2, "0")), makeElement("p", "", step));
    steps.append(item);
  });
  roadmap.append(roadmapHeading, steps);
  detailRoot.append(roadmap);

  const implementation = makeElement("div", "project-detail-grid detail-bottom-grid");
  const endpoints = makeElement("section", "detail-panel");
  endpoints.append(makeElement("span", "detail-overline", labels.endpointsLabel), makeElement("h2", "", labels.endpointsTitle));
  const endpointList = makeElement("ul", "endpoint-list");
  project.endpoints.forEach((endpoint) => {
    const item = makeElement("li", "endpoint-row");
    item.append(
      makeElement("span", `endpoint-method method-${endpoint.method.toLowerCase()}`, endpoint.method),
      makeElement("code", "endpoint-path", endpoint.path),
      makeElement("span", "endpoint-purpose", endpoint.purpose)
    );
    endpointList.append(item);
  });
  endpoints.append(endpointList);

  const stack = makeElement("section", "detail-panel detail-stack");
  stack.append(makeElement("span", "detail-overline", labels.toolsLabel), makeElement("h2", "", labels.toolsTitle));
  stack.append(makeList(project.technologies, "stack-detail-list"));
  stack.append(makeElement("h3", "detail-learn-heading", labels.learnTitle), makeElement("p", "detail-learn-copy", project.learn));
  implementation.append(endpoints, stack);
  detailRoot.append(implementation);
}

if (detailRoot) {
  Promise.all([
    window.loadPortfolioData("../assets/data/projects.json"),
    window.portfolioContentPromise
  ])
    .then(([{ projects }, site]) => {
      if (!site) throw new Error("Site content is unavailable; check assets/data/site-content.json.");
      const copy = site.projectDetails;
      const project = projects.find((entry) => entry.id === selectedProject);
      if (project) {
        renderProject(project, { ...copy, ...site.projectsPage }, site.site);
        return;
      }

      document.title = `${copy.notFoundTitle} — ${site.site.name}`;
      const message = makeElement("section", "project-detail-error");
      message.append(makeElement("h1", "", copy.notFoundTitle));
      message.append(makeElement("p", "", copy.notFoundDescription));
      const link = makeElement("a", "button button-primary", copy.browseProjectsLabel);
      link.href = "projects.html";
      message.append(link);
      detailRoot.replaceChildren(message);
    })
    .catch((error) => window.showPortfolioDataError(detailRoot, error));
}
