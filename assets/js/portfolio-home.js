const stackContainer = document.querySelector("#stack-groups");

window.portfolioContentPromise?.then((data) => {
  if (!data) return;
  const principles = document.querySelector("#principle-cards");
  if (principles) {
    principles.replaceChildren(...data.about.principles.map((principle) => {
      const card = document.createElement("article");
      card.className = "principle-card";
      const label = document.createElement("span");
      label.className = "principle-number";
      label.textContent = principle.label;
      const title = document.createElement("h3");
      title.textContent = principle.title;
      const description = document.createElement("p");
      description.textContent = principle.description;
      card.append(label, title, description);
      return card;
    }));
  }

  const focusItems = document.querySelector("#focus-items");
  if (focusItems) {
    focusItems.replaceChildren(...data.focus.items.map((item, index) => {
      const article = document.createElement("article");
      article.className = "focus-item";
      const number = document.createElement("span");
      number.className = "focus-icon";
      number.textContent = String(index + 1).padStart(2, "0");
      const copy = document.createElement("div");
      const title = document.createElement("h3");
      title.textContent = item.title;
      const description = document.createElement("p");
      description.textContent = item.description;
      copy.append(title, description);
      const arrow = document.createElement("span");
      arrow.className = "focus-arrow";
      arrow.setAttribute("aria-hidden", "true");
      arrow.textContent = "↗";
      article.append(number, copy, arrow);
      return article;
    }));
  }

  const achievementMinis = document.querySelector("#achievement-minis");
  if (achievementMinis) {
    achievementMinis.replaceChildren(...data.homeAchievements.visualBadges.map((badge) => {
      const item = document.createElement("div");
      item.className = `achievement-mini ${badge.className}`;
      item.setAttribute("aria-hidden", "true");
      const symbol = document.createElement("span");
      symbol.textContent = badge.symbol;
      const name = document.createElement("b");
      name.textContent = badge.name;
      const level = document.createElement("small");
      level.textContent = badge.level;
      item.append(symbol, name, level);
      return item;
    }));
  }
}).catch((error) => {
  console.error("Could not render profile content.", error);
  [document.querySelector("#principle-cards"), document.querySelector("#focus-items"), document.querySelector("#achievement-minis")]
    .filter(Boolean)
    .forEach((container) => window.showPortfolioDataError(container, error));
});

if (stackContainer) {
  window.loadPortfolioData("assets/data/tech-stack.json")
    .then((data) => {
      const groups = data.groups.map((group) => {
        const section = document.createElement("section");
        section.className = "stack-group";
        const heading = document.createElement("h3");
        heading.textContent = group.name;
        const skills = document.createElement("div");
        skills.className = "stack-list";
        group.skills.forEach((skill) => {
          const chip = document.createElement("span");
          chip.className = "stack-chip";
          const icon = document.createElement("span");
          icon.className = `chip-symbol ${skill.iconClass || ""}`.trim();
          icon.textContent = skill.icon;
          chip.append(icon, document.createTextNode(` ${skill.name}`));
          skills.append(chip);
        });
        section.append(heading, skills);
        return section;
      });
      stackContainer.replaceChildren(...groups);

      const skills = data.groups.reduce((all, group) => all.concat(group.skills), []).slice(0, 2);
      skills.forEach((skill, index) => {
        const position = index === 0 ? "primary" : "secondary";
        document.querySelector(`#hero-skill-${position}-icon`).textContent = skill.icon;
        document.querySelector(`#hero-skill-${position}-name`).textContent = skill.name;
      });
      document.querySelectorAll(".hero-art .floating-tag").forEach((tag, index) => {
        tag.hidden = !skills[index];
      });
    })
    .catch((error) => window.showPortfolioDataError(stackContainer, error));
}

window.loadPortfolioData("assets/data/projects.json")
  .then(({ projects }) => {
    const featuredProjects = projects.filter((project) => project.featured);
    if (featuredProjects.length !== 1) {
      throw new Error(`Expected exactly one featured project in assets/data/projects.json; found ${featuredProjects.length}.`);
    }
    const [featured] = featuredProjects;
    const callout = document.querySelector("#featured-project-callout");
    const name = document.querySelector("#featured-project-name");
    const description = document.querySelector("#featured-project-description");
    const tags = document.querySelector("#featured-project-tags");
    const endpoint = featured.endpoints[0];
    const database = featured.technologies.find((technology) => /postgres|mysql|mongo|database|redis/i.test(technology));
    const backend = featured.technologies.find((technology) => /java|spring|kafka/i.test(technology));
    if (!endpoint || !database || !backend) {
      throw new Error(`Featured project "${featured.id}" needs an endpoint, data technology, and backend technology.`);
    }
    const target = `pages/project-details.html?project=${encodeURIComponent(featured.id)}`;
    callout.href = target;
    callout.setAttribute("aria-label", `View ${featured.name} project details`);
    const [firstWord, ...remainingWords] = featured.name.split(/\s+/);
    const accentedName = document.createElement("span");
    accentedName.textContent = remainingWords.join(" ");
    name.replaceChildren(document.createTextNode(firstWord), document.createElement("br"), accentedName);
    description.textContent = featured.description;
    document.querySelector("#featured-endpoint-method").textContent = endpoint.method;
    document.querySelector("#featured-endpoint-path").textContent = endpoint.path;
    const responseStatus = { GET: "200 OK", POST: "201 CREATED", PUT: "200 OK", PATCH: "200 OK", DELETE: "204 NO CONTENT" };
    document.querySelector("#featured-endpoint-status").textContent = responseStatus[endpoint.method] || endpoint.method;
    document.querySelector("#featured-database-name").textContent = database;
    document.querySelector("#featured-backend-name").textContent = backend;
    document.querySelector("#featured-backend-icon").textContent = backend.charAt(0).toUpperCase();
    tags.replaceChildren(...featured.tags.slice(0, 3).map((tag) => {
      const item = document.createElement("span");
      item.textContent = tag.toUpperCase();
      return item;
    }));
  })
  .catch((error) => window.showPortfolioDataError(document.querySelector("#featured-project-callout"), error));

window.loadPortfolioData("assets/data/achievements.json")
  .then((data) => {
    document.querySelector("#home-badge-count").textContent = String(data.badges.length).padStart(2, "0");
    document.querySelector("#home-certificate-count").textContent = String(data.certificates.length).padStart(2, "0");
  })
  .catch((error) => window.showPortfolioDataError(document.querySelector(".home-achievement-stats"), error));
