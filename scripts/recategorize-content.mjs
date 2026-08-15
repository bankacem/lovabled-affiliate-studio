// One-time: assigns a real topical category to each content/blog/*.md file
// based on its title/slug keywords (the export archive lost the original ones).

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DIR = process.argv[2] || "content/blog";

const RULES = [
  ["Weddings & Bridal", /wedding|bride|bridal|bridesmaid|groom|bachelorette|bachelor|maid-of-honor|just-married|engage/i],
  ["Birthdays & Parties", /birthday|party|gender-reveal|graduation|anniversar/i],
  ["Gifts", /gift|present|keepsake|souvenir/i],
  ["Mugs & Drinkware", /mug|tumbler|drinkware|coffee-cup/i],
  ["Stickers", /sticker|decal/i],
  ["Home Decor", /poster|wall-art|pillow|canvas|home-decor|print-at-home|frame/i],
  ["Phone Cases & Accessories", /phone-case|tote|bag|hat|cap|accessor/i],
  ["Hoodies & Sweatshirts", /hoodie|sweatshirt|sweater/i],
  ["Vintage & Retro", /vintage|retro|80s|90s|nostalg|thrift/i],
  ["Print on Demand Business", /print-on-demand|pod|teespring|redbubble|teepublic|etsy|merch|dropship|profit|business|wholesale|bulk|sell/i],
  ["Design & AI Tools", /ai-|artificial-intelligence|design|graphic|generator|typography|illustrat|canva|photoshop/i],
  ["Printing Guides", /dtf|dtg|screen-print|sublimation|heat-press|iron-on|gang-sheet|printing|how-to-print|remove-print/i],
  ["SEO & Marketing", /seo|keyword|traffic|marketing|google|blog-post/i],
  ["Style Guides", /style|outfit|wear|fashion|streetwear|fit|size|guide-to-t-shirt/i],
  ["T-Shirts", /shirt|tee|tank-top|v-neck|apparel/i],
];

function categorize(slug, title) {
  const hay = `${slug} ${title}`.toLowerCase();
  for (const [name, re] of RULES) if (re.test(hay)) return name;
  return "Guides";
}

let changed = 0;
const counts = {};
for (const file of readdirSync(DIR).filter((f) => f.endsWith(".md"))) {
  const path = join(DIR, file);
  const raw = readFileSync(path, "utf8");
  const titleMatch = raw.match(/^title:\s*"?(.*?)"?$/m);
  const cat = categorize(file.replace(/\.md$/, ""), titleMatch ? titleMatch[1] : "");
  counts[cat] = (counts[cat] || 0) + 1;
  const next = raw.replace(/^category:\s*.*$/m, `category: ${JSON.stringify(cat)}`);
  if (next !== raw) { writeFileSync(path, next); changed++; }
}

console.log(`Recategorized ${changed} files`);
console.log(Object.entries(counts).sort((a, b) => b[1] - a[1]));
