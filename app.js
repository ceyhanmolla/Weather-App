const PROXY_BASE = '/api'
const api = {
  weather: (lat, lon) => `${PROXY_BASE}/weather?latitude=${lat}&longitude=${lon}`,
  geocode: name => `${PROXY_BASE}/geocode?name=${encodeURIComponent(name)}`
}

const el = id => document.getElementById(id)
const appBg = el('appBg')
const iconEl = el('icon')
const spinner = el('spinner')
const toast = el('toast')

// Cache common elements to avoid repeated lookups
const elLocation = el('location')
const elDesc = el('desc')
const elDetails = el('details')
const elUpdated = el('updated')
const elTemp = el('temp')

// Helper: fetch with timeout using AbortController
function fetchWithTimeout(resource, options = {}, timeout = 8000){
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)
  return fetch(resource, {...options, signal: controller.signal}).finally(()=>clearTimeout(id))
}

function setLoading(on){
  if(on){ spinner.classList.add('show'); toast.classList.add('hidden') } else spinner.classList.remove('show')
}

function showToast(message, opts = {}){
  const {buttonText,buttonAction,timeout=6000} = opts
  toast.innerHTML = ''
  const msg = document.createElement('div')
  msg.textContent = message
  toast.appendChild(msg)
  if(buttonText && buttonAction){
    const btn = document.createElement('button')
    btn.className = 'btn'
    btn.textContent = buttonText
    btn.addEventListener('click', ()=>{ buttonAction(); toast.classList.add('hidden') })
    toast.appendChild(btn)
  }
  toast.classList.remove('hidden')
  if(timeout>0) setTimeout(()=>toast.classList.add('hidden'), timeout)
}

function mapWeather(code){
  // returns theme class, label and SVG icon (use shared ICONS)
  const icons = window.ICONS || {}
  if(code===0) return {cls:'clear',text:'Açık',svg:icons.sun||''}
  if([1,2,3].includes(code)) return {cls:'partly_cloudy',text:'Parçalı Bulutlu',svg:icons.cloud||''}
  if([45,48].includes(code)) return {cls:'fog',text:'Sis',svg:icons.fog||''}
  if((code>=51 && code<=67) || (code>=80 && code<=86)) return {cls:'rain',text:'Yağmur',svg:icons.rain||''}
  if((code>=71 && code<=77) || (code>=85 && code<=86)) return {cls:'snow',text:'Kar',svg:icons.snow||''}
  if([95,96,99].includes(code)) return {cls:'thunder',text:'Fırtına',svg:icons.storm||''}
  return {cls:'cloudy',text:'Bulutlu',svg:icons.cloud||''}
}

