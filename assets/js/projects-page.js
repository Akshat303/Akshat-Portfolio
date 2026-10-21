const projectGrid = document.querySelector("#project-grid");

function createProjectArtwork(project, index) {
  const art = document.createElement("div");
  art.className = `project-art art-${project.cardType}`;
  art.setAttribute("aria-hidden", "true");
  const mockup = document.createElement("div");
  mockup.className = "project-card-visual";
  const label = document.createElement("span");
  label.className = "project-card-visual-label";
  label.textContent = project.category;
  mockup.append(label);
  const title = document.createElement("strong");
  title.textContent = project.name;
  mockup.append(title);
  const line = document.createElement("span");
  line.className = "project-card-visual-line";
  line.textContent = project.tags.slice(0, 3).join("  ·  ");
  mockup.append(line);
  art.append(mockup);
  const number = document.createElement("span");
  number.className = "art-index";
  number.textContent = String(index + 1).padStart(2, "0");
  art.append(number);
  return art;
}

function createProjectCard(project, index, openLabel, labels) {
  const card = document.createElement("a");
  card.className = "project-card";
  card.href = `project-details.html?project=${encodeURIComponent(project.id)}`;
  card.setAttribute("aria-label", `View ${project.name} project details`);

  const info = document.createElement("div");
  info.className = "project-info";
  const meta = document.createElement("div");
  meta.className = "project-meta";
  const category = document.createElement("span");
  category.textContent = project.category;
  const concept = document.createElement("span");
  concept.className = "concept-label";
  concept.textContent = project.type === "project" ? labels.projectLabel : labels.conceptLabel;
  meta.append(category, concept);
  if (project.period) {
    const period = document.createElement("span");
    period.className = "project-period";
    period.textContent = project.period;
    meta.append(period);
  }

  const title = document.createElement("h2");
  title.textContent = project.name;
  const description = document.createElement("p");
  description.textContent = project.summary;
  const tags = document.createElement("div");
  tags.className = "project-tags";
  project.tags.forEach((tag) => {
    const item = document.createElement("span");
    item.textContent = tag;
    tags.append(item);
  });
  const open = document.createElement("span");
  open.className = "project-open-link";
  open.append(document.createTextNode(`${openLabel} `));
  const arrow = document.createElement("span");
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = "↗";
  open.append(arrow);
  info.append(meta, title, description, tags, open);
  card.append(createProjectArtwork(project, index), info);
  return card;
}

if (projectGrid) {
  Promise.all([
    window.loadPortfolioData("../assets/data/projects.json"),
    window.portfolioContentPromise
  ])
    .then(([{ projects }, site]) => {
      if (!site) throw new Error("Site content is unavailable; check assets/data/site-content.json.");
      const orderedProjects = [
        ...projects.filter((project) => project.type === "project"),
        ...projects.filter((project) => project.type !== "project")
      ];
      projectGrid.replaceChildren(...orderedProjects.map((project, index) => createProjectCard(project, index, site.projectsPage.openLabel, site.projectsPage)));
    })
    .catch((error) => window.showPortfolioDataError(projectGrid, error));
}
