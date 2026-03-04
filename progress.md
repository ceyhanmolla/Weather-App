1) Proje Tanımı & Vizyon

    Amaç: Basit, tarayıcıda çalışan canlı hava durumu uygulaması (MVP).

    Hedef Kitle: Hızlıca güncel hava bilgisi almak isteyen kullanıcılar.

    Temel Teknoloji: Saf HTML / CSS / JavaScript (tarayıcı-side).

2) Proje Fazları (Yol Haritası)
Phase 1: Temel Mimari ve Kurulum (Sistem Tasarımı)

    [x] Proje iskeletinin oluşturulması ve bağımlılıkların yüklenmesi.

    [x] agent.md dosyasının projenin mevcut durumuna göre özelleştirilmesi.

    [ ] Veritabanı şemasının tasarlanması ve ilk migrasyonların yapılması.

    [ ] Ortam değişkenlerinin (.env) ve güvenlik yapılandırmalarının belirlenmesi.

Phase 2: Çekirdek Özellikler (MVP)

    [ ] Kullanıcı yönetimi ve kimlik doğrulama (Auth) sisteminin kurulması.

    [ ] Temel API uç noktalarının (endpoints) kodlanması.

    [ ] Veri modellerinin oluşturulması ve CRUD işlemlerinin tamamlanması.

        [x] UI/UX prototipinin fonksiyonel hale getirilmesi.
        - Oluşturulan dosyalar: `index.html`, `styles.css`, `app.js` (proje kökünde).
        - Açıklama: Uygulama konumundan veya şehir aramasından Open-Meteo ve Nominatim kullanarak güncel hava verisini çekiyor.

Test & Çalıştırma:

- Hızlı başlatma: proje kökünde şu komutla basit HTTP sunucusu başlatın ve tarayıcıda açın:

```bash
cd /home/ceyhanmolla/Yazılım
python3 -m http.server 8000
# sonra http://localhost:8000 adresini açın
```

- Test notları:
    - Tarayıcı konum izni verilirse uygulama kullanıcı konumunu kullanır.
    - Konum izni reddedilirse varsayılan olarak "Istanbul" aranır.
    - Hava kodlarına göre arayüz teması (`clear`, `rain`, `snow`, vb.) dinamik değişir.

Güvenlik & Gizlilik:

- Harici API çağrıları (Open-Meteo, Nominatim) doğrudan tarayıcıdan yapılıyor; gizli anahtar gerektirmez.
- Kişisel veri depolanmıyor.

Sonraki adımlar: İsteğe bağlı olarak UI detaylarını zenginleştirme ve hata durumları için daha iyi bildirimler ekleme.

Recent updates (kısa):

- UI geliştirmeleri: `index.html` ve `styles.css` güncellendi — hava ikonu alanı, animasyonlu düğmeler, yükleme spinner'ı ve toast bildirimleri eklendi.
- Hata yönetimi: `app.js` üzerinde kapsamlı hata yakalama, `showToast()` bildirimleri ve yeniden deneme (Yeniden Dene) desteği eklendi.
- README: `README.md` eklendi; hızlı başlatma ve notlar içerir.

- İkon seti: `icons.js` eklendi; SVG ikon seti genişletildi ve `app.js` bunun üzerinden ikonları kullanacak şekilde güncellendi.

- SW iyileştirmeleri: `sw.js` güncellendi — `stale-while-revalidate` stratejisi uygulandı, `CACHE_VERSION` ile versiyonlama eklendi ve basit `sync` handler ile arka plan önbellek yenileme sağlandı.

- İkon seti: `icons.js` eklendi; SVG ikon seti genişletildi ve `app.js` bunun üzerinden ikonları kullanacak şekilde güncellendi.

- Offline: `sw.js` eklendi; statik varlıklar önbelleğe alınıyor ve API çağrıları network-first ile cache'e kaydediliyor. Kullanıcı çevrimdışıysa önbellekteki veriler kullanılacak.

Optimizasyon Sonrası (Güncellenmiş):

- Code optimizations applied: `fetchWithTimeout` helper eklendi, DOM element cache'leme yapıldı, reverse-geocode tekrarı optimize edildi.
- Proxy server: `server.js` eklendi — Express'te çalışan basit proxy sunucusu Open-Meteo ve geocoding API'larını proxy'ler, caching (NodeCache, 30m TTL) ve rate-limiting (100 req/min per IP) sağlar.
- package.json: Eklendi — `express`, `cors`, `node-cache`, `node-fetch` bağımlılıkları ve Workbox build tooling.
- Workbox migration: `sw.js` Workbox-tabanlı versiyona geçirildi; `workbox-config.js` eklendi. Precache manifest-based versioning, StaleWhileRevalidate/NetworkFirst stratejileri uygulanır.
- Security: `index.html`'e CSP meta tag ve `preload` hints eklendi; dış kaynaklara yapılan istekler sınırlandırıldı.
- App update: `app.js`'de API endpoint'leri proxy'e (`/api/weather`, `/api/geocode`) yönlendirilmek üzere güncellendi.

