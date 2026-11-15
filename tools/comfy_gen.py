"""GOALBOUND — batch image generation through a local ComfyUI (no extra packages needed).

Usage (from the goalbound-pwa folder):
  python tools/comfy_gen.py icon            # preset from tools/prompts.json, default count
  python tools/comfy_gen.py icon --n 16     # 16 variations
  python tools/comfy_gen.py --prompt "..."  # free prompt
  python tools/comfy_gen.py --list          # show presets
  python tools/comfy_gen.py icon --workflow tools/workflow_sdxl_api.json   # use another exported (API) workflow
Results go to assets/gen/<preset>/ plus an index.html gallery (open it to pick favourites).
"""
import argparse, json, os, random, sys, time, urllib.request, urllib.parse, pathlib, html

ROOT = pathlib.Path(__file__).resolve().parent.parent
TOOLS = ROOT / 'tools'
DEFAULT_NEG = 'photo, realistic, 3d render, gradient, texture, noise, text, letters, words, watermark, signature, blurry, lowres, jpeg artifacts, cropped, frame, border'

# Find the running ComfyUI server (COMFY_URL env var, else the usual Desktop/portable ports)
def find_server():
    cands = [os.environ['COMFY_URL']] if os.environ.get('COMFY_URL') else []
    cands += ['http://127.0.0.1:8000', 'http://127.0.0.1:8188']
    for u in cands:
        try:
            urllib.request.urlopen(u.rstrip('/') + '/system_stats', timeout=2).read(); return u.rstrip('/')
        except Exception:
            pass
    sys.exit('ComfyUI bulunamadı. ComfyUI açık mı? Farklı bir port ise: set COMFY_URL=http://127.0.0.1:PORT')

# Small JSON HTTP helper
def call(url, data=None):
    req = urllib.request.Request(url, data=json.dumps(data).encode() if data is not None else None, headers={'Content-Type': 'application/json'})
    return json.loads(urllib.request.urlopen(req, timeout=60).read() or b'{}')

# Fill the exported workflow: prompts (found through the KSampler links), seed, size, steps, cfg, file prefix
def build(wf, pos, neg, seed, w, h, steps, cfg, prefix):
    wf = json.loads(json.dumps(wf))
    ks = next(n for n in wf.values() if n['class_type'] == 'KSampler')['inputs']
    wf[ks['positive'][0]]['inputs']['text'] = pos
    wf[ks['negative'][0]]['inputs']['text'] = neg
    ks['seed'] = seed
    if steps: ks['steps'] = steps   # otherwise keep the workflow's own sampler settings
    if cfg: ks['cfg'] = cfg
    lat = wf[ks['latent_image'][0]]['inputs']; lat.update(width=w, height=h, batch_size=1)
    for n in wf.values():
        if 'filename_prefix' in n['inputs']: n['inputs']['filename_prefix'] = 'goalbound/' + prefix
    return wf

# Queue one image, wait for it, download it into out_dir; returns the saved file name
def run_one(srv, wf, out_dir, name):
    pid = call(srv + '/prompt', {'prompt': wf, 'client_id': 'goalbound'})['prompt_id']
    while True:
        h = call(f'{srv}/history/{pid}')
        if pid in h:
            st = h[pid].get('status', {})
            if st.get('status_str') == 'error': raise RuntimeError(json.dumps(st)[:400])
            for out in h[pid]['outputs'].values():
                for im in out.get('images', []):
                    q = urllib.parse.urlencode({'filename': im['filename'], 'subfolder': im['subfolder'], 'type': im['type']})
                    (out_dir / name).write_bytes(urllib.request.urlopen(f'{srv}/view?{q}').read()); return name
        time.sleep(0.5)

# Write a simple gallery page so the best results can be picked by number
def gallery(out_dir, items):
    cards = ''.join(f'<figure><img src="{html.escape(i["file"])}" loading="lazy"><figcaption><b>{html.escape(i["file"])}</b> · seed {i["seed"]}<br><small>{html.escape(i["prompt"])}</small></figcaption></figure>' for i in items)
    (out_dir / 'index.html').write_text(f'<!doctype html><meta charset="utf-8"><title>GOALBOUND gen</title><style>body{{background:#111;color:#ddd;font:13px system-ui;margin:16px}}main{{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}}figure{{margin:0;background:#1c1c1c;padding:8px;border-radius:10px}}img{{width:100%;border-radius:6px;display:block}}figcaption{{margin-top:6px}}small{{color:#888}}.s img{{width:48px;margin-right:8px}}</style><main>{cards}</main>', encoding='utf-8')

def main():
    presets = json.loads((TOOLS / 'prompts.json').read_text(encoding='utf-8'))
    ap = argparse.ArgumentParser()
    ap.add_argument('preset', nargs='?'); ap.add_argument('--prompt'); ap.add_argument('--neg')
    ap.add_argument('--n', type=int); ap.add_argument('--seed', type=int); ap.add_argument('--size', default='1024x1024')
    ap.add_argument('--steps', type=int); ap.add_argument('--cfg', type=float)
    ap.add_argument('--workflow', default=str(TOOLS / 'workflow_zimage_api.json')); ap.add_argument('--list', action='store_true')
    a = ap.parse_args()
    if a.list or not (a.preset or a.prompt):
        for k, v in presets.items(): print(f'{k:12} {v.get("note", "")}')
        return
    p = presets.get(a.preset, {}) if a.preset else {}
    if a.preset and not p: sys.exit(f'Böyle bir preset yok: {a.preset}  (liste: --list)')
    prompts = [a.prompt] if a.prompt else p['prompts']
    neg = a.neg or p.get('neg', DEFAULT_NEG); n = a.n or p.get('n', 8)
    w, h = map(int, a.size.lower().split('x'))
    name = a.preset or 'custom'; out = ROOT / 'assets' / 'gen' / name; out.mkdir(parents=True, exist_ok=True)
    wf = json.loads(pathlib.Path(a.workflow).read_text(encoding='utf-8')); srv = find_server()
    print(f'ComfyUI: {srv} · {n} görsel → {out}')
    log = out / 'log.json'; items = json.loads(log.read_text(encoding='utf-8')) if log.exists() else []
    for i in range(n):
        seed = a.seed + i if a.seed is not None else random.randrange(1, 2**48)
        pos = prompts[i % len(prompts)]; fn = f'{name}_{len(items) + 1:03d}.png'; t = time.time()
        run_one(srv, build(wf, pos, neg, seed, w, h, a.steps, a.cfg, name), out, fn)
        items.append({'file': fn, 'seed': seed, 'prompt': pos}); log.write_text(json.dumps(items, ensure_ascii=False, indent=1), encoding='utf-8'); gallery(out, items)
        print(f'  [{i + 1}/{n}] {fn}  seed={seed}  {time.time() - t:.1f}s')
    print('Bitti. Galeri:', out / 'index.html')

if __name__ == '__main__':
    main()
