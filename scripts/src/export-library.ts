import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

// Load environment variables from parent folder's .env
dotenv.config({ path: path.join(process.cwd(), "..", ".env") });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
const SUPABASE_PUBLISHABLE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error("Missing Supabase credentials in .env file.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

function cleanHtmlText(text: string): string {
  if (!text) return "";
  let clean = text.replace(/<(script|style|iframe)[^>]*>[\s\S]*?<\/\1>/gi, " ");
  clean = clean.replace(/<[^>]*>/g, " ");
  return clean.replace(/\s+/g, " ").trim();
}

async function exportLibrary() {
  console.log("Fetching all blog posts from Supabase...");
  const { data: posts, error } = await supabase
    .from("blog_posts")
    .select("*");

  if (error) {
    console.error("Error fetching posts:", error);
    process.exit(1);
  }

  if (!posts || posts.length === 0) {
    console.log("No blog posts found in the database.");
    return;
  }

  console.log(`Found ${posts.length} posts. Writing to .seoagent/content/...`);

  // Target directory
  const targetDir = path.join(process.cwd(), "..", ".seoagent", "content");
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  for (const post of posts) {
    if (!post.slug) {
      console.warn(`Skipping post with ID ${post.id} because slug is missing.`);
      continue;
    }

    const filepath = path.join(targetDir, `${post.slug}.md`);

    // Skip if the file already exists and is the best-seo-plugins article (to avoid overwriting our premium version)
    if (post.slug === "best-seo-plugins-beginners-2026" && fs.existsSync(filepath)) {
      console.log(`Skipping ${post.slug}.md as it already exists.`);
      continue;
    }

    const cleanContent = cleanHtmlText(post.content || "");
    const words = cleanContent.split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    // Build YAML metadata properties
    const author = post.author_name || "فريق كتابة AIPrintVerse";
    const publishedAt = post.published_at ? new Date(post.published_at).toISOString().split("T")[0] : "2026-07-24";
    const updatedAt = post.updated_at ? new Date(post.updated_at).toISOString().split("T")[0] : "2026-07-24";
    const excerpt = post.excerpt || post.meta_description || "";
    const featuredImage = post.featured_image || "https://aiprintverse.com/images/default-blog.jpg";
    const keywords = Array.isArray(post.keywords) ? post.keywords.join(", ") : (post.keywords || "");

    const yamlFrontmatter = `title: "${post.title || "Untitled"}"
description: "${excerpt.replace(/"/g, '\\"')}"
keywords: "${keywords}"
author: "${author}"
date: "${publishedAt}"
last_modified: "${updatedAt}"
canonical: "https://aiprintverse.com/blog/${post.slug}"
featured_image: "${featuredImage}"
featured_image_alt: "${(post.title || "Untitled").replace(/"/g, '\\"')}"
article_type: "Guide"
word_count: ${wordCount}
reading_time: "${post.read_time || "10 دقائق"}"`;

    // Construct valid JSON-LD schema markup
    const schemaObj = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Article",
          "@id": `https://aiprintverse.com/blog/${post.slug}#article`,
          "isPartOf": {
            "@id": `https://aiprintverse.com/blog/${post.slug}`
          },
          "headline": post.title || "Untitled",
          "description": excerpt,
          "image": featuredImage,
          "datePublished": publishedAt,
          "dateModified": updatedAt,
          "author": {
            "@type": "Person",
            "name": author,
            "url": "https://aiprintverse.com/about"
          },
          "publisher": {
            "@type": "Organization",
            "name": "AIPrintVerse",
            "url": "https://aiprintverse.com",
            "logo": {
              "@type": "ImageObject",
              "url": "https://aiprintverse.com/logo.png"
            }
          },
          "articleSection": post.category || "General",
          "keywords": keywords
        },
        {
          "@type": "FAQPage",
          "@id": `https://aiprintverse.com/blog/${post.slug}#faq`,
          "mainEntity": [
            {
              "@type": "Question",
              "name": `ما هو موضوع ${post.title || "المقال"}؟`,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": excerpt || "هذا المقال يقدم تفاصيل شاملة ومعلومات قيمة حول الموضوع المذكور."
              }
            }
          ]
        },
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "الرئيسية",
              "item": "https://aiprintverse.com"
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "المدونة",
              "item": "https://aiprintverse.com/blog"
            },
            {
              "@type": "ListItem",
              "position": 3,
              "name": post.title || "Untitled",
              "item": `https://aiprintverse.com/blog/${post.slug}`
            }
          ]
        }
      ]
    };

    const fileContent = `# ${post.title || "Untitled"}

---

## 📋 Frontmatter (SEO Metadata)

\`\`\`yaml
${yamlFrontmatter}
\`\`\`

---

## 💎 JSON-LD Schema Markup

\`\`\`json
${JSON.stringify(schemaObj, null, 2)}
\`\`\`

---

## 📋 محتوى المقالة

${post.content || ""}
`;

    fs.writeFileSync(filepath, fileContent, "utf-8");
  }

  console.log("Successfully exported all blog posts as markdown files!");
}

exportLibrary();
