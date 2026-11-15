# GOALBOUND — ikon ihtiyaç listesi

**Şu an kullanılan ikonlar:** Claude'un çizdiği vektör ikon (turuncu iki tonlu kalkan + beyaz top, siyah zemin).
Kaynaklar `src/` klasöründe (`icon.svg`, `icon-maskable.svg`, `icon-small.svg`); PNG'leri `python tools/gen_icon.py assets/icons`
yeniden üretir (gerekirse: `pip install cairosvg`).

**Değiştirmek için:** aşağıdaki dosyaları aynı adlarla üzerine yaz (ör. Gemini görselinden `tools/make_icons.py` ile)
ve `sw.js` içindeki `VERSION` değerini artır. Dosya adları `manifest.json`, `index.html` ve `sw.js` içinde tanımlı.

## Gemini'den istenecekler (2 görsel)

| # | Dosya | Boyut | Not |
|---|---|---|---|
| A | `master.png` | 1024×1024 | Ana ikon. Kenarlara kadar kullanılabilir, köşeler sistem tarafından yuvarlanır. |
| B | `maskable-master.png` | 1024×1024 | Android uyarlanabilir ikon. **Tam dolu arka plan** (#070606), önemli her şey ortadaki **%80'lik daire** (≈820 px çap) içinde. |

B üretilemezse sorun değil: script A'yı küçültüp güvenli alana yerleştirir.

## Sonra üretilecek dosyalar (otomatik)

`python tools/make_icons.py master.png maskable-master.png` (Pillow gerekir: `pip install pillow`)

| Dosya | Boyut | Kullanım | Şeffaflık |
|---|---|---|---|
| `icon-192.png` | 192×192 | Android ana ekran, kurulum (`purpose: any`) | olabilir |
| `icon-512.png` | 512×512 | Açılış ekranı, mağaza tarzı kurulum (`any`) | olabilir |
| `icon-maskable-192.png` | 192×192 | Android uyarlanabilir ikon (`maskable`) | **olmamalı** |
| `icon-maskable-512.png` | 512×512 | Android uyarlanabilir ikon (`maskable`) | **olmamalı** |
| `apple-touch-icon.png` | 180×180 | iPhone/iPad ana ekran | **olmamalı** (iOS siyah doldurur) |
| `favicon-32.png` | 32×32 | Tarayıcı sekmesi | olabilir |
| `favicon-16.png` | 16×16 | Tarayıcı sekmesi (küçük) | olabilir |

İsteğe bağlı (Android'de daha zengin kurulum penceresi): `assets/screenshots/` içine 1080×1920 dikey oyun
ekran görüntüleri; eklenirse `manifest.json`'a `"screenshots"` alanı eklenir.

## Tasarım yönü (Gemini istemi için)

- Renkler: turuncu `#ff7a1a` vurgu, neredeyse siyah `#070606` zemin, beyaz detay. Uygulamanın temasıyla aynı.
- Küçük boyutta okunmalı: 16–48 px'te tek, net bir şekil. **Yazı yok** (GOALBOUND yazısı küçük ikonda okunmaz);
  en fazla "GB" monogramı.
- Fikir: stilize futbol topu, kalkan arma, yukarı ok/yükseliş (kariyer), skorbord/LED dokusu (oyunun tasarım dili).
- Gerçek kulüp armaları, lig/sponsor logoları, gerçek forma desenleri kullanılmamalı.
- Düz renkler, güçlü kontrast; ince çizgi ve gradyan detayı küçük boyutta kaybolur.

Örnek istem: *"Mobile game app icon, 1024x1024, flat vector style. A bold stylized football inside a shield
shape, bright orange (#ff7a1a) and white on a near-black (#070606) background, strong silhouette readable at
48px, no text, no real club or brand logos, centered, minimal detail."*
