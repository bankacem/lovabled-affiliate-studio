import * as fs from "fs";
import * as path from "path";

interface AuditDetails {
  score: number;
  wordCount: number;
  deductions: { reason: string; points: number }[];
  recommendations: string[];
}

const AI_PATTERNS = [
  "in conclusion", "خاتمة", "في الختام",
  "tapestry of", "نسيج من",
  "not only but also", "ليس فقط بل أيضا",
  "delve into", "التعمق في",
  "testament to", "شهادة على",
  "crucial to remember", "من المهم أن نتذكر",
  "vital role", "دور حيوي",
  "it's important to note", "تجدر الإشارة إلى",
  "realm of", "مجال",
  "moreover", "علاوة على ذلك",
  "furthermore", "بالإضافة إلى ذلك"
];

const PLACEHOLDERS = [
  "lorem ipsum",
  "placeholder",
  "todo",
  "insert here",
  "text goes here",
  "your name here",
  "[insert",
  "[your"
];

function cleanHtmlText(text: string): string {
  if (!text) return "";
  // Strip any HTML tags if present
  let clean = text.replace(/<(script|style|iframe)[^>]*>[\s\S]*?<\/\1>/gi, " ");
  clean = clean.replace(/<[^>]*>/g, " ");
  // Normalize whitespaces
  return clean.replace(/\s+/g, " ").trim();
}

function calculateQualityDetails(page: any): AuditDetails {
  let score = 100;
  const deductions: { reason: string; points: number }[] = [];
  const recommendations: string[] = [];
  let wordCount = 0;

  // 1. Missing Title / H1
  const title = (page.title || "").trim();
  if (!title || title.toLowerCase() === "untitled" || title.toLowerCase() === "draft") {
    score -= 40;
    deductions.push({ reason: "Missing or generic H1/Title / عنوان H1 مفقود أو غير محدد", points: 40 });
    recommendations.push("Add a specific and optimized H1 Title. / أضف عنوان H1 مخصص ومحسن.");
  }

  // 2. Word count
  const content = page.content || "";
  const cleanText = cleanHtmlText(content);
  const words = cleanText.split(/\s+/).filter(Boolean);
  wordCount = words.length;

  if (wordCount === 0) {
    score -= 100;
    deductions.push({ reason: "No content found on page / لا يوجد محتوى في الصفحة", points: 100 });
    recommendations.push("Write a comprehensive article with at least 800 words. / اكتب مقالاً شاملاً لا يقل عن 800 كلمة.");
  } else if (wordCount < 250) {
    score -= 45;
    deductions.push({ reason: `Extremely thin content (${wordCount} words) / محتوى قصير جداً (${wordCount} كلمة)`, points: 45 });
    recommendations.push("Increase content length significantly; aim for at least 800 words. / زد طول المحتوى بشكل كبير؛ استهدف 800 كلمة على الأقل.");
  } else if (wordCount < 500) {
    score -= 30;
    deductions.push({ reason: `Thin content (${wordCount} words) / محتوى قصير (${wordCount} كلمة)`, points: 30 });
    recommendations.push("Expand on the article's details to solve user query thoroughly. / توسع في تفاصيل المقال لحل استفسار المستخدم تمامًا.");
  } else if (wordCount < 800) {
    score -= 15;
    deductions.push({ reason: `Below recommended 800 words (${wordCount} words) / أقل من الـ 800 كلمة الموصى بها (${wordCount} كلمة)`, points: 15 });
    recommendations.push("Add sub-topics or visual/textual details to cross 800 words. / أضف موضوعات فرعية أو تفاصيل مرئية/نصية لتجاوز 800 كلمة.");
  } else if (wordCount >= 1200) {
    score += 5; // Reward long-form content
  }

  // 3. AI Repetitive Patterns
  let aiMatchCount = 0;
  const cleanLower = cleanText.toLowerCase();
  AI_PATTERNS.forEach((pattern) => {
    const regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    const matches = cleanLower.match(regex);
    if (matches && matches.length > 2) {
      aiMatchCount += matches.length;
    }
  });

  if (aiMatchCount > 5) {
    score -= 15;
    deductions.push({ reason: `Excessive AI boilerplate phrases (${aiMatchCount} matches) / عبارات ذكاء اصطناعي متكررة وكليشيهات (${aiMatchCount} تطابق)`, points: 15 });
    recommendations.push("Rewrite content to sound more human-like; remove repetitive transition phrases. / أعد كتابة المحتوى ليبدو أكثر بشرية؛ وأزل العبارات الانتقالية المكررة.");
  }

  // 4. Placeholder text in content
  let placeholderMatch = false;
  PLACEHOLDERS.forEach((placeholder) => {
    if (cleanLower.includes(placeholder)) {
      placeholderMatch = true;
    }
  });
  if (placeholderMatch) {
    score -= 25;
    deductions.push({ reason: "Contains placeholder text/TODOs / يحتوي على نص مؤقت أو ملاحظات معلقة", points: 25 });
    recommendations.push("Remove any placeholder text or incomplete TODO brackets. / قم بإزالة أي نصوص مؤقتة أو أقواس TODO غير المكتملة.");
  }

  // 5. Missing FAQ Section
  const faqKeywords = ["faq", "frequently asked", "frequent questions", "أسئلة شائعة", "سؤال وجواب", "الأسئلة الشائعة"];
  const hasFaq = faqKeywords.some(kw => cleanLower.includes(kw));
  if (!hasFaq && wordCount > 0) {
    score -= 5;
    deductions.push({ reason: "Missing FAQ section / قسم الأسئلة الشائعة مفقود", points: 5 });
    recommendations.push("Add a Frequently Asked Questions (FAQ) section to target rich search snippets. / أضف قسم الأسئلة الشائعة (FAQ) لاستهداف مقتطفات البحث الغنية.");
  }

  // 6. Missing Meta Description
  const metaDesc = (page.meta_description || "").trim();
  if (!metaDesc) {
    score -= 15;
    deductions.push({ reason: "Missing Meta Description / الوصف الميتا مفقود", points: 15 });
    recommendations.push("Add a high-CTR meta description (120-160 characters). / أضف وصف ميتا جذاب ونسبة نقر عالية (120-160 حرفًا).");
  } else if (metaDesc.length < 80) {
    score -= 5;
    deductions.push({ reason: `Meta Description too short (${metaDesc.length} chars) / الوصف الميتا قصير جداً (${metaDesc.length} حرفًا)`, points: 5 });
    recommendations.push("Expand the meta description to at least 100-160 characters. / قم بزيادة طول الوصف الميتا إلى 100-160 حرفًا على الأقل.");
  }

  // 7. Missing OG Image
  const ogImage = page.featured_image || "";
  if (!ogImage || !ogImage.startsWith("http")) {
    score -= 15;
    deductions.push({ reason: "Missing or invalid OG Featured Image / الصورة البارزة مفقودة أو غير صالحة", points: 15 });
    recommendations.push("Provide a high-quality featured image URL. / أضف رابط صورة بارزة عالي الجودة.");
  }

  // 8. Missing Structured Data inputs
  if (!page.author_name || !page.published_at) {
    score -= 10;
    deductions.push({ reason: "Missing metadata for Article Structured Data / بيانات منظم المقال مفقودة (الكاتب أو تاريخ النشر)", points: 10 });
    recommendations.push("Ensure author name and publish dates are properly filled. / تأكد من ملء اسم الكاتب وتواريخ النشر بشكل صحيح.");
  }

  // Bound score between 0 and 100
  score = Math.max(0, Math.min(100, score));

  return {
    score,
    wordCount,
    deductions,
    recommendations
  };
}