Test & Çalıştırma:

- Proxy sunucusu ile: `npm install && npm start` → http://localhost:3000
- Workbox build: `npm run build` → precache manifest oluştur ve `sw.js`'yi güncelleyin.

Security Audit & Fixes (Completed):

- Security audit raporu oluşturuldu: `security-audit.md`
- Critical/High seviyesi açıklar düzeltildi:
  1. SVG innerHTML XSS → DOMParser ile safe parsing uygulandı (`setSvgIcon` helper)
  2. Numeric parameter validation → lat/lon için `validateCoordinates()` helper eklendi
  3. CORS whitelist → whitelist-based CORS konfigürasyonu uygulandı
  4. Trust proxy header → `app.set('trust proxy')` eklendi
  5. Information disclosure → Generic error messages uygulandı
- .env.example: Production environment variables şablonu oluşturuldu

Test notları:

- Tarayıcıda `python3 -m http.server 8000` ile başlatıp `http://localhost:8000` açın.
- Konum izni verildiğinde uygulama doğrudan kullanıcının konumundan veri çeker.
- Arama sonucu yoksa kullanıcı bilgilendirilir ve toast gösterilir.

Feature Enhancement Phase (Completed):

1. **Autocomplete Search Suggestions** ✅
   - HTML: `<input id="searchInput">` ve `<div id="suggestionsDropdown">` eklendi
   - CSS: `.suggestions-dropdown` ve `.suggestion-item` stilleri eklendi
   - JavaScript: 300ms debounced input event listener eklendi
   - Davranış: Kullanıcı 2+ karakter yazdığında `/api/geocode` çağrılır, dropdown'da top 5 sonuç gösterilir
   - Click handler: Suggestion'a tıklandığında otomatik olarak `fetchWeather()` çağrılır
   - Outside click: Dropdown otomatik olarak input'un dışında tıklandığında kapanır

2. **Nearest Location Fallback** ✅
   - Yeni `fetchWeatherWithFallback(lat, lon)` fonksiyonu eklendi
   - Davranış: `fetchWeather()` başarısız olursa fallback tetiklenir
   - Algoritma:
     1. Reverse geocode: Koordinatları şehir adına çevirir
     2. Geocode search: Şehir adını arar ve kanonik koordinatları alır
     3. Retry weather: Yeni koordinatlarla weather API'sini çağırır
     4. User notification: Toast ile "En yakın konum kullanılıyor: [CityName]" gösterilir
   - Error handling: Fallback başarısız olsa da user'a açık hata mesajı gösterilir

Test Results:
- Server logs: Autocomplete requests doğru şekilde `/api/geocode` çağrılarını yapıyor
- Syntax validation: `node -c app.js` başarılı
- Feature integration: Mevcut `fetchWeather()`, `searchByName()`, ve `init()` ile uyumlu


Phase 3: Gelişmiş Fonksiyonlar & Entegrasyonlar

    [ ] [Özellik A: Örn. Ödeme sistemleri] entegrasyonu.

    [ ] [Özellik B: Örn. Gerçek zamanlı bildirimler] yapısının kurulması.

    [ ] Harici servis (API) bağlantılarının test edilmesi.

Phase 4: Test, Güvenlik ve Optimizasyon

    [ ] Hata Ayıklama: Tüm modüllerin hata loglarının incelenmesi ve fixlenmesi.

    [ ] Güvenlik Taraması: security.md kurallarına göre tam tarama yapılması.

    [ ] Optimizasyon: optimizations.md kurallarına göre kodun iyileştirilmesi.

    [ ] Birim testlerinin (Unit Tests) yazılması ve QA kontrolü.

3) Yeni Fikirler & Gelecek Planları (Backlog)

    [ ] Yeni bir fikir geldiğinde buraya not et, odak dağılmasını engelle.

    [ ] Mobil uygulama desteği.

    [ ] Çoklu dil (i18n) desteği.

4) Notlar ve Kritik Uyarılar

    Önemli: Her faz bittiğinde bağlamı sıfırlamak için yeni bir chat penceresi açmayı unutma.

    Kritik Değişiklikler: Her kritik kod değişikliğinden sonra bağımsız bir AI agent'a güvenlik taratması yap.