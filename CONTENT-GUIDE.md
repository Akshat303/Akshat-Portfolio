# Updating the portfolio

Use [Portfolio-Content-Editor.xlsx](outputs/portfolio-content-editor/Portfolio-Content-Editor.xlsx) as your editing workbook. The website runs as a static site and reads JSON, so after editing and saving the workbook, export its values to the website with:

```powershell
node sync-portfolio-from-xlsx.js
```

Run that command from the portfolio project folder after saving the workbook. The exporter is JavaScript and uses Node.js built-in modules only; it needs no Python or third-party packages. It updates the JSON files in `assets/data/` that the website reads.

## Workbook tabs

- **Site Fields**: text for your name, role, hero, section headings, contact links, and labels. Each row uses a dot-separated field path.
- **Hero Phrases**, **About Text**, **Principles**, **Focus Items**, **Home Badges**: repeating homepage content. Add a row to add an item; delete a row to remove one. The Order column controls the display sequence.
- **Experience**: one row per role. Put each highlight and skill on its own line in the two list cells.
- **Skills**: one row per skill. The group name determines its category; repeat it for skills in the same group.
- **Projects**: one row per project. Use a unique ID, set Type to `project` or `concept`, and keep exactly one Featured cell set to `TRUE`. This tab holds the project name, category, summary, description, purpose, tags, technologies, organization, learning notes, GitHub repository URL, and live demo URL.
- **Project Features**, **Project Roadmap**, **Project Endpoints**, **Project Screens**, **Project Images**: detail rows connected by Project ID. Add as many feature, roadmap, endpoint, screen, or image rows as needed. To remove a project, delete its rows from these tabs too. Project Screens contain HTML mockup content; screenshots and image links are easier to maintain in Project Images.
- **Badges**, **Certificates**, **Settings**: achievement cards, credential links, and the HackerRank profile URL.

## Add or update a project

1. In **Projects**, edit an existing row or add a new one. Give it a unique lowercase ID such as `task-manager`, fill in its name, category, summary, description, type (`project` if built, `concept` if it is only an idea), tags, and technologies. Keep exactly one project marked `TRUE` under Featured.
2. In the detail tabs, add rows using that same Project ID. Put one feature, roadmap step, endpoint, or preview per row; set Order to 1, 2, 3, and so on.
3. Every current project has three sample interface previews so the card image and detail-page slider are visible immediately. They are illustrative placeholders, not real project screenshots. To replace them, copy your screenshot files into `assets/images/projects/` and edit the matching rows in **Project Images**. Keep the same Project ID, set Order to 1, 2, 3, and so on, and update the title and image path, for example `../assets/images/projects/task-manager.png`. Paths are relative to the `pages/` folder. You can use a public `https://` image URL instead. The first image is used on the project card and as the first detail-page preview. Add more rows to add slides or delete rows to remove them.
4. Save the workbook and run `node sync-portfolio-from-xlsx.js`. The project list and detail pages read the updated generated data.

List cells use one item per line. Keep project IDs unique and links complete. After syncing, serve the website through a local web server so it can load the generated JSON files.

The JSON files are generated website data. Make content changes in the workbook, then run the sync command again; manual JSON edits will be replaced by the workbook’s contents on the next sync.
