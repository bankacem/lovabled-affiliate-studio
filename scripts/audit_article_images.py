from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
import csv, re, requests

ROOT = Path(__file__).resolve().parents[1]
rows = {}
for path in (ROOT / "content" / "blog").glob("*.md"):
    text = path.read_text(errors="ignore")
    for url in re.findall(r'(?:^|\s)(?:image|featured_image):\s*["\']([^"\']+)', text, flags=re.I | re.M):
        rows.setdefault(url, set()).add(str(path.relative_to(ROOT)))
    for url in re.findall(r'<img\b[^>]*\bsrc=["\']([^"\']+)', text, flags=re.I):
        rows.setdefault(url, set()).add(str(path.relative_to(ROOT)))

def check(url):
    try:
        r = requests.get(url, timeout=25, allow_redirects=True, headers={"User-Agent": "AIPrintVerse-image-audit/1.0"}, stream=True)
        status, content_type, final_url = r.status_code, r.headers.get("content-type", ""), r.url
        r.close()
        ok = status == 200 and content_type.lower().split(";", 1)[0].startswith("image/")
        return ok, status, content_type, final_url, ""
    except Exception as exc:
        return False, "ERROR", "", "", str(exc)[:240]

out = ROOT / "image-audit.csv"
with ThreadPoolExecutor(max_workers=16) as pool:
    futures = {pool.submit(check, url): url for url in rows}
    results = []
    for future in as_completed(futures):
        url = futures[future]
        ok, status, content_type, final_url, error = future.result()
        results.append({"url": url, "articles": len(rows[url]), "ok": ok, "status": status, "content_type": content_type, "final_url": final_url, "error": error})
results.sort(key=lambda x: (x["ok"], x["url"]))
with out.open("w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=["url", "articles", "ok", "status", "content_type", "final_url", "error"])
    writer.writeheader(); writer.writerows(results)
print(f"unique_urls={len(results)} valid={sum(r['ok'] for r in results)} invalid={sum(not r['ok'] for r in results)}")
for row in results:
    if not row["ok"]:
        print(row["status"], row["content_type"], row["url"][:180])
