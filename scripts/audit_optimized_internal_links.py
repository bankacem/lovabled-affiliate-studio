from pathlib import Path
import re
from collections import Counter

ROOT=Path(__file__).resolve().parents[1]
files=[]
for p in (ROOT/'content/blog').glob('*.md'):
    text=p.read_text(errors='ignore')
    if '/blog/' in text and p.name in set(): pass
# Explicit optimized files from the six published commits
import subprocess
commits=['464d9d8','26fa4db','5b45404','a3426a2','29239ff','58714cc']
for c in commits:
    for line in subprocess.check_output(['git','show','--format=','--name-only',c],cwd=ROOT,text=True).splitlines():
        if line.startswith('content/blog/') and line.endswith('.md') and line not in files: files.append(line)
slugs={}
for rel in files:
    text=(ROOT/rel).read_text(errors='ignore'); parts=text.split('---',2)
    if len(parts)<3: continue
    m=re.search(r'^slug:\s*["\'](.*?)["\']\s*$',parts[1],re.M)
    slug=(m.group(1) if m else Path(rel).stem).removeprefix('p-')
    slugs[slug]=rel
rows=[]
for slug,rel in sorted(slugs.items()):
    text=(ROOT/rel).read_text(errors='ignore'); links=re.findall(r'href=["\']/blog/([^"\']+)',text,re.I)
    targets=[x.removeprefix('p-') for x in links if x.removeprefix('p-') in slugs]
    rows.append((slug,len(targets),len(set(targets)),sorted(set(targets))))
out=ROOT/'optimized-internal-link-audit.md'
with out.open('w') as f:
    f.write('# Optimized Article Internal-Link Audit\n\n')
    f.write(f'Optimized distinct articles: **{len(slugs)}**. This report counts links between those articles only.\n\n')
    f.write('| Article | Links to optimized articles | Unique targets | Targets |\n|---|---:|---:|---|\n')
    for slug,total,unique,targets in rows:
        f.write(f'| `{slug}` | {total} | {unique} | {", ".join(targets) or "None"} |\n')
print('articles',len(rows),'zero_target',sum(not r[3] for r in rows),'avg_unique',round(sum(r[2] for r in rows)/len(rows),2))
