# Akshat's Portfolio

A responsive, static profile website built with HTML, CSS, and vanilla JavaScript.

## Preview

Run the folder with a local web server (for example, VS Code Live Server) and open `index.html`. The site reads its content from JSON files using `fetch`, which browsers block when an HTML page is opened directly as `file://`. No build step or package installation is required.

## Personalize before publishing

- Edit `assets/data/site-content.json` to update editable profile copy, page introductions, navigation/footer labels, contact links and availability message, and the animated headline phrases. Project-specific content remains in `assets/data/projects.json`, skills in `assets/data/tech-stack.json`, badges/certificates in `assets/data/achievements.json`, and work history in `assets/data/experience.json`.
- Edit `assets/data/experience.json` to add, remove, or update the experience cards on the homepage. Each entry can include `company`, `role`, `employment`, `period`, `duration`, `location`, `description`, and a `skills` array. Company logos are generated from the company initials; no external profile links are required.
- Edit `assets/data/tech-stack.json` to add, remove, or rename toolkit groups and skills. A skill has `name`, `icon`, and optional `iconClass` fields.
- Edit `assets/data/projects.json` to add or update projects. Add a project object inside the `projects` array. Projects marked `"type": "project"` use the compact format shown by the older portfolio projects: unique URL-safe `id`, `name`, `category`, `cardType`, `summary`, `description`, `purpose`, `period`, `associatedWith`, optional `organizationLogo`, `tags`, and `technologies`. Project concepts use the full detail format with `features`, `roadmap`, `endpoints`, `learn`, `screens`, and `screenshots`. Each screen has a `title` and `content` HTML string for the mockup carousel. Add screenshot links to that project's `screenshots` array as objects such as `{ "title": "Dashboard", "url": "https://example.com/dashboard.png" }`. Screenshots are added to the same sliding carousel; local image paths are relative to `pages/project-details.html` (for example, `../assets/images/dashboard.png`). Set `"featured": true` on a project to highlight it on the homepage; only mark one project as featured.
- Edit `assets/data/achievements.json` to add or update badges and certificates. Badges use `name`, `description`, `symbol`, and `style`; certificates use `name`, `shortName`, `url`, and `provider`. Change `profileUrl` to update the HackerRank profile button.
- Keep JSON syntax valid: separate array entries with commas, use double quotes around keys and text, and do not leave a comma after the final entry. Save the JSON and refresh the page to see the changes.
- Replace `assets/resume/Akshat-Srivastava-Resume-Placeholder.pdf` with your real resume PDF before sharing the download link.
- Update the site and page descriptions in `assets/data/site-content.json`.

Profile copy and links, the Tech Stack, Projects page and homepage featured project, project detail pages and preview carousels, and Achievements page and homepage counts are rendered from their respective JSON data files. Certificate cards link to the verification URL provided in the achievements data and use decorative local certificate artwork.

The site includes a responsive navigation menu, theme toggle, reduced-motion support, and a small animated headline.
