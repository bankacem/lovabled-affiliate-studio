from pathlib import Path
import re
from html.parser import HTMLParser

ROOT=Path(__file__).resolve().parents[1]
path=ROOT/'content/blog/p-cheap-custom-t-shirts-no-minimum-a-comprehensive-guide.md'
text=path.read_text()
parts=text.split('---',2)
assert len(parts)==3, 'frontmatter delimiters'
front=parts[1]; body=parts[2]
for key in ['title','slug','description','image','image_alt','updated']:
    assert re.search(r'^'+re.escape(key)+r':',front,re.M), f'missing {key}'
assert 'cheap custom t-shirts' in front.lower()
assert '/blog-images/cheap-custom-tshirts-no-minimum-editorial.jpg' in body
assert (ROOT/'artifacts/app/public/blog-images/cheap-custom-tshirts-no-minimum-editorial.jpg').exists()
internal=re.findall(r'href=["\']/blog/([^"\']+)',body)
assert len(set(internal))>=3
for slug in set(internal):
    candidates=[ROOT/'content/blog'/f'{slug}.md',ROOT/'content/blog'/f'p-{slug}.md']
    assert any(p.exists() for p in candidates), slug
assert 'FAQPage' in body and body.count('itemtype="https://schema.org/Question"')==4
assert 'https://www.ftc.gov/news-events/topics/tools-consumers/apparel-labeling' in body
assert 'placeholder' not in body.lower()
assert body.count('<article>')==1 and body.count('</article>')==1
print('valid frontmatter/image/internal-links/faq/reference/structure')
print('internal_links',len(set(internal)),'words',len(re.findall(r'\b\w+\b',body)))
