# Canlı Hava Durumu — Tarayıcı Uygulaması

Basit, saf HTML/CSS/JS ile yazılmış bir canlı hava durumu uygulaması.

Çalıştırma (proxy server ile — önerilir):

```bash
cd /home/ceyhanmolla/Yazılım
npm install
npm start
# Tarayıcıda http://localhost:3000 açın
```

Eski yol (statik HTTP):

```bash
cd /home/ceyhanmolla/Yazılım
python3 -m http.server 8000
# Tarayıcıda http://localhost:8000 açın
```

Service Worker ve Workbox build:

```bash
npm run build
# Bu, precache manifest'i üretir ve `sw.js`'yi oluşturur
```

Özellikler:
- Kullanıcının konumunu (tarayıcı izin verirse) kullanarak güncel hava bilgisi gösterir.
- Şehir arama (Open-Meteo geocoding) desteği.
- Hava koşullarına göre temalar ve ikonlar.
- Basit hata bildirimleri ve yeniden deneme düğmesi.

Gizlilik ve Güvenlik:

- Proxy sunucusu (`server.js`) Express üzerinde çalışır ve dış API çağrılarını merkezîleştirir.
- CSP meta tag ile inline script ve dış kaynaklardan gelen istekler kısıtlanmıştır.
- Tüm API istekleri önce önbellekten sunulur; ağa indirme aşamasında 5 saniye timeout uygulanır.
- Proxy sunucusu NodeCache ile basit caching sağlar (30 dakika TTL) ve MemCache ile rate-limiting uygular (100 req/min per IP).
- Kişisel veri depolanmaz.

Yapı Dosyaları:

- `server.js`: Express proxy server (Open-Meteo ve geocoding API'larını proxy'ler)
- `package.json`: Node.js bağımlılıkları
- `workbox-config.js`: Workbox build konfigürasyonu
- `sw.js`: Workbox-tabanlı Service Worker

Notlar:

- Üretim: `npm start` ile proxy sunucusunu beklemeli modda başlatın veya container/lambda'da deploy edin (örn: Heroku, AWS Lambda, Vercel).
- Geliştirme: Lokal olarak `npm install && npm start` ile çalıştırabilirsiniz.

Service Worker / Offline:

- Uygulama Workbox tabanlı bir Service Worker (`sw.js`) içerir.
- Statik dosyalar (`index.html`, `styles.css`, `app.js`, `icons.js`) precache manifest'e göre yüklenir ve stale-while-revalidate stratejisi ile sunulur.
- Proxy API istekleri (`/api/...`) network-first ile işlenir ve başarılı yanıtlar optimize edilmiş önbelleğe kaydedilir.
- Service Worker yalnızca `http://localhost` veya HTTPS üzerinde çalışır.

Gelişmiş SW davranışı:

- Stale-While-Revalidate: Tarayıcı önbellekteki içeriği hemen gösterir, arka planda ağdan güncelleme getirir.
- Versiyonlama: Workbox, precache manifest hash'i ile build-time sürümleme sağlar; sürüm güncellendiğinde eski cache otomatik temizlenir.
- Background Sync: Tarayıcı destekliyorsa `refresh-weather` sync isteği kaydedilir ve SW arka planda önbelleği yeniden doğrular.
# Weather-App
