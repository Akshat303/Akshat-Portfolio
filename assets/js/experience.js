const experienceList = document.querySelector("#experience-list");

if (experienceList) {
  Promise.all([
    window.loadPortfolioData("assets/data/experience.json"),
    window.portfolioContentPromise
  ])
    .then(([data, content]) => {
      if (!content) throw new Error("Site content is unavailable; check assets/data/site-content.json.");
      if (!Array.isArray(data.experiences)) {
        throw new Error("Experience data must include an experiences array in assets/data/experience.json.");
      }

      experienceList.replaceChildren(...data.experiences.map((experience) => {
        const article = document.createElement("article");
        article.className = "experience-card";

        const marker = document.createElement("span");
        marker.className = "experience-marker";
        marker.setAttribute("aria-hidden", "true");

        const companyMark = document.createElement("span");
        companyMark.className = "experience-company-mark";
        companyMark.setAttribute("aria-hidden", "true");
        companyMark.textContent = experience.company.split(/\s+/).map((word) => word[0]).join("").slice(0, 2).toUpperCase();

        const main = document.createElement("div");
        main.className = "experience-main";

        const header = document.createElement("div");
        header.className = "experience-card-heading";
        const titleGroup = document.createElement("div");
        const role = document.createElement("h3");
        role.textContent = experience.role;
        const company = document.createElement("p");
        company.className = "experience-company";
        company.textContent = experience.company;
        titleGroup.append(role, company);

        const timeline = document.createElement("div");
        timeline.className = "experience-period";
        const period = document.createElement("span");
        period.textContent = experience.period;
        const duration = document.createElement("span");
        duration.textContent = `${content.experience.durationLabel}: ${experience.duration}`;
        timeline.append(period, duration);
        header.append(titleGroup, timeline);

        const metadata = document.createElement("div");
        metadata.className = "experience-meta";
        [experience.employment, experience.location].filter(Boolean).forEach((value) => {
          const item = document.createElement("span");
          item.textContent = value;
          metadata.append(item);
        });

        const description = document.createElement("p");
        description.className = "experience-description";
        description.textContent = experience.description;

        const skills = document.createElement("div");
        skills.className = "experience-skills";
        const skillsLabel = document.createElement("span");
        skillsLabel.className = "experience-skills-label";
        skillsLabel.textContent = `${content.experience.skillsLabel}:`;
        skills.append(skillsLabel, ...experience.skills.map((skill) => {
          const tag = document.createElement("span");
          tag.className = "experience-skill";
          tag.textContent = skill;
          return tag;
        }));

        main.append(header);
        if (metadata.childElementCount) main.append(metadata);
        main.append(description, skills);
        article.append(marker, companyMark, main);
        return article;
      }));
    })
    .catch((error) => window.showPortfolioDataError(experienceList, error));
}
