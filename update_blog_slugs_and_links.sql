-- Migration to update blog posts with SEO-friendly slugs and internal linking
-- This script covers the 10 core blog posts synced between the codebase and database.

-- 1. Top 10 Geometric Animal Designs for 2025
UPDATE blog_posts
SET
    slug = 'top-10-geometric-animal-designs-for-2025',
    content = 'Geometric animal designs have become one of the most popular trends in the print-on-demand industry. These designs combine the natural beauty of animals with modern geometric patterns, creating stunning artwork that appeals to a wide audience.\n\nIn this article, we''ll explore the top 10 geometric animal designs that are dominating 2025. These patterns are perfect for modern accessories like <a href="/blog/the-ultimate-guide-to-custom-phone-cases">custom phone cases</a> or as unique designs on <a href="/blog/custom-mugs-the-ultimate-gifting-guide">custom mugs</a>.',
    indexing_status = 'pending',
    updated_at = NOW()
WHERE id = '1' OR title = 'Top 10 Geometric Animal Designs for 2025';

-- 2. How to Style Vintage T-Shirts: A Complete Guide
UPDATE blog_posts
SET
    slug = 'how-to-style-vintage-t-shirts-a-complete-guide',
    content = 'Vintage t-shirts have made a massive comeback in recent years. Whether you''re into 80s nostalgia or classic rock aesthetics, knowing how to style these pieces can elevate your entire wardrobe.\n\nLet''s dive into the different ways you can incorporate vintage tees into your daily outfits. Once you''ve mastered the look, make sure you know <a href="/blog/the-definitive-guide-to-washing-vintage-t-shirts">how to wash your vintage t-shirts</a> to keep them in top condition. Interestingly, some modern <a href="/blog/top-10-geometric-animal-designs-for-2025">geometric animal designs</a> are also being paired with vintage styles for a unique fusion.',
    indexing_status = 'pending',
    updated_at = NOW()
WHERE id = '2' OR title = 'How to Style Vintage T-Shirts: A Complete Guide';

-- 3. The Rise of Space-Themed Merchandise
UPDATE blog_posts
SET
    slug = 'the-rise-of-space-themed-merchandise',
    content = 'From NASA collaborations to indie artists creating cosmic designs, space-themed merchandise has seen an astronomical rise in popularity.\n\nThe fascination with space isn''t new, but recent developments in space exploration have reignited public interest. This trend extends to everyday items; imagine sipping from one of the <a href="/blog/best-coffee-mugs-for-your-home-office">best coffee mugs</a> while staring at a nebula on your <a href="/blog/the-ultimate-guide-to-custom-phone-cases">custom phone case</a>.',
    indexing_status = 'pending',
    updated_at = NOW()
WHERE id = '3' OR title = 'The Rise of Space-Themed Merchandise';

-- 4. Best Coffee Mugs for Your Home Office
UPDATE blog_posts
SET
    slug = 'best-coffee-mugs-for-your-home-office',
    content = 'Your home office deserves a mug that''s not just functional but also reflects your personality. We''ve curated a collection of the best coffee mug designs that combine style with practicality.\n\nFrom minimalist designs to bold statements, find your perfect match. For more detailed gift ideas, check our <a href="/blog/custom-mugs-the-ultimate-gifting-guide">ultimate custom mug gifting guide</a>. To complete your office vibe, you might also want to explore our <a href="/blog/7-pro-secrets-to-styling-throw-pillows">secrets to styling throw pillows</a> for your office sofa.',
    indexing_status = 'pending',
    updated_at = NOW()
WHERE id = '4' OR title = 'Best Coffee Mugs for Your Home Office';

-- 5. Bachelorette Party Shirt Ideas 2024
UPDATE blog_posts
SET
    slug = 'bachelorette-party-shirt-ideas-2024',
    content = 'Looking for the latest trends? Check out our updated <a href="/blog/bachelorette-party-shirt-ideas-2026-master-guide">Bachelorette Party Shirt Ideas for 2026</a> guide for the upcoming season.\n\nFor 2024, we saw a lot of retro and custom typography. If you want to lean into the retro look, our guide on <a href="/blog/how-to-style-vintage-t-shirts-a-complete-guide">how to style vintage t-shirts</a> offers great tips that can be applied to bachelorette themes.',
    indexing_status = 'pending',
    updated_at = NOW()
WHERE id = '5' OR title = 'Bachelorette Party Shirt Ideas 2024';

-- 6. Bachelorette Party Shirt Ideas 2026: The Master Guide
UPDATE blog_posts
SET
    slug = 'bachelorette-party-shirt-ideas-2026-master-guide',
    content = 'Welcome to the future of bachelorette parties. In 2026, we''re seeing a shift towards more sustainable and high-concept themes.\n\nWhether you''re planning a desert retreat or a city getaway, your apparel should reflect the new era of celebration. We recommend looking into eco-friendly fabrics and biomorphic patterns. Compare these with our <a href="/blog/bachelorette-party-shirt-ideas-2024">2024 party ideas</a> to see the evolution. Don''t forget that <a href="/blog/custom-mugs-the-ultimate-gifting-guide">custom mugs</a> also make excellent sustainable party favors.',
    indexing_status = 'pending',
    updated_at = NOW()
