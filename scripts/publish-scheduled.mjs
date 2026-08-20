import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const contentDir = resolve(process.cwd(), "content/blog");
const now = Date.now();
let changed = 0;

function readField(raw, key) {
  const match = raw.match(new RegExp(`^${key}:\\s*["']?([^"'\\n]+)["']?\\s*$`, "m"));
  return match?.[1]?.trim() || "";
}

function setField(raw, key, value) {
  const line = `${key}: ${JSON.stringify(value)}`;
  const pattern = new RegExp(`^${key}:.*$`, "m");
  if (pattern.test(raw)) return raw.replace(pattern, line);
  return raw.replace(/^---\n/, `---\n${line}\n`);
}

for (const name of await readdir(contentDir)) {
  if (!name.endsWith(".md")) continue;
  const path = join(contentDir, name);
  const raw = await readFile(path, "utf8");
  const status = readField(raw, "status").toLowerCase();
  const scheduledAt = readField(raw, "scheduled_at");
  const scheduledTime = Date.parse(scheduledAt);
  if (status !== "scheduled" || !scheduledAt || Number.isNaN(scheduledTime) || scheduledTime > now) continue;

  let next = setField(raw, "status", "published");
  next = setField(next, "updated", new Date().toISOString().slice(0, 10));
  if (next !== raw) {
    await writeFile(path, next);
    changed += 1;
    console.log(`Published ${name} (${scheduledAt})`);
  }
}

console.log(`Scheduled publishing completed: ${changed} article(s) changed.`);
