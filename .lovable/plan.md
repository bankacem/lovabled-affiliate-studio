# خطة تحسين شاملة لـ aiprintverse.com

سأقسّم العمل إلى 5 محاور مترابطة، ويتم تنفيذها كلها في هذه الجلسة.

## 1) صور احترافية لكل المقالات (Featured Images)

- تشغيل `MissingImageGenerator` على كل المقالات التي `featured_image IS NULL` عبر Edge Function جديد `bulk-generate-images`.
- المصدر الأساسي: **Pollinations.AI** (مجاني، بدون مفتاح) بـ prompt احترافي:
  - Print-on-demand t-shirt mockup, studio lighting, article title printed on shirt.
- الاحتياطي: **Unsplash** (عبر `search-unsplash` الموجود) عند فشل Pollinations.
- تخزين الرابط الخارجي مباشرة في `blog_posts.featured_image` (لا تخزين محلي — احتراماً لقاعدة الذاكرة).
- عرض العنوان فوق الصورة بـ CSS overlay في `BlogCard` كطبقة إضافية للاحتراف البصري.

## 2) سايت ماب عالمي المستوى

- التحقق من أن `supabase/functions/sitemap/index.ts` يُخرج:
  - كل مقال منشور (`status=published`)
  - كل تصميم
  - الصفحات الثابتة (/, /blog, /designs, /about)
  - `<lastmod>` من `updated_at`
  - `<image:image>` من `featured_image` (Google Image sitemap)
- إضافة `sitemap-index.xml` يشير إلى:
  - `sitemap-posts.xml` (مقسّم لكل 1000 مقال)
  - `sitemap-designs.xml`
  - `sitemap-pages.xml`
- إضافة `<lastmod>` و `changefreq` و `priority` صحيحة.
- تحديث `robots.txt` ليشير إلى `sitemap-index.xml`.

## 3) روابط داخلية وخارجية احترافية

- **داخلية**: تحسين `useAutoLinking` ليقوم بـ:
  - إدراج 3–5 روابط داخلية طبيعية داخل نص المقال (على أول ذكر لكلمة مفتاحية فقط).
  - anchor text طبيعي مأخوذ من عنوان المقال المستهدف.
  - تجنّب التكرار في نفس المقال.
- **خارجية**: إضافة روابط `rel="noopener nofollow"` تلقائياً للاقتباسات (Wikipedia, Google Trends, industry sources).
- **باكلينك داخلي**: قسم "Related Articles" أسفل كل مقال (موجود عبر `InternalLinkBridge`) + "Related Designs" جديد لربط المقالات بالتصاميم.

## 4) واجهة أكثر احترافية

- **Header**: إزالة زر Admin (تم ✅).
- **Home**: تحسين Hero (تباين أعلى، CTA أوضح، صور أكبر).
- **Blog Cards**: هوفر أنعم، صور أكبر، عرض تاريخ + وقت القراءة + التصنيف بشكل مرتب.
- **Typography**: زيادة `line-height` وسبيسينغ في `BlogPost.tsx` لقراءة مريحة.
- **Footer**: تنظيم الروابط وإضافة social + سنة ديناميكية.
- **Dark mode polish**: مراجعة التباين على tokens.

## 5) سيو + أداء (خارق)

- **SEO**:
  - Canonical + og:image + Twitter Card صحيحة لكل مقال (موجودة، سأتحقق).
  - JSON-LD: `Article` + `BreadcrumbList` + `Organization`.
  - `hreflang="en"` (الموقع إنجليزي).
  - Meta descriptions مضمونة (fallback من excerpt أو أول 155 حرف من content).
- **الأداء**:
  - `preconnect` لـ Supabase وPollinations.
  - `loading="lazy"` + `decoding="async"` على كل الصور.
  - `fetchpriority="high"` على الصورة الرئيسية فوق الطية.
  - تقسيم Vite chunks (موجود بالفعل).
  - إزالة أي framer-motion من فوق الطية (استبدال بـ CSS animations).

## الملفات المتأثرة (تقنياً)

- `supabase/functions/sitemap/index.ts` — إعادة كتابة كاملة (sitemap-index + image sitemap).
- `supabase/functions/bulk-generate-images/index.ts` — جديد.
- `artifacts/app/public/robots.txt` — تحديث.
- `artifacts/app/src/hooks/useAutoLinking.ts` — منطق طبيعي.
- `artifacts/app/src/pages/Blog.tsx` + `Index.tsx` — تحسينات UI.
- `artifacts/app/src/pages/BlogPost.tsx` — schema + typography.
- `artifacts/app/src/components/layout/Footer.tsx` — تنظيم.
- `artifacts/app/src/components/blog/BlogCard.tsx` — تصميم أنيق.
- `vercel.json` — routes للـ sitemap-index والفرعية.

## ملاحظات مهمة

- **لا يتم حذف أي ميزة موجودة** (احتراماً لقاعدة الذاكرة).
- **الأدمن لا يزال متاحاً** عبر `/admin` مباشرة (فقط الزر مخفي من الواجهة).
- توليد الصور دفعة واحدة قد يستغرق وقتاً — يعمل في الخلفية عبر Edge Function مع rate limiting.
- بعد الانتهاء يجب عمل **Publish** لإعادة نشر Vercel والسايت ماب.

هل أبدأ التنفيذ؟