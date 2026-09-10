from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
asset_dir = ROOT / "artifacts" / "app" / "public" / "blog-images"
converted = 0
removed = 0
for source in list(asset_dir.iterdir()):
    if not source.is_file() or source.suffix.lower() == ".webp":
        continue
    try:
        with Image.open(source) as image:
            image.load()
            if image.mode not in ("RGB", "RGBA"):
                image = image.convert("RGBA" if "A" in image.getbands() else "RGB")
            image.thumbnail((1800, 1800), Image.Resampling.LANCZOS)
            target = source.with_suffix(".webp")
            image.save(target, "WEBP", quality=84, method=6)
        source.unlink()
        converted += 1
        removed += 1
    except Exception as exc:
        print(f"skip {source.name}: {exc}")
print(f"converted={converted} removed={removed}")
