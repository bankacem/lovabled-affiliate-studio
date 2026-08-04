#!/usr/bin/env -S npx tsx
// A self-contained, portable SEO writing agent — no Supabase, no Deno, no
// framework. Copy this whole seoagent-export/ folder into any project and
// it works the same way, as long as Node + a couple of API keys are
// available. That portability is the whole point of this folder.
//
// USAGE:
//   OPENROUTER_API_KEY=... SERPER_API_KEY=... npx tsx write-article.ts "best hiking backpacks 2026"
//
// Env vars (all optional except one writing key):
//   OPENROUTER_API_KEY   — preferred writing + analysis provider
//   GROQ_API_KEY          — used if OpenRouter key is absent
//   SERPER_API_KEY        — enables real competitor research (google.serper.dev).
//                           Without it, the agent still writes an article,
//                           it just skips the "outrank competitors" step
//                           honestly instead of faking an analysis.
//   OUTPUT_DIR             — defaults to ./content (same folder seo-audit-
//                           seoagent.ts already reads from)
//
// Pipeline (same shape as the one built into the AIPrintVerse project,
// ported here so it's reusable anywhere — deliberately simple, capped at
// one corrective rewrite, no open-ended agent loop):
//   1. Competitor research  (skipped gracefully if no SERPER_API_KEY)
//   2. Write the article
//   3. Evaluate (free rule checks + one AI call to verify gaps were covered)
//   4. If it scores below the threshold: exactly ONE corrective rewrite
//   5. Write a .md file in the same frontmatter format seo-audit-
//      seoagent.ts already knows how to read

import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
const GROQ_KEY = process.env.GROQ_API_KEY;
const SERPER_KEY = process.env.SERPER_API_KEY;
const OUTPUT_DIR = process.env.OUTPUT_DIR || resolve(__dirname, "content");
const QUALITY_THRESHOLD = 75;

const keyword = process.argv[2];
if (!keyword) {
  console.error('Usage: npx tsx write-article.ts "your keyword here"');
  process.exit(1);
}
if (!OPENROUTER_KEY && !GROQ_KEY) {
  console.error("Set OPENROUTER_API_KEY or GROQ_API_KEY before running this.");
  process.exit(1);
}

async function callLLM(prompt: string, maxTokens = 4000): Promise<string> {
  if (OPENROUTER_KEY) {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENROUTER_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "anthropic/claude-sonnet-4",
        messages: [{ role: "user", content: prompt }],
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
    });
    if (!r.ok) throw new Error(`OpenRouter error: ${r.status} ${await r.text()}`);
    const d = await r.json();
    return d.choices?.[0]?.message?.content ?? "";
  }
  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });
  if (!r.ok) throw new Error(`Groq error: ${r.status} ${await r.text()}`);
  const d = await r.json();
  return d.choices?.[0]?.message?.content ?? "";
}

// ---------- Step 1: competitor research ----------

async function researchCompetitors(kw: string): Promise<string | null> {
  if (!SERPER_KEY) {
    console.log("→ No SERPER_API_KEY set, skipping competitor research (writing without it).");
    return null;
  }
  console.log("→ Searching top 3 Google results for:", kw);
  const searchResp = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: { "X-API-KEY": SERPER_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ q: kw, num: 5 }),
  });
  if (!searchResp.ok) {
    console.warn("  Search failed, continuing without competitor research:", searchResp.status);
    return null;
  }
  const searchData = await searchResp.json();
  const organic = (searchData.organic || []).slice(0, 3) as Array<{ link: string; title: string; snippet?: string }>;
  if (organic.length === 0) return null;

  const pages = [];
  for (const result of organic) {
    try {
      const pageResp = await fetch(result.link, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; SEOAgentBot/1.0)" },
        signal: AbortSignal.timeout(8000),
      });
      const html = await pageResp.text();
      const text = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 4000);
      pages.push({ url: result.link, title: result.title, text });
    } catch {
      pages.push({ url: result.link, title: result.title, text: "[could not fetch]" });
    }
  }

  console.log("→ Analyzing competitor gaps...");
  const analysisPrompt = `You are a senior SEO strategist. Here are the top 3 Google results for "${kw}":

${pages.map((p, i) => `--- Competitor ${i + 1}: ${p.url} ---\nTitle: ${p.title}\nContent: ${p.text}\n`).join("\n")}

Identify their CONCRETE weaknesses (missing subtopics, outdated info, no comparison table, no FAQ, thin sections). Respond with ONLY a short bulleted list (5-8 bullets) of specific instructions for how a new article should exploit these exact gaps. No preamble.`;

  return await callLLM(analysisPrompt, 800);
}

// ---------- Step 2: write ----------

