from pathlib import Path
import re

ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'content/blog'
# Curated, contextual targets: each source gets at most two useful next-step guides.
clusters={
'10-creative-ways-to-style-poster-prints-for-a-stunning-gallery-wall':['canvas-prints-101-everything-you-need-to-know-before-you-buy','15-unique-personalized-gifts-theyll-cherish-forever-the-ultimate-2024-guide'],
'15-unique-personalized-gifts-theyll-cherish-forever-the-ultimate-2024-guide':['cat-lover-gifts-2026-77-purr-fect-ideas-for-feline-fans','custom-bags-101-everything-from-totes-to-backpacks'],
'bachelorette-party-shirt-ideas-2026-the-ultimate-guide-to-trends-fabrics-and-custom-designs':['birthday-squad-shirts-the-ultimate-guide-to-planning-your-group-celebration','valentines-day-shirts-the-complete-guide-for-couples-and-singles'],
'beagle-shirts-2026-55-tail-wagging-designs-for-beagle-lovers':['german-shepherd-shirts-2026-60-premium-designs-for-gsd-lovers','cat-lover-gifts-2026-77-purr-fect-ideas-for-feline-fans'],
'best-funny-quotes-for-t-shirts-in-2026-funny-quotes-shirts-that-sell-make-people-laugh':['best-snack-time-funny-quotes-for-t-shirts-in-2026-snack-themed-shirts-that-always-win','best-funny-doctor-quotes-for-t-shirts-in-2026-doctor-themed-shirts-that-always-win'],
'best-seo-plugins-beginners-2026':['chatgpt-for-etsy-sellers-the-ultimate-guide-to-scaling-your','print-on-demand-for-beginners-2026-the-no-inventory-roadmap-to-seven-figures'],
'best-snack-time-funny-quotes-for-t-shirts-in-2026-snack-themed-shirts-that-always-win':['best-funny-quotes-for-t-shirts-in-2026-funny-quotes-shirts-that-sell-make-people-laugh','best-funny-doctor-quotes-for-t-shirts-in-2026-doctor-themed-shirts-that-always-win'],
'birthday-squad-shirts-the-ultimate-guide-to-planning-your-group-celebration':['bachelorette-party-shirt-ideas-2026-the-ultimate-guide-to-trends-fabrics-and-custom-designs','valentines-day-shirts-the-complete-guide-for-couples-and-singles'],
'canvas-prints-101-everything-you-need-to-know-before-you-buy':['10-creative-ways-to-style-poster-prints-for-a-stunning-gallery-wall','custom-bags-101-everything-from-totes-to-backpacks'],
'cat-lover-gifts-2026-77-purr-fect-ideas-for-feline-fans':['beagle-shirts-2026-55-tail-wagging-designs-for-beagle-lovers','german-shepherd-shirts-2026-60-premium-designs-for-gsd-lovers'],
'chatgpt-for-etsy-sellers-the-ultimate-guide-to-scaling-your':['print-on-demand-for-beginners-2026-the-no-inventory-roadmap-to-seven-figures','best-seo-plugins-beginners-2026'],
'cheap-custom-t-shirts-no-minimum-a-comprehensive-guide':['the-15-best-places-to-buy-high-quality-cheap-t-shirts-in-2024','v-neck-vs-crew-neck-the-definitive-guide-to-choosing-the-right-neckline'],
'cozy-stylish-the-guide-to-printed-hoodies-and-sweatshirts':['embroidery-vs-screen-printing-which-custom-apparel-method-actually-wins','cheap-custom-t-shirts-no-minimum-a-comprehensive-guide'],
'custom-bags-101-everything-from-totes-to-backpacks':['cheap-custom-t-shirts-no-minimum-a-comprehensive-guide','15-unique-personalized-gifts-theyll-cherish-forever-the-ultimate-2024-guide'],
'embroidery-vs-screen-printing-which-custom-apparel-method-actually-wins':['cozy-stylish-the-guide-to-printed-hoodies-and-sweatshirts','cheap-custom-t-shirts-no-minimum-a-comprehensive-guide'],
'german-shepherd-shirts-2026-60-premium-designs-for-gsd-lovers':['beagle-shirts-2026-55-tail-wagging-designs-for-beagle-lovers','cat-lover-gifts-2026-77-purr-fect-ideas-for-feline-fans'],
'print-on-demand-for-beginners-2026-the-no-inventory-roadmap-to-seven-figures':['zero-inventory-high-margin-the-no-nonsense-guide-to-starting-a-print-on-demand-business-in-2024','chatgpt-for-etsy-sellers-the-ultimate-guide-to-scaling-your'],
'zero-inventory-high-margin-the-no-nonsense-guide-to-starting-a-print-on-demand-business-in-2024':['print-on-demand-for-beginners-2026-the-no-inventory-roadmap-to-seven-figures','the-15-best-places-to-buy-high-quality-cheap-t-shirts-in-2024'],
'the-15-best-places-to-buy-high-quality-cheap-t-shirts-in-2024':['cheap-custom-t-shirts-no-minimum-a-comprehensive-guide','v-neck-vs-crew-neck-the-definitive-guide-to-choosing-the-right-neckline'],
'the-stick-on-revolution-why-mental-health-awareness-stickers-are-more-than-just-decor':['cat-lover-gifts-2026-77-purr-fect-ideas-for-feline-fans','custom-bags-101-everything-from-totes-to-backpacks'],
'the-ultimate-guide-to-custom-mugs-why-theyre-the-perfect-personalized-gift':['beyond-the-pumpkin-spice-the-ultimate-guide-to-halloween-spooky-season-coffee-mugs','15-unique-personalized-gifts-theyll-cherish-forever-the-ultimate-2024-guide'],
'the-ultimate-guide-to-vintage-1991-birthday-shirts':['the-ultimate-guide-to-vintage-2001-birthday-shirts','the-ultimate-guide-to-vintage-2010-birthday-shirts'],
'the-ultimate-guide-to-vintage-2001-birthday-shirts':['the-ultimate-guide-to-vintage-1991-birthday-shirts','the-ultimate-guide-to-vintage-2010-birthday-shirts'],
'the-ultimate-guide-to-vintage-2010-birthday-shirts':['the-ultimate-guide-to-vintage-1991-birthday-shirts','the-ultimate-guide-to-vintage-2001-birthday-shirts'],
'v-neck-vs-crew-neck-the-definitive-guide-to-choosing-the-right-neckline':['cheap-custom-t-shirts-no-minimum-a-comprehensive-guide','the-15-best-places-to-buy-high-quality-cheap-t-shirts-in-2024'],
'valentines-day-shirts-the-complete-guide-for-couples-and-singles':['bachelorette-party-shirt-ideas-2026-the-ultimate-guide-to-trends-fabrics-and-custom-designs','birthday-squad-shirts-the-ultimate-guide-to-planning-your-group-celebration'],
'vintage-goose-sweater-country-farmhouse-cottagecore-crewneck-90s-retro-goose-shirt-cozy-animals-folk':['beagle-shirts-2026-55-tail-wagging-designs-for-beagle-lovers','german-shepherd-shirts-2026-60-premium-designs-for-gsd-lovers'],
'beyond-the-pumpkin-spice-the-ultimate-guide-to-halloween-spooky-season-coffee-mugs':['the-ultimate-guide-to-custom-mugs-why-theyre-the-perfect-personalized-gift','15-unique-personalized-gifts-theyll-cherish-forever-the-ultimate-2024-guide']}

