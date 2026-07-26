-- SQL Script to publish the premium Arabic SEO article directly into the blog_posts table
-- Copy and paste this script into your Supabase SQL Editor (https://supabase.com/dashboard/project/krugmbovsjjgjikgzacl/sql/new)

INSERT INTO public.blog_posts (
  id,
  title,
  slug,
  excerpt,
  content,
  featured_image,
  author_name,
  category,
  tags,
  keywords,
  status,
  read_time,
  meta_title,
  meta_description,
  indexing_status,
  published_at,
  created_at,
  updated_at
) VALUES (
  'a8b9c0d1-e2f3-4a5b-6c7d-8e9f0a1b2c3d',
  'أفضل إضافات SEO للمبتدئين: دليل شامل 2026',
  'best-seo-plugins-beginners-2026',
  'اكتشف أفضل إضافات SEO المجانية والمدفوعة للمبتدئين. دليل شامل مع مقارنات وخطوات التثبيت والتكامل.',
  '<h2>أفضل إضافات SEO للمبتدئين: دليل شامل 2026</h2>
<p>إذا ما بدأت للتو رحلتك في التدوين وأردت الرفع من عدد زوار موقعك، فإن اختيار أفضل إضافات SEO سيكون رفيقك الأمين في هذه الرحلة.</p>
<p>في هذا الدليل الشامل لسنة 2026، سنغطي أفضل الإضافات المجانية والمدفوعة على حد سواء. سنقارن بينها ونشرح كيفية استخدام كل واحدة، ونساعدك على اختيار الإضافة المناسبة لاحتياجاتك لضمان تحقيق أفضل النتائج الممكنة.</p>

<h3>ما هي إضافات SEO ولماذا تحتاج إليها؟</h3>
<p>إضافات SEO هي عبارة عن برامج وأدوات متكاملة تساعدك على تحسين ظهور موقعك في نتائج محركات البحث بفاعلية. تقدم هذه الإضافات ميزات هامة مثل:</p>
<ul>
  <li>تحليل الكلمات المفتاحية ومدى تكرارها بشكل طبيعي.</li>
  <li>تحسين عناوين المقالات وكتابة الأوصاف التعريفية (Meta Descriptions).</li>
  <li>فحص بنية الروابط الداخلية والخارجية لضمان سلامتها.</li>
  <li>مراقبة بيانات خريطة الموقع (Sitemap XML) وتحديثها تلقائياً.</li>
</ul>

<h3>1. Yoast SEO - الرائدة الكلاسيكية</h3>
<p>تعتبر Yoast SEO واحدة من أشهر وأقدم الإضافات في عالم ووردبريس. تتميز بواجهتها المألوفة ونظام الإشارات الضوئية (الأخضر، البرتقالي، الأحمر) الذي يسهل على المبتدئين فهم مدى توافق المحتوى مع شروط السيو.</p>
<p><strong>أهم المميزات:</strong> تحليل فوري للمقروئية، توليد خرائط XML تلقائية، والتحكم الكامل في الروابط الدائمة وتفاصيل منصات التواصل الاجتماعي.</p>

<h3>2. Rank Math - العملاق المرن والحديث</h3>
<p>إذا كنت تبحث عن ميزات احترافية مجانية بالكامل، فإن Rank Math هي الخيار الأمثل. تقدم واجهة مستخدم حديثة وسهلة وسريعة للغاية دون إبطاء موقعك.</p>
<p><strong>أهم المميزات:</strong> دعم مدمج لأكواد سكيما (Schema Markup)، أداة تحليل الكلمات المفتاحية المتعددة، ومراقبة أخطاء الروابط المكسورة 404 بذكاء.</p>

<h3>3. SEOPress - الخيار الاقتصادي الفعال</h3>
<p>إضافة فرنسية شهيرة تمنحك توازناً رائعاً بين السعر البسيط والمميزات القوية، ومناسبة جداً لمن يمتلكون شبكة مواقع متعددة.</p>

<h3>الأسئلة الشائعة حول إضافات السيو (FAQ)</h3>
<div class=\"faq-section\">
  <h4>سؤال: هل أحتاج إلى إضافة SEO؟</h4>
  <p>نعم، الإضافة تسهل عليك إخبار محركات البحث بموضوع مقالك وهيكلته بشكل يفهمونه، مما يضمن أرشفة أسرع وترتيباً أعلى.</p>
  <h4>سؤال: هل يمكنني استخدام إضافتي SEO معاً؟</h4>
  <p>لا ينصح بذلك على الإطلاق! استخدام أكثر من إضافة سيو في نفس الوقت يسبب تعارضاً برمجياً كبيراً وبطءاً في الموقع وتشتيتاً لعناكب البحث.</p>
</div>',
  'https://lovabled-affiliate-studio.com/images/seo-plugins-guide-2026.jpg',
  'SEOAgent',
  'SEO Tools',
  ARRAY['إضافات SEO', 'تحسين محركات البحث', 'ووردبريس'],
  ARRAY['أفضل إضافة SEO', 'إضافة SEO مجانية', 'أدوات SEO'],
  'published',
  '12 min read',
  'أفضل إضافات SEO للمبتدئين: دليل شامل 2026',
  'اكتشف أفضل إضافات SEO المجانية والمدفوعة للمبتدئين. دليل شامل مع مقارنات وخطوات التثبيت والتكامل.',
  'indexed',
  '2026-07-24 12:00:00+00',
  '2026-07-24 12:00:00+00',
  '2026-07-24 12:00:00+00'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  featured_image = EXCLUDED.featured_image,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  tags = EXCLUDED.tags,
  keywords = EXCLUDED.keywords,
  status = EXCLUDED.status,
  updated_at = NOW();
