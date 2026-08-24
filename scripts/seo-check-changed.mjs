import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const blogDir = path.join(root, "content", "blog");
const args = process.argv.slice(2).filter(Boolean);

function changedFiles() {
  if (args.length) return args.map((file) => path.resolve(root, file));
  try {
    const output = execFileSync("git", ["diff", "--name-only", "origin/main...HEAD", "--", "content/blog/*.md"], { cwd: root, encoding: "utf8" });
    return output.split(/\r?\n/).filter(Boolean).map((file) => path.resolve(root, file));
  } catch {
    return [];
  }
}

function frontMatter(raw) {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!match) return { fields: {}, body: raw };
  const fields = {};
  for (const line of match[1].split(/\r?\n/)) {
    const field = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/);
    if (field) fields[field[1]] = field[2].trim().replace(/^['"]|['"]$/g, "");
  }
  return { fields, body: match[2] };
}

function stripHtml(text) {
  return text.replace(/<(script|style|iframe)[^>]*>[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]*>/g, " ").replace(/&[^;]+;/g, " ").replace(/\s+/g, " ").trim();
}

const files = changedFiles().filter((file) => file.startsWith(blogDir + path.sep) && file.endsWith(".md") && fs.existsSync(file));
if (!files.length) {
  console.log("SEO check: no changed blog files detected; nothing to check.");
  process.exit(0);
}

const slugMap = new Map();
for (const file of fs.readdirSync(blogDir).filter((name) => name.endsWith(".md"))) {
  const parsed = frontMatter(fs.readFileSync(path.join(blogDir, file), "utf8"));
  const slug = parsed.fields.slug || file.slice(0, -3);
  slugMap.set(slug, file);
}

const errors = [];
const warnings = [];
const changedSlugs = new Map();
for (const file of files) {
  const relative = path.relative(root, file);
  const parsed = frontMatter(fs.readFileSync(file, "utf8"));
  const { fields, body } = parsed;
  const title = fields.title || "";
  const description = fields.description || "";
  const slug = fields.slug || "";
  const text = stripHtml(body);
  const wordCount = text ? text.split(/\s+/).length : 0;
  const label = `${relative}`;
  if (!title || !description || !slug) errors.push(`${label}: title, description, and slug are required`);
  if (title.length > 70) warnings.push(`${label}: title is ${title.length} characters`);
  if (description.length > 180) warnings.push(`${label}: description is ${description.length} characters`);
  if (description.length < 100) warnings.push(`${label}: description is only ${description.length} characters`);
  if ((body.match(/<h1\b/gi) || []).length !== 1) errors.push(`${label}: expected exactly one H1`);
  if (body.includes('href="#"') || body.includes("href='#'")) errors.push(`${label}: placeholder href="#" found`);
  if (/دليل إرشادي إضافي وتحسينات|سطر البحث|تجاوز 1500 كلمة|Google Keyword Planner/.test(body)) errors.push(`${label}: generic SEO boilerplate detected`);
  if (/[\u0600-\u06ff]/.test(body)) warnings.push(`${label}: Arabic text detected; verify language intent manually`);
  if (wordCount < 250) warnings.push(`${label}: body is only ${wordCount} words; verify search intent and completeness`);
  if (slug) {
    if (changedSlugs.has(slug)) errors.push(`${label}: duplicate slug with ${changedSlugs.get(slug)}`);
    changedSlugs.set(slug, label);
  }
  const links = [...body.matchAll(/\bhref\s*=\s*["']([^"']+)["']/gi)].map((match) => match[1]);
  for (const href of links) {
    if (!href.startsWith("/blog/")) continue;
    const linkedSlug = href.slice("/blog/".length).split(/[?#]/)[0];
    const canonical = linkedSlug.startsWith("p-") ? linkedSlug.slice(2) : linkedSlug;
    if (!slugMap.has(linkedSlug) && !slugMap.has(canonical)) errors.push(`${label}: internal link does not resolve: ${href}`);
    if (linkedSlug.startsWith("p-") && slugMap.has(canonical)) warnings.push(`${label}: legacy p- link should be replaced by canonical: ${href}`);
  }
}

for (const error of errors) console.error(`ERROR ${error}`);
for (const warning of warnings) console.warn(`WARN ${warning}`);
console.log(`SEO check: ${files.length} changed blog file(s), ${errors.length} error(s), ${warnings.length} warning(s).`);
process.exit(errors.length ? 1 : 0);
