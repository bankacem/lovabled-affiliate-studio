from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
files = list((ROOT / "content" / "blog").glob("*.md"))
frontmatter = re.compile(r'(^---\n)(.*?)(\n---\n)', re.S)
category_re = re.compile(r'^category:\s*["\'](.*?)["\']\s*$', re.M)
image_re = re.compile(r'^image:\s*["\'](.*?)["\']\s*$', re.M)
inline_re = re.compile(r'<img\b[^>]*\bsrc=["\'](/blog-images/[^"\']+)', re.I)
by_category = {}
all_local = []
for path in files:
    text = path.read_text(errors="ignore")
    match = frontmatter.search(text)
    if not match: continue
    category_match = category_re.search(match.group(2))
    category = category_match.group(1) if category_match else "General"
    local = inline_re.findall(text)
    if local:
        by_category.setdefault(category, local[0])
        all_local.append(local[0])

changed = 0
for path in files:
    text = path.read_text(errors="ignore")
    match = frontmatter.search(text)
    if not match: continue
    category_match = category_re.search(match.group(2))
    category = category_match.group(1) if category_match else "General"
    cover = image_re.search(match.group(2))
    if not cover or cover.group(1) != "/placeholder.svg": continue
    replacement = by_category.get(category) or (all_local[0] if all_local else "/placeholder.svg")
    updated = text[:match.start(2)] + image_re.sub(lambda m: m.group(0).replace(m.group(1), replacement), match.group(2), count=1) + text[match.end(2):]
    if updated != text:
        path.write_text(updated)
        changed += 1
print(f"category_covers={len(by_category)} changed={changed} remaining_placeholder={sum('/placeholder.svg' in p.read_text(errors='ignore').split('---',2)[1] for p in files)}")