async function writeArticle(kw: string, competitorBrief: string | null, revisionFeedback: string | null): Promise<string> {
  console.log(revisionFeedback ? "→ Writing corrective revision..." : "→ Writing article...");
  const prompt = `Write a comprehensive SEO-optimized article in HTML about: "${kw}"

Structure: one <h1> title, a short intro <p>, a table of contents, multiple <h2>/<h3> sections, a <table> comparison where relevant, and a FAQ section with 4-6 questions.

${competitorBrief ? `COMPETITIVE INTELLIGENCE — the top-ranking pages were analyzed. To outrank them, this article MUST:\n${competitorBrief}\n` : ""}
${revisionFeedback ? `REVISION REQUIRED — a quality check found these specific problems, fix them:\n${revisionFeedback}\n` : ""}

Write like a real human expert. Avoid AI-sounding clichés ("in conclusion", "delve into", "tapestry of", "in today's digital world"). Minimum 1000 words.`;

  return await callLLM(prompt, 6000);
}

// ---------- Step 3: evaluate (same rule checks as seo-audit-seoagent.ts) ----------

const AI_CLICHE_PHRASES = ["in conclusion", "in today's digital", "delve into", "tapestry of", "in the world of", "unlock the", "elevate your", "game-changer"];

function ruleCheck(content: string): { score: number; issues: string[] } {
  const text = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const wordCount = text.split(" ").filter(Boolean).length;
  let score = 100;
  const issues: string[] = [];

  if (wordCount < 800) {
    score -= Math.min(30, Math.round((800 - wordCount) / 20));
    issues.push(`Too short: ${wordCount} words (recommended 800+).`);
  }
  const lower = text.toLowerCase();
  const cliches = AI_CLICHE_PHRASES.filter((p) => lower.includes(p));
  if (cliches.length > 0) {
    score -= Math.min(20, cliches.length * 5);
    issues.push(`AI clichés found: ${cliches.join(", ")}.`);
  }
  if (!/faq|frequently asked/i.test(content)) {
    score -= 10;
    issues.push("No FAQ section found.");
  }
  const h2Count = (content.match(/<h2/gi) || []).length;
  if (h2Count < 2) {
    score -= 10;
    issues.push(`Weak structure: only ${h2Count} H2 section(s).`);
  }
  return { score: Math.max(0, score), issues };
}

async function checkGapCoverage(kw: string, content: string, competitorBrief: string): Promise<{ addressed: boolean; feedback: string }> {
  const prompt = `Keyword: "${kw}"
The competitor gap analysis said the article MUST: ${competitorBrief}
Article (truncated): ${content.replace(/<[^>]+>/g, " ").slice(0, 6000)}
Did it address most of those points? Reply EXACTLY:
VERDICT: yes or no
FEEDBACK: one short sentence on what's still missing, or "none".`;
  const text = await callLLM(prompt, 150);
  const verdict = text.match(/VERDICT:\s*(yes|no)/i);
  const feedback = text.match(/FEEDBACK:\s*(.+)/i);
  return {
    addressed: verdict ? verdict[1].toLowerCase() === "yes" : true,
    feedback: feedback && feedback[1].trim() !== "none" ? feedback[1].trim() : "",
  };
}

// ---------- Step 4: save as .md matching seo-audit-seoagent.ts's expected format ----------

function extractTitle(content: string, fallback: string): string {
  const m = content.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  return m ? m[1].replace(/<[^>]+>/g, "").trim() : fallback;
}

function extractExcerpt(content: string): string {
  const m = content.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  return m ? m[1].replace(/<[^>]+>/g, "").trim().slice(0, 155) : "";
}

function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 100);
}

function saveAsMarkdown(title: string, content: string, description: string) {
  const slug = slugify(title);
  const today = new Date().toISOString().slice(0, 10);
  const esc = (s: string) => s.replace(/"/g, '\\"');
  const md = `---
title: "${esc(title)}"
description: "${esc(description)}"
author: "SEO Writing Agent"
date: "${today}"
last_modified: "${today}"
canonical: "https://example.com/blog/${slug}"
featured_image: ""
---

${content}
`;
  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });
  const outPath = resolve(OUTPUT_DIR, `${slug}.md`);
  writeFileSync(outPath, md, "utf-8");
  return outPath;
}

// ---------- Orchestration ----------

async function main() {
  const competitorBrief = await researchCompetitors(keyword);

  let content = await writeArticle(keyword, competitorBrief, null);
  let evalResult = ruleCheck(content);
  let issues = [...evalResult.issues];

  if (competitorBrief) {
    const gap = await checkGapCoverage(keyword, content, competitorBrief);
    if (!gap.addressed) {
      evalResult.score -= 20;
      if (gap.feedback) issues.push(`Competitor gaps not addressed: ${gap.feedback}`);
    }
  }

  console.log(`→ Score: ${evalResult.score}/100`);
  if (issues.length) console.log("  Issues:", issues.join(" | "));

  if (evalResult.score < QUALITY_THRESHOLD && issues.length > 0) {
    content = await writeArticle(keyword, competitorBrief, issues.join(" "));
    const secondCheck = ruleCheck(content);
    console.log(`→ Revised score: ${secondCheck.score}/100`);
  }

  const title = extractTitle(content, keyword);
  const description = extractExcerpt(content);
  const outPath = saveAsMarkdown(title, content, description);
  console.log(`\n✅ Saved: ${outPath}`);
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
