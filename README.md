# GOALBOUND

Tek oyunculu futbol kariyer oyunu. Telefonda tarayıcıdan oynanır, ana ekrana eklenebilir ve internetsiz çalışır (PWA).

## Klasör yapısı

```
index.html            giriş sayfası
manifest.json         PWA bilgileri (ad, renkler, ikonlar, tam ekran)
sw.js                 service worker: offline önbellek
css/base.css          sayfa sıfırlama, efekt katmanı
css/goalbound.css     oyun arayüzü + varsayılan turuncu-siyah tema
js/data.js            ligler, takımlar, kupalar, isim havuzları (veriyi güncellemek için burası)
js/core.js            yardımcılar, tema, ses, avatar, kayıt sistemi
js/match.js           maç motoru
js/career.js          kariyer, sezonlar, haberler, arayüz
js/shell.js           tam ekran, efektler, başlatma
js/pwa.js             service worker kaydı
assets/icons/         ikonlar (ihtiyaç listesi: assets/icons/ICONS.md)
tools/build_single.py isteğe bağlı: her şeyi tek dist/goalbound.html dosyasında birleştirir
tools/make_icons.py   ana görselden tüm ikon boyutlarını üretir
```

## Yerelde çalıştırma

Service worker yalnızca `http://localhost` veya `https://` üzerinde çalışır; `index.html`'e çift tıklamak
oyunu açar ama offline/kurulum özellikleri devreye girmez.

```bash
cd goalbound-pwa
npx serve .
```

Terminalde yazan adresi aç (genelde `http://localhost:3000`). Node.js yüklü olmalı.
Alternatif: `python -m http.server 8000` → `http://localhost:8000`.

Telefonda denemek için bilgisayar ve telefon aynı Wi-Fi'da olmalı: `npx serve .` çıktısındaki
"Network" adresini telefonda aç. Not: service worker ve kurulum yalnızca `localhost` veya HTTPS üzerinde
çalışır; telefonda tam PWA denemesi için GitHub Pages (HTTPS) en kolayı.

## GitHub Pages'e yükleme

1. GitHub'da yeni bir depo aç (ör. `goalbound`), Public.
2. Bu klasörün **içindekileri** deponun köküne yükle (index.html en üstte olmalı):
   ```bash
   cd goalbound-pwa
   git init
   git add .
   git commit -m "GOALBOUND PWA"
   git branch -M main
   git remote add origin https://github.com/KULLANICI_ADIN/goalbound.git
   git push -u origin main
   ```
   (Git kullanmadan: depo sayfasında **Add file → Upload files** ile klasör içeriğini sürükleyip bırak.)
3. Depo → **Settings → Pages** → *Source: Deploy from a branch* → Branch: `main`, klasör `/ (root)` → Save.
4. 1–2 dakika sonra adres: `https://KULLANICI_ADIN.github.io/goalbound/`
5. Telefonda bu adresi Chrome'da aç → menü (⋮) → **Ana ekrana ekle / Uygulamayı yükle**.
   iPhone'da Safari → Paylaş → **Ana Ekrana Ekle**.

Tüm yollar göreceli olduğu için alt klasör adresinde (`/goalbound/`) sorunsuz çalışır. `.nojekyll`
dosyası GitHub'ın dosyaları işlemeden yayınlamasını sağlar.

## Güncelleme yayınlama

Dosyaları değiştirdikten sonra **`sw.js` içindeki `VERSION` değerini artır** (ör. `goalbound-v2`) ve yükle.
Telefonlar yeni sürümü bir sonraki açılışta indirir, ondan sonraki açılışta kullanır.

## Kayıtlar

Kayıtlar tarayıcının yerel deposunda durur ve **adrese bağlıdır**: dosyadan açılan oyun, `localhost` ve
GitHub Pages birbirinin kaydını görmez. Taşımak için oyunda **Kariyer → Ayarlar → Kayıt yedeği (JSON)**:
eski yerde *Dışa aktar*, yeni yerde *İçe aktar* (veya başlık ekranında boş yuvadaki *İçe aktar*).

## İkonlar

Henüz ikon yok; kurulum ikonları gelene kadar Chrome "Uygulamayı yükle" yerine yalnızca "Ana ekrana ekle"
kısayolu sunabilir. Liste ve Gemini istemi: `assets/icons/ICONS.md`.