titles={}
for p in BASE.glob('*.md'):
 text=p.read_text(errors='ignore'); parts=text.split('---',2)
 if len(parts)>=3:
  m=re.search(r'^title:\s*["\'](.*?)["\']\s*$',parts[1],re.M)
  titles[p.stem.removeprefix('p-')]=m.group(1) if m else p.stem
changed=0
for source,targets in clusters.items():
 path=BASE/(source+'.md')
 if not path.exists():
  # allow canonical source file with p- prefix
  path=BASE/('p-'+source+'.md')
 if not path.exists(): continue
 text=path.read_text(errors='ignore')
 if '<h2>Related guides' in text or '## Related guides' in text: continue
 links='\n<h2>Related guides</h2>\n<p>Continue with these related AIPrintVerse guides:</p>\n<ul>\n'
 for target in targets:
  if target in text: continue
  links += f'<li><a href="/blog/{target}" class="internal-link">{titles.get(target,target.replace("-"," ").title())}</a></li>\n'
 links+='</ul>\n'
 if links.count('<li>')==0: continue
 # Place before References if present, otherwise append.
 marker=re.search(r'\n(?:<h2>References|## References)',text,re.I)
 updated=text[:marker.start()]+links+text[marker.start():] if marker else text.rstrip()+links
 path.write_text(updated)
 changed+=1
print('changed',changed)