// Main execution function
function run() {
  // Start from process.cwd() and go up until we find .seoagent/content or reach root
  let current = process.cwd();
  let contentDir = path.join(current, ".seoagent", "content");
  let rootDir = current;
  while (!fs.existsSync(contentDir) && current !== path.parse(current).root) {
    current = path.dirname(current);
    contentDir = path.join(current, ".seoagent", "content");
    rootDir = current;
  }

  if (!fs.existsSync(contentDir)) {
    console.error("Content directory not found:", contentDir);
    return;
  }

  const files = fs.readdirSync(contentDir).filter(f => f.endsWith(".md"));
  if (files.length === 0) {
    console.log("No markdown articles found in", contentDir);
    return;
  }

  let fullReportMarkdown = `# تقرير تدقيق الـ SEO وتحليل مقالات SEOAgent 🚀\n\n`;
  fullReportMarkdown += `*تم إنشاء هذا التقرير تلقائيًا بواسطة **SEOAgent Audit System** في ${new Date().toLocaleDateString("ar-EG")}*\n\n`;

  console.log(`\n======================================================`);
  console.log(`🔍 Starting SEOAgent Articles Audit (${files.length} files found)`);
  console.log(`======================================================\n`);

  for (const file of files) {
    const filePath = path.join(contentDir, file);
    const rawContent = fs.readFileSync(filePath, "utf-8");

    // Parse Metadata/Frontmatter
    let metadata: any = {};
    const metadataMatch = rawContent.match(/```[a-z]*\r?\n([\s\S]*?)\r?\n```/i);
    if (metadataMatch) {
      const metadataStr = metadataMatch[1];
      const lines = metadataStr.split("\n");
      for (const line of lines) {
        const parts = line.split(":");
        if (parts.length >= 2) {
          const key = parts[0].trim();
          let value = parts.slice(1).join(":").trim();
          // Strip quotes
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.substring(1, value.length - 1);
          }
          metadata[key] = value;
        }
      }
    }

    // Fallbacks if metadata not parsed
    const title = metadata.title || file.replace(/-/g, " ").replace(".md", "");
    const description = metadata.description || "";
    const featured_image = metadata.featured_image || "";
    const author_name = metadata.author || "SEOAgent";
    const published_at = metadata.date || "";

    // Parse the actual article content
    let articleContent = rawContent;
    // Remove the frontmatter and JSON-LD schema blocks from content word count
    articleContent = articleContent.replace(/#+ Frontmatter[\s\S]*?```[\s\S]*?```/gi, "");
    articleContent = articleContent.replace(/#+ JSON-LD Schema[\s\S]*?```json[\s\S]*?```/gi, "");

    const pageObj = {
      title,
      meta_description: description,
      featured_image,
      author_name,
      published_at,
      content: articleContent
    };

    const details = calculateQualityDetails(pageObj);

    // Build the Markdown Report Section
    fullReportMarkdown += `## 📄 المقال: **${title}**\n\n`;
    fullReportMarkdown += `### 📊 نظرة عامة على المقال:\n`;
    fullReportMarkdown += `- **اسم الملف:** \`${file}\`\n`;
    fullReportMarkdown += `- **الكاتب:** \`${author_name}\`\n`;
    fullReportMarkdown += `- **تاريخ النشر:** \`${published_at}\`\n`;
    fullReportMarkdown += `- **عدد الكلمات الفعلي:** \`${details.wordCount}\` كلمة\n`;
    fullReportMarkdown += `- **درجة جودة الـ SEO الإجمالية:** \`${details.score}/100\`\n\n`;

    // Visual Score Meter
    const barLength = 20;
    const filledLength = Math.round((details.score / 100) * barLength);
    const bar = "🟩".repeat(filledLength) + "🟥".repeat(barLength - filledLength);
    fullReportMarkdown += `**مقياس الجودة:**\n> [${bar}] **${details.score}%**\n\n`;

    if (details.deductions.length > 0) {
      fullReportMarkdown += `### 📉 الملاحظات والخصومات النقاطية:\n`;
      for (const deduction of details.deductions) {
        fullReportMarkdown += `- ⚠️ **${deduction.reason}** (خصم \`-${deduction.points}\` نقطة)\n`;
      }
      fullReportMarkdown += `\n`;
    } else {
      fullReportMarkdown += `### 🏆 ممتاز! لم يتم العثور على أي خصومات أو أخطاء SEO.\n\n`;
    }

    fullReportMarkdown += `### 💡 التوصيات المقترحة للتحسين:\n`;
    if (details.recommendations.length > 0) {
      for (const recommendation of details.recommendations) {
        fullReportMarkdown += `- [ ] ${recommendation}\n`;
      }
    } else {
      fullReportMarkdown += `- [x] المقال مثالي ومحسن بالكامل لمحركات البحث (100/100)!\n`;
    }
    fullReportMarkdown += `\n---\n\n`;

    // Print to Console
    console.log(`📄 Article: ${title}`);
    console.log(`------------------------------------------------------`);
    console.log(`- Word Count: ${details.wordCount} words`);
    console.log(`- Quality Score: ${details.score}/100`);
    console.log(`- Status: ${details.score >= 85 ? "Excellent (ممتاز)" : details.score >= 70 ? "Good (جيد)" : "Needs Improvement (يحتاج تحسين)"}`);
    if (details.deductions.length > 0) {
      console.log(`\n📉 Deductions:`);
      for (const d of details.deductions) {
        console.log(`  * [-${d.points} pts] ${d.reason}`);
      }
    }
    if (details.recommendations.length > 0) {
      console.log(`\n💡 Recommendations:`);
      for (const r of details.recommendations) {
        console.log(`  * ${r}`);
      }
    }
    console.log(`\n======================================================\n`);
  }

  // Write to a persistent markdown file
  const reportPath = path.join(rootDir, ".seoagent", "audit_report.md");
  fs.writeFileSync(reportPath, fullReportMarkdown, "utf-8");
  console.log(`💾 Report successfully saved to: ${reportPath}\n`);
}

run();
