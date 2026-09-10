from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
import csv, hashlib, mimetypes, re, requests

ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / "artifacts" / "app" / "public" / "blog-images"
ASSET_DIR.mkdir(parents=True, exist_ok=True)
rows = {row["url"]: row for row in csv.DictReader((ROOT / "image-audit.csv").open())}
valid = {url for url, row in rows.items() if row["ok"] == "True" and url.startswith(("http://", "https://"))}

session_headers = {"User-Agent": "AIPrintVerse/1.0 image-localizer"}
def download(url):
    digest = hashlib.sha256(url.encode()).hexdigest()[:20]
    try:
        r = requests.get(url, timeout=45, allow_redirects=True, headers=session_headers, stream=True)
        ctype = r.headers.get("content-type", "").split(";", 1)[0].lower()
        if r.status_code != 200 or not ctype.startswith("image/"):
            r.close(); return url, None
        ext = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif", "image/avif": ".avif", "image/svg+xml": ".svg"}.get(ctype, mimetypes.guess_extension(ctype) or ".img")
        target = ASSET_DIR / f"{digest}{ext}"
        if not target.exists():
            size = 0
            with target.open("wb") as f:
                for chunk in r.iter_content(1024 * 64):
                    size += len(chunk)
                    if size > 12 * 1024 * 1024:
                        target.unlink(missing_ok=True); r.close(); return url, None
                    f.write(chunk)
        r.close()
        return url, f"/blog-images/{target.name}"
    except Exception:
        return url, None

mapping = {}
with ThreadPoolExecutor(max_workers=8) as pool:
    futures = {pool.submit(download, url): url for url in valid}
    for future in as_completed(futures):
        url, local = future.result()
        if local: mapping[url] = local

# Only replace exact values in frontmatter and img src attributes. All other
# links (such as article hyperlinks and video embeds) remain untouched.
def replace_url(url):
    return mapping.get(url, "/placeholder.svg")

frontmatter_image = re.compile(r'(^image:\s*["\'])(.*?)(["\']\s*$)', re.I | re.M)
img_src = re.compile(r'(<img\b[^>]*\bsrc=["\'])(.*?)(["\'])', re.I)
changed = 0
for path in (ROOT / "content" / "blog").glob("*.md"):
    original = path.read_text(errors="ignore")
    updated = frontmatter_image.sub(lambda m: m.group(1) + replace_url(m.group(2)) + m.group(3), original)
    updated = img_src.sub(lambda m: m.group(1) + replace_url(m.group(2)) + m.group(3), updated)
    if updated != original:
        path.write_text(updated)
        changed += 1
print(f"downloaded={len(mapping)} valid_candidates={len(valid)} changed_articles={changed} assets={len(list(ASSET_DIR.iterdir()))}")
print(f"unresolved_valid={len(valid - set(mapping))}")