async function fetchWeather(lat, lon){
  setLoading(true)
  try{
    const res = await fetchWithTimeout(api.weather(lat, lon), {}, 8000)
    if(!res.ok) throw new Error('Sunucu hatası')
    const data = await res.json()
    if(!data.current_weather) throw new Error('Güncel hava verisi yok')
    const cw = data.current_weather
    const m = mapWeather(cw.weathercode)
    updateUI({lat,lon,temp:cw.temperature,wind:cw.windspeed,code:cw.weathercode,desc:m.text,time:cw.time,cls:m.cls,svg:m.svg})
    // reverse geocode for nicer location name (only if not already provided)
    if(!fetchWeather._providedName){
      try{
        const r = await fetchWithTimeout(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`, {}, 6000)
        const j = await r.json()
        if(j && j.address){
          const city = j.address.city||j.address.town||j.address.village||j.address.county||j.display_name
          elLocation.textContent = city
        } else elLocation.textContent = `${lat.toFixed(2)}, ${lon.toFixed(2)}`
      }catch(e){ elLocation.textContent = `${lat.toFixed(2)}, ${lon.toFixed(2)}` }
    } else {
      // reset flag for next calls
      fetchWeather._providedName = false
    }
    setLoading(false)
  }catch(err){
    setLoading(false)
    elDesc.textContent = 'Hava verisi alınamadı.'
    elDetails.textContent = err.message
    // Try fallback: reverse geocode → search city → fetch weather with city coordinates
    fetchWeatherWithFallback(lat, lon).catch(()=>{
      showToast('Hava verisi alınamadı. Tekrar dene.', {buttonText:'Yeniden Dene', buttonAction:()=>init(), timeout:0})
    })
  }
}

async function fetchWeatherWithFallback(lat, lon){
  try{
    // Try reverse geocoding to find city name
    const revRes = await fetchWithTimeout(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`, {}, 6000)
    const revData = await revRes.json()
    if(!revData || !revData.address) throw new Error('Reverse geocode failed')
    
    const cityName = revData.address.city || revData.address.town || revData.address.village || revData.address.county
    if(!cityName) throw new Error('No city found')
    
    // Search for that city to get canonical coordinates
    const geoRes = await fetchWithTimeout(api.geocode(cityName), {}, 7000)
    const geoData = await geoRes.json()
    if(!geoData.results || geoData.results.length === 0) throw new Error('City not found in search')
    
    const firstResult = geoData.results[0]
    elLocation.textContent = firstResult.name || cityName
    showToast(`En yakın konum kullanılıyor: ${firstResult.name || cityName}`, {timeout:4000})
    
    // Fetch weather with the city's coordinates
    setLoading(true)
    const weatherRes = await fetchWithTimeout(api.weather(firstResult.latitude, firstResult.longitude), {}, 8000)
    if(!weatherRes.ok) throw new Error('Weather fetch failed')
    
    const weatherData = await weatherRes.json()
    if(!weatherData.current_weather) throw new Error('No weather data')
    
    const cw = weatherData.current_weather
    const m = mapWeather(cw.weathercode)
    updateUI({temp:cw.temperature, wind:cw.windspeed, code:cw.weathercode, desc:m.text, time:cw.time, cls:m.cls, svg:m.svg})
    setLoading(false)
  }catch(e){
    throw new Error('Fallback location not found: ' + e.message)
  }
}

function setSvgIcon(svg){
  try{
    // Parse SVG safely
    const template = document.createElement('template')
    template.innerHTML = svg.trim()
    const svgElement = template.content.firstElementChild
    
    if (!svgElement || !svgElement.tagName.toLowerCase().includes('svg')) {
      throw new Error('Invalid SVG element')
    }
    
    iconEl.innerHTML = ''
    iconEl.appendChild(svgElement)
  }catch(e){
    console.warn('SVG rendering failed:', e.message)
    iconEl.textContent = '●'
  }
}

function updateUI({temp,wind,code,desc,time,cls,svg}){
  appBg.className = `app-bg ${cls}`
  elTemp.textContent = `${Math.round(temp)}°C`
  elDesc.textContent = desc
  elDetails.textContent = `Rüzgar: ${wind} km/s · Kod: ${code}`
  elUpdated.textContent = `Güncellendi: ${new Date(time).toLocaleString()}`
  if(svg) setSvgIcon(svg)
}

async function searchByName(name){
  setLoading(true)
  try{
    const r = await fetchWithTimeout(api.geocode(name), {}, 7000)
    if(!r.ok) throw new Error('Arama API hatası')
    const j = await r.json()
    if(!j.results || j.results.length===0) throw new Error('Konum bulunamadı')
    const p = j.results[0]
    // Provide the display name to avoid an extra reverse geocode inside fetchWeather
    fetchWeather._providedName = true
    elLocation.textContent = p.name || p.country || p.display_name || `${p.latitude.toFixed(2)}, ${p.longitude.toFixed(2)}`
    fetchWeather(p.latitude, p.longitude)
  }catch(e){ setLoading(false); showToast('Arama başarısız: '+e.message, {timeout:5000}) }
}

document.getElementById('searchBtn').addEventListener('click', ()=>{
  const v = el('searchInput').value.trim()
  if(v) searchByName(v)
})
document.getElementById('refreshBtn').addEventListener('click', ()=>{ init() })

// Autocomplete behavior
const searchInput = el('searchInput')
const suggestionsDropdown = el('suggestionsDropdown')
let debounceTimer

searchInput.addEventListener('input', ()=>{
  const query = searchInput.value.trim()
  clearTimeout(debounceTimer)
  
  if(query.length < 2){
    suggestionsDropdown.classList.add('hidden')
    return
  }
  
  debounceTimer = setTimeout(async ()=>{
    try{
      const res = await fetchWithTimeout(api.geocode(query), {}, 5000)
      const data = await res.json()
      
      if(!data.results || data.results.length === 0){
        suggestionsDropdown.classList.add('hidden')
        return
      }
      
      suggestionsDropdown.innerHTML = ''
      data.results.slice(0, 5).forEach(result => {
        const item = document.createElement('div')
        item.className = 'suggestion-item'
        const name = result.name || result.display_name || ''
        const country = result.country || ''
        item.innerHTML = `<strong>${name}</strong><small>${country}</small>`
        item.addEventListener('click', () => {
          searchInput.value = name
          suggestionsDropdown.classList.add('hidden')
          fetchWeather._providedName = true
          elLocation.textContent = name
          fetchWeather(result.latitude, result.longitude)
        })
        suggestionsDropdown.appendChild(item)
      })
      
      suggestionsDropdown.classList.remove('hidden')
    }catch(e){
      console.warn('Autocomplete search failed:', e.message)
      suggestionsDropdown.classList.add('hidden')
    }
  }, 300)
})

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  if(e.target !== searchInput && e.target.parentElement !== suggestionsDropdown){
    suggestionsDropdown.classList.add('hidden')
  }
})

function init(){
  if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(pos=>{
      fetchWeather(pos.coords.latitude, pos.coords.longitude)
    }, err=>{
      showToast('Konum izni yok — varsayılan: Istanbul', {timeout:3000})
      searchByName('Istanbul')
    },{enableHighAccuracy:true,timeout:7000})
  }else{
    showToast('Tarayıcı konum desteği yok. Şehir arayın.', {timeout:4000})
  }
}

init()

// Service worker registration and online/offline notifications
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then(reg => {
    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          showToast('Yeni sürüm hazır. Sayfayı yenileyin.', {buttonText: 'Yenile', buttonAction: () => location.reload(), timeout: 0})
        }
      })
    })
  }).catch(() => console.warn('ServiceWorker kayıt başarısız'))
}

window.addEventListener('offline', () => showToast('Çevrimdışı mod — önbellekten devam ediyor.', {timeout:3000}))
window.addEventListener('online', () => showToast('Çevrimiçi — veriler güncelleniyor.', {timeout:2000}))

// Try to register a background sync to refresh cached API data when connection returns
function tryRegisterSync(){
  if (!('serviceWorker' in navigator) || !('SyncManager' in window)) return
  navigator.serviceWorker.ready.then(reg => {
    reg.sync.register('refresh-weather').catch(()=>{
      // sync registration failed or unsupported by browser
    })
  })
}

window.addEventListener('offline', ()=>{
  // attempt to register a sync so SW can refresh caches later
  tryRegisterSync()
})

// Listen for messages from SW (e.g., sync complete)
navigator.serviceWorker && navigator.serviceWorker.addEventListener && navigator.serviceWorker.addEventListener('message', ev => {
  try{
    const d = ev.data || {}
    if (d.type === 'SW_SYNC_COMPLETE') showToast('Önbellek güncellendi (arka plan).', {timeout:2500})
  }catch(e){}
})
