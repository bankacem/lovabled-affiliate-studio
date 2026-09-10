from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
asset_dir = ROOT / "artifacts" / "app" / "public" / "blog-images"
rename = {}
for path in asset_dir.glob("*"):
    if path.suffix.lower() == ".webp":
        rename[path.stem] = path.name

for path in (ROOT / "content" / "blog").glob("*.md"):
    text = path.read_text(errors="ignore")
    def repl(match):
        url = match.group(0)
        for stem, filename in rename.items():
            if f"/blog-images/{stem}." in url:
                return url[:url.rfind(stem)] + filename
        return url
    updated = re.sub(r"/blog-images/[A-Za-z0-9_-]+\.[A-Za-z0-9]+", repl, text)
    if updated != text:
        path.write_text(updated)
print(f"webp_assets={len(rename)}")
