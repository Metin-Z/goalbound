"""Optional: bundle the PWA into one self-contained dist/goalbound.html (no service worker, opens straight from disk)."""
import re, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
html = (root / 'index.html').read_text(encoding='utf-8')
# drop PWA-only tags (manifest, icon links, service worker registration)
html = re.sub(r'\s*<!-- PWA[^>]*-->|\s*<!-- Icons[^>]*-->', '', html)
html = re.sub(r'\s*<link rel="(manifest|icon|apple-touch-icon)"[^>]*>', '', html)
html = re.sub(r'\s*<script src="js/pwa\.js"></script>', '', html)
html = re.sub(r'<link rel="stylesheet" href="([^"]+)">', lambda m: '<style>\n' + (root / m.group(1)).read_text(encoding='utf-8') + '</style>', html)
html = re.sub(r'<script src="([^"]+)"></script>', lambda m: '<script>\n' + (root / m.group(1)).read_text(encoding='utf-8').replace('</script', '<\\/script') + '\n</script>', html)
out = root / 'dist' / 'goalbound.html'; out.parent.mkdir(exist_ok=True); out.write_text(html, encoding='utf-8')
print(out, len(html) // 1024, 'KB')
