// Export the editable portfolio workbook to the JSON data used by the website.
// Uses Node.js built-in JavaScript modules only. Run from the project root:
// node sync-portfolio-from-xlsx.js

const fs = require("node:fs/promises");
const path = require("node:path");
const zlib = require("node:zlib");

const ROOT = __dirname;
const WORKBOOK = path.join(ROOT, "outputs", "portfolio-content-editor", "Portfolio-Content-Editor.xlsx");
const DATA_DIR = path.join(ROOT, "assets", "data");
const workbookFile = path.resolve(process.argv[2] || WORKBOOK);

function xmlDecode(value) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

function zipFiles(buffer) {
  let eocd = -1;
  const lowerBound = Math.max(0, buffer.length - 22 - 0xffff);
  for (let i = buffer.length - 22; i >= lowerBound; i -= 1) {
    if (buffer.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("The selected file is not a valid XLSX workbook.");
  const count = buffer.readUInt16LE(eocd + 10);
  let cursor = buffer.readUInt32LE(eocd + 16);
  const files = new Map();
  for (let n = 0; n < count; n += 1) {
    if (buffer.readUInt32LE(cursor) !== 0x02014b50) throw new Error("The workbook ZIP directory is malformed.");
    const method = buffer.readUInt16LE(cursor + 10);
    const compressedSize = buffer.readUInt32LE(cursor + 20);
    const nameLength = buffer.readUInt16LE(cursor + 28);
    const extraLength = buffer.readUInt16LE(cursor + 30);
    const commentLength = buffer.readUInt16LE(cursor + 32);
    const localOffset = buffer.readUInt32LE(cursor + 42);
    const name = buffer.toString("utf8", cursor + 46, cursor + 46 + nameLength);
    if (buffer.readUInt32LE(localOffset) !== 0x04034b50) throw new Error(`Invalid XLSX entry: ${name}`);
    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const start = localOffset + 30 + localNameLength + localExtraLength;
    const raw = buffer.subarray(start, start + compressedSize);
    let content;
    if (method === 0) content = Buffer.from(raw);
    else if (method === 8) content = zlib.inflateRawSync(raw);
    else throw new Error(`Unsupported XLSX compression method ${method}.`);
    files.set(name, content.toString("utf8"));
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  return files;
}

function attr(tag, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = tag.match(new RegExp(`(?:^|\\s)${escaped}="([^"]*)"`));
  return match ? xmlDecode(match[1]) : "";
}

function cellColumn(reference) {
  const letters = reference.match(/^[A-Z]+/)[0];
  let number = 0;
  for (const char of letters) number = number * 26 + char.charCodeAt(0) - 64;
  return number - 1;
}

function cellText(xml) {
  return [...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((match) => xmlDecode(match[1])).join("");
}

function parseSheet(xml, sharedStrings) {
  const rows = [];
  for (const rowMatch of xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const rowXml = rowMatch[1];
    const values = [];
    for (const cellMatch of rowXml.matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
      const tag = cellMatch[0];
      const attrs = cellMatch[1];
      const body = cellMatch[2];
      const reference = attr(`<c ${attrs}>`, "r");
      const col = cellColumn(reference);
      while (values.length <= col) values.push("");
      const type = attr(`<c ${attrs}>`, "t");
      if (type === "inlineStr") values[col] = cellText(body);
      else {
        const valueMatch = body.match(/<v(?:\s[^>]*)?>([\s\S]*?)<\/v>/);
        let value = valueMatch ? xmlDecode(valueMatch[1]) : "";
        if (type === "s" && value !== "") value = sharedStrings[Number(value)] || "";
        if (type === "b") value = value === "1" ? "TRUE" : "FALSE";
        values[col] = value;
      }
    }
    rows.push(values);
  }
  return rows;
}

function readWorkbook(files) {
  const workbookXml = files.get("xl/workbook.xml");
  const relsXml = files.get("xl/_rels/workbook.xml.rels");
  if (!workbookXml || !relsXml) throw new Error("Workbook structure is missing.");
  const relTargets = new Map();
  for (const match of relsXml.matchAll(/<Relationship\b[^>]*\/?\s*>/g)) {
    relTargets.set(attr(match[0], "Id"), attr(match[0], "Target"));
  }
  let sharedStrings = [];
  const stringsXml = files.get("xl/sharedStrings.xml");
  if (stringsXml) sharedStrings = [...stringsXml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map((match) => cellText(match[1]));
  const sheets = new Map();
  for (const match of workbookXml.matchAll(/<sheet\b[^>]*\/?\s*>/g)) {
    const name = attr(match[0], "name");
    const relationship = attr(match[0], "r:id");
    let target = relTargets.get(relationship);
    if (!target) throw new Error(`No workbook path found for sheet '${name}'.`);
    target = target.replace(/^\//, "");
    if (!target.startsWith("xl/")) target = path.posix.normalize(path.posix.join("xl", target));
    const xml = files.get(target);
    if (!xml) throw new Error(`Could not read worksheet '${name}'.`);
    sheets.set(name, parseSheet(xml, sharedStrings));
  }
  return sheets;
}

function records(sheets, name) {
  const rows = sheets.get(name);
  if (!rows?.length) throw new Error(`Workbook is missing the '${name}' sheet.`);
  const headers = rows[0].map((value) => String(value).trim());
  return rows.slice(1).filter((row) => row.some((value) => String(value ?? "").trim())).map((row) => {
    const record = {};
    headers.forEach((header, i) => { if (header) record[header] = row[i] ?? ""; });
    return record;
  });
}

const clean = (value) => String(value ?? "").trim();
const splitLines = (value) => String(value ?? "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
const order = (row) => Number(row.Order) || 0;

function orderedRows(rows, predicate = () => true) {
  return rows.filter(predicate).sort((a, b) => order(a) - order(b));
}

function setPath(root, fieldPath, value) {
  const parts = fieldPath.split(".");
  let current = root;
  for (const part of parts.slice(0, -1)) current = current[part] ||= {};
  current[parts.at(-1)] = value;
}

function makeSite(sheets) {
  const site = {};
  for (const row of records(sheets, "Site Fields")) {
    const key = clean(row["Field path"]);
    if (key) setPath(site, key, row["Editable value"] ?? "");
  }
  site.hero.phrases = orderedRows(records(sheets, "Hero Phrases"), (r) => clean(r.Phrase)).map((r) => clean(r.Phrase));
  site.about.paragraphs = orderedRows(records(sheets, "About Text"), (r) => clean(r.Paragraph)).map((r) => clean(r.Paragraph));
  site.about.principles = orderedRows(records(sheets, "Principles"), (r) => clean(r.Title)).map((r) => ({ label: clean(r.Label), title: clean(r.Title), description: clean(r.Description) }));
  site.focus.items = orderedRows(records(sheets, "Focus Items"), (r) => clean(r.Title)).map((r) => ({ title: clean(r.Title), description: clean(r.Description) }));
  site.homeAchievements.visualBadges = orderedRows(records(sheets, "Home Badges"), (r) => clean(r.Name)).map((r) => ({ symbol: clean(r.Symbol), name: clean(r.Name), level: clean(r.Level), className: clean(r["Class name"]) }));
  return site;
}

function makeExperience(sheets) {
  const experiences = [];
  for (const row of records(sheets, "Experience")) {
    const item = { company: clean(row.Company), role: clean(row.Role) };
    for (const [column, key] of [["Employment", "employment"], ["Period", "period"], ["Duration", "duration"], ["Location", "location"], ["Description", "description"]]) {
      const value = clean(row[column]);
      if (value) item[key] = value;
    }
    item.highlights = splitLines(row["Highlights · one per line"]);
    item.skills = splitLines(row["Skills · one per line"]);
    if (item.company || item.role) experiences.push(item);
  }
  return { experiences };
}

function makeSkills(sheets) {
  const groups = new Map();
  for (const row of records(sheets, "Skills")) {
    const groupName = clean(row.Group);
    const name = clean(row.Skill);
    if (!groupName || !name) continue;
    if (!groups.has(groupName)) groups.set(groupName, { name: groupName, skills: [] });
    groups.get(groupName).skills.push({ name, icon: clean(row.Icon), iconClass: clean(row["Icon class"]) });
  }
  return { groups: [...groups.values()] };
}

function makeProjects(sheets) {
  const projects = [];
  const ids = new Set();
  for (const row of records(sheets, "Projects")) {
    const id = clean(row.id);
    if (!id) continue;
    if (ids.has(id)) throw new Error(`Duplicate project ID: ${id}`);
    ids.add(id);
    const project = { id };
    for (const key of ["name", "category", "cardType", "summary", "description", "purpose", "period", "associatedWith", "organizationLogo", "learn", "repositoryUrl", "liveDemoUrl"]) {
      const value = clean(row[key]);
      if (value) project[key] = value;
    }
    const type = clean(row.type) || "concept";
    if (type !== "project" && type !== "concept") throw new Error(`Project '${id}' Type must be 'project' or 'concept'.`);
    project.type = type;
    project.featured = clean(row.featured).toUpperCase() === "TRUE";
    project.tags = splitLines(row["tags · one per line"]);
    project.technologies = splitLines(row["technologies · one per line"]);
    projects.push(project);
  }
  const featuredCount = projects.filter((project) => project.featured).length;
  if (featuredCount !== 1) throw new Error(`Projects must have exactly one featured row; found ${featuredCount}.`);

  for (const [sheetName, key, valueField] of [["Project Features", "features", "Feature"], ["Project Roadmap", "roadmap", "Step"]]) {
    const buckets = new Map();
    for (const row of records(sheets, sheetName)) {
      const id = clean(row["Project ID"]);
      const value = clean(row[valueField]);
      if (!ids.has(id) || !value) continue;
      if (!buckets.has(id)) buckets.set(id, []);
      buckets.get(id).push({ order: order(row), value });
    }
    for (const project of projects) project[key] = (buckets.get(project.id) || []).sort((a, b) => a.order - b.order).map((item) => item.value);
  }

  const endpointRows = new Map();
  for (const row of records(sheets, "Project Endpoints")) {
    const id = clean(row["Project ID"]);
    if (!ids.has(id)) continue;
    if (!endpointRows.has(id)) endpointRows.set(id, []);
    endpointRows.get(id).push({ order: order(row), value: { method: clean(row.Method), path: clean(row.Path), purpose: clean(row.Purpose) } });
  }
  const screenRows = new Map();
  for (const row of records(sheets, "Project Screens")) {
    const id = clean(row["Project ID"]);
    if (!ids.has(id) || !clean(row.Title)) continue;
    if (!screenRows.has(id)) screenRows.set(id, []);
    screenRows.get(id).push({ order: order(row), value: { title: clean(row.Title), content: String(row["HTML mockup content"] ?? "") } });
  }
  const imageRows = new Map();
  for (const row of records(sheets, "Project Images")) {
    const id = clean(row["Project ID"]);
    const url = clean(row["Image URL or relative path"]);
    if (!ids.has(id) || !url) continue;
    if (!imageRows.has(id)) imageRows.set(id, []);
    imageRows.get(id).push({ order: order(row), value: { title: clean(row.Title), url } });
  }
  for (const project of projects) {
    const sorted = (map) => (map.get(project.id) || []).sort((a, b) => a.order - b.order).map((item) => item.value);
    project.endpoints = sorted(endpointRows);
    project.screens = sorted(screenRows);
    project.screenshots = sorted(imageRows);
    if (project.type === "concept" && !project.screenshots.length && !project.screens.length) {
      throw new Error(`Concept '${project.id}' needs at least one Project Screens or Project Images row.`);
    }
  }
  return { projects };
}

function makeAchievements(sheets) {
  const settings = records(sheets, "Settings");
  const profileUrl = clean(settings.find((row) => clean(row.Setting) === "HackerRank profile URL")?.["Editable value"]);
  const badges = records(sheets, "Badges").filter((row) => clean(row.Name)).map((row) => ({ name: clean(row.Name), description: clean(row.Description), symbol: clean(row.Symbol), style: clean(row["Style class"]) }));
  const certificates = records(sheets, "Certificates").filter((row) => clean(row.Name)).map((row) => ({ name: clean(row.Name), shortName: clean(row["Short name"]), url: clean(row["Verification URL"]), provider: clean(row.Provider), ...(clean(row["Image path"]) ? { image: clean(row["Image path"]) } : {}) }));
  return { profileUrl, badges, certificates };
}

async function writeJson(name, value) {
  const destination = path.join(DATA_DIR, name);
  const temporary = `${destination}.tmp`;
  await fs.writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await fs.rename(temporary, destination);
}

async function main() {
  const buffer = await fs.readFile(workbookFile);
  const sheets = readWorkbook(zipFiles(buffer));
  const output = [
    ["site-content.json", makeSite(sheets)],
    ["experience.json", makeExperience(sheets)],
    ["tech-stack.json", makeSkills(sheets)],
    ["projects.json", makeProjects(sheets)],
    ["achievements.json", makeAchievements(sheets)],
  ];
  for (const [name, data] of output) {
    await writeJson(name, data);
    console.log(`Updated assets/data/${name}`);
  }
  console.log("Portfolio JSON export complete.");
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
