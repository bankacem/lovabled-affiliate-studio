# نقل المقالات إلى GitHub (بدون قاعدة بيانات)

الهدف: تصبح المقالات ملفات داخل مستودع GitHub، والموقع يقرأها منها مباشرة عند البناء على Vercel. لا اعتماد على قاعدة البيانات (المتوقفة حالياً) ولا عليّ في تخزين المحتوى، ولا تضارب بين مصدرين.

## 1. مصدر واحد للحقيقة: مجلد المحتوى في المستودع

- إنشاء `content/blog/<slug>.md` داخل المستودع (465 مقال من الأرشيف المُصدَّر).
- كل ملف = frontmatter YAML نظيف + جسم المقال:
  `title, slug, description, category, tags, author, image, image_alt, date, updated, status (published|draft|scheduled), scheduled_at, read_time`
- تنظيف ملفات الأرشيف الحالية: حذف التكرار (بلوكات frontmatter/JSON-LD المكررة) والاحتفاظ بالمحتوى الفعلي فقط.

## 2. الموقع يقرأ من الملفات

- سكربت بناء يولّد `blog-index.json` خفيف (slug/عنوان/وصف/صورة/تصنيف/تاريخ) + ملف JSON لكل مقال.
- `Blog.tsx` و`BlogPost.tsx` و`LatestPosts.tsx` تقرأ من هذه الملفات بدل الاستعلام من قاعدة البيانات — لا `Failed to fetch` بعد اليوم.
- الجدولة: مقال بحالة `scheduled` وتاريخ في الماضي يُنشر تلقائياً عند أي بناء (Vercel يبني يومياً عبر cron).
- تحديث `prerender-setup.mjs` / `create-static-fallbacks.mjs` / `sitemap` لتعتمد على المحتوى المحلي بدل قاعدة البيانات، مع صفحات HTML ثابتة وميتا كاملة لكل مقال (SEO أقوى من الآن).

## 3. لوحة التحكم تنشر إلى GitHub مباشرة

- الدخول للوحة التحكم يصبح بكلمة مرور محلية بسيطة (بدون قاعدة بيانات) — يحل مشكلة تعذّر الدخول الحالية.
- محرّر المقالات يكتب/يعدّل الملف عبر GitHub REST API مباشرة (commit إلى `main`) باستخدام **GitHub Personal Access Token** تُدخله أنت مرة واحدة ويُحفظ في متصفحك فقط.
- كل حفظ = commit → Vercel يبني تلقائياً → المقال يظهر على aiprintverse.com. بدون أي وسيط.
- مولّد المقالات بالذكاء الاصطناعي: يبقى كما هو لكن الحفظ يذهب إلى GitHub بدل قاعدة البيانات.

## 4. ما يبقى على قاعدة البيانات

التصاميم (designs) والإحصائيات تبقى كما هي حالياً؛ المقالات فقط تنتقل إلى GitHub. لن يكون هناك مصدران للمقالات، فلا تضارب.

## ما أحتاجه منك

**GitHub Personal Access Token** (fine-grained، صلاحية Contents: Read and write على مستودع `bankacem/lovabled-affiliate-studio`) — يُدخل داخل لوحة التحكم لاحقاً، لا حاجة لإرساله لي الآن.

## تفاصيل تقنية

- المسار: `content/blog/*.md`، تحويل بسكربت `scripts/migrate-export-to-content.mjs`.
- قراءة المحتوى في وقت البناء بـ Node (لا `import.meta.glob` بحجم كامل) لتجنّب تضخم الحزمة: `public/blog-index.json` + `public/blog/<slug>.json`.
- النشر من اللوحة: `PUT /repos/:owner/:repo/contents/content/blog/<slug>.md` مع `sha` للتعديل.