WHERE id = '6' OR title = 'Bachelorette Party Shirt Ideas 2026: The Master Guide';

-- 7. 7 Pro Secrets to Styling Throw Pillows
UPDATE blog_posts
SET
    slug = '7-pro-secrets-to-styling-throw-pillows',
    content = 'Styling throw pillows is an art form. To stay ahead of the curve in 2026, you need to consider more than just color.\n\nOne secret is incorporating <strong>Biophilic Textile Patterns</strong> that bring the outdoors in. Pair these with <strong>Sustainable Flax Linen</strong> for durability and a touch of eco-luxury. These elements pair perfectly with a cozy setup featuring one of the <a href="/blog/best-coffee-mugs-for-your-home-office">best coffee mugs</a> for your lounge. For a complete home refresh, see our <a href="/blog/custom-mugs-the-ultimate-gifting-guide">custom mug gifting guide</a> for more decor-friendly options.',
    indexing_status = 'pending',
    updated_at = NOW()
WHERE id = '7' OR title = '7 Pro Secrets to Styling Throw Pillows';

-- 8. The Definitive Guide to Washing Vintage T-Shirts
UPDATE blog_posts
SET
    slug = 'the-definitive-guide-to-washing-vintage-t-shirts',
    content = 'Washing vintage t-shirts requires a delicate touch. To avoid dry rot and preserve the print, follow these essential steps:\n\n1. Turn the garment inside out.\n2. Use cold water only.\n3. Air dry flat.\n\nProper care ensures you can continue to <a href="/blog/how-to-style-vintage-t-shirts-a-complete-guide">style your vintage collection</a> for years to come. While vintage is timeless, you can also mix it with modern <a href="/blog/top-10-geometric-animal-designs-for-2025">geometric designs</a> for a fresh look.',
    indexing_status = 'pending',
    updated_at = NOW()
WHERE id = '8' OR title = 'The Definitive Guide to Washing Vintage T-Shirts';

-- 9. Custom Mugs: The Ultimate Gifting Guide
UPDATE blog_posts
SET
    slug = 'custom-mugs-the-ultimate-gifting-guide',
    content = 'Custom mugs are a classic gift, but in 2026, we''re taking them to the next level with personalized AR-enabled designs and thermal-reactive coatings.\n\n<div class="product-feature-box" style="border: 2px solid #6366f1; border-radius: 12px; padding: 24px; margin: 32px 0; background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%); text-align: center;">\n    <h3 style="margin: 0 0 8px 0; color: #1e293b;">Custom Print Masterpieces</h3>\n    <p style="color: #64748b; margin-bottom: 24px;">Bring your vision to life with our premium printing technology.</p>\n    <a href="/designs" style="background: #6366f1; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600;">Shop Now →</a>\n</div>\n\nWhether you''re looking for the <a href="/blog/best-coffee-mugs-for-your-home-office">best coffee mugs</a> for an office or a decorative piece for a home, our guide covers it. Consider pairing a custom mug with a matching <a href="/blog/7-pro-secrets-to-styling-throw-pillows">styled throw pillow</a> for the ultimate home gift set.',
    indexing_status = 'pending',
    updated_at = NOW()
WHERE id = '9' OR title = 'Custom Mugs: The Ultimate Gifting Guide';

-- 10. The Ultimate Guide to Custom Phone Cases
UPDATE blog_posts
SET
    slug = 'the-ultimate-guide-to-custom-phone-cases',
    content = 'Custom phone cases are the ultimate accessory for self-expression in 2026. From minimalist monograms to complex Solarpunk landscapes, your phone case is a canvas.\n\n<div class="product-feature-box" style="border: 2px solid #6366f1; border-radius: 12px; padding: 24px; margin: 32px 0; background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%); text-align: center;">\n    <h3 style="margin: 0 0 8px 0; color: #1e293b;">Custom Print Masterpieces</h3>\n    <p style="color: #64748b; margin-bottom: 24px;">Bring your vision to life with our premium printing technology.</p>\n    <a href="/designs" style="background: #6366f1; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600;">Shop Now →</a>\n</div>\n\nWhen choosing a case, prioritize impact-resistant materials and UV-protected printing. Many people choose <a href="/blog/top-10-geometric-animal-designs-for-2025">geometric animal designs</a> for a modern look, while others prefer the trending <a href="/blog/the-rise-of-space-themed-merchandise">space-themed merchandise</a> aesthetic.',
    indexing_status = 'pending',
    updated_at = NOW()
WHERE id = '10' OR title = 'The Ultimate Guide to Custom Phone Cases';
