-- Link all Vintage Birthday articles back to the Pillar Guide
UPDATE blog_posts
SET content = '<p><em>Before diving into this year’s specific trends, be sure to check out our <a href="/blog/the-ultimate-guide-to-vintage-t-shirts-how-to-find-style-and-value-them">comprehensive vintage t-shirt guide</a> for essential tips on quality and fit.</em></p>' || content
WHERE slug LIKE 'the-ultimate-guide-to-vintage-%-birthday-shirts';

-- Link the Pillar Guide to the Birthday Cluster
UPDATE blog_posts
SET content = content || '

<h2>Vintage Birthday Archive: Year-by-Year Guide</h2>
<p>Are you looking for a specific birth year? We have curated exhaustive guides for every milestone from the 90s and 2000s. Whether you are celebrating a 20th or 35th birthday, find your year below:</p>
<ul>
  <li><a href="/blog/the-ultimate-guide-to-vintage-1991-birthday-shirts">1991 Birthday Shirts</a></li>
  <li><a href="/blog/the-ultimate-guide-to-vintage-1995-birthday-shirts">1995 Birthday Shirts</a></li>
  <li><a href="/blog/the-ultimate-guide-to-vintage-2000-birthday-shirts">2000 Birthday Shirts</a></li>
  <li><a href="/blog/the-ultimate-guide-to-vintage-2005-birthday-shirts">2005 Birthday Shirts</a></li>
  <li><a href="/blog/the-ultimate-guide-to-vintage-2010-birthday-shirts">2010 Birthday Shirts</a></li>
</ul>
<p><em>Note: We are constantly updating our archive with more years and style variations.</em></p>'
WHERE slug = 'the-ultimate-guide-to-vintage-t-shirts-how-to-find-style-and-value-them';
