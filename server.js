/**
 * Simple Express proxy server for external APIs
 * Proxies Open-Meteo weather and geocoding requests
 * Implements caching and basic rate-limiting
 */

const express = require('express')
const cors = require('cors')
const fetch = require('node-fetch')
const NodeCache = require('node-cache')
const path = require('path')

const app = express()
const PORT = process.env.PORT || 3000

// Cache with 30-minute TTL
const cache = new NodeCache({stdTTL: 1800})

// Rate-limiting (simple in-memory, per IP)
const rateLimits = new Map()
const RATE_LIMIT_WINDOW = 60000 // 1 minute
const RATE_LIMIT_MAX = 100 // requests per window

// CORS whitelist
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:8000').split(',')
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true)
    else callback(new Error('CORS not allowed'))
  }
}))

// Trust proxy
app.set('trust proxy', process.env.TRUST_PROXY || 1)

// Serve only static assets, not source files
const publicFiles = ['index.html', 'styles.css', 'app.js', 'icons.js', 'sw.js']
app.use((req, res, next) => {
  const requestedFile = req.path.substring(1)
  if (req.method === 'GET' && (publicFiles.includes(requestedFile) || req.path === '/')) {
    return express.static(path.join(__dirname), {dotfiles: 'deny'})(req, res, next)
  }
  next()
})

// Validate coordinates
function validateCoordinates(lat, lon){
  const latNum = parseFloat(lat)
  const lonNum = parseFloat(lon)
  if(isNaN(latNum) || isNaN(lonNum) || latNum < -90 || latNum > 90 || lonNum < -180 || lonNum > 180){
    return null
  }
  return {lat: latNum, lon: lonNum}
}

// Rate-limiter middleware
function rateLimit(req, res, next){
  const ip = req.ip || req.connection.remoteAddress
  const now = Date.now()
  if (!rateLimits.has(ip)) rateLimits.set(ip, [])
  
  const timestamps = rateLimits.get(ip).filter(t => now - t < RATE_LIMIT_WINDOW)
  if (timestamps.length >= RATE_LIMIT_MAX){
    return res.status(429).json({error: 'Rate limit exceeded'})
  }
  timestamps.push(now)
  rateLimits.set(ip, timestamps)
  next()
}

app.use('/api/', rateLimit)

// Proxy: GET /api/weather
app.get('/api/weather', async (req, res) => {
  try{
    console.log('[DEBUG] Weather request:', req.query)
    const coords = validateCoordinates(req.query.latitude, req.query.longitude)
    if (!coords) {
      console.log('[DEBUG] Invalid coordinates')
      return res.status(400).json({error: 'Invalid coordinates'})
    }
    
    const cacheKey = `weather:${coords.lat},${coords.lon}`
    const cached = cache.get(cacheKey)
    if (cached) {
      console.log('[DEBUG] Returning cached weather')
      return res.json(cached)
    }
    
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current_weather=true&timezone=auto`
    console.log('[DEBUG] Fetching from:', url)
    const upstream = await fetch(url, {
      headers: {'User-Agent': 'weather-app-proxy/1.0'}
    })
    
    if (!upstream.ok) {
      console.error('[ERROR] Upstream returned:', upstream.status)
      throw new Error(`Upstream error: ${upstream.status}`)
    }
    
    const text = await upstream.text()
    console.log('[DEBUG] Upstream response length:', text.length)
    const data = JSON.parse(text)
    
    cache.set(cacheKey, data)
    res.json(data)
  }catch(e){
    console.error('[FATAL ERROR] Weather proxy:', e.message, e.stack)
    res.status(502).json({error: 'Service temporarily unavailable', debug: e.message})
  }
})

// Proxy: GET /api/geocode
app.get('/api/geocode', async (req, res) => {
  try{
    console.log('[DEBUG] Geocode request:', req.query)
    const {name} = req.query
    if (!name) return res.status(400).json({error: 'Missing name parameter'})
    
    const cacheKey = `geocode:${name.toLowerCase()}`
    const cached = cache.get(cacheKey)
    if (cached) {
      console.log('[DEBUG] Returning cached geocode')
      return res.json(cached)
    }
    
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1`
    console.log('[DEBUG] Fetching geocode from:', url)
    const upstream = await fetch(url, {
      headers: {'User-Agent': 'weather-app-proxy/1.0'}
    })
    
    if (!upstream.ok) {
      console.error('[ERROR] Upstream returned:', upstream.status)
      throw new Error(`Upstream error: ${upstream.status}`)
    }
    
    const text = await upstream.text()
    console.log('[DEBUG] Upstream response length:', text.length)
    const data = JSON.parse(text)
    
    cache.set(cacheKey, data)
    res.json(data)
  }catch(e){
    console.error('[FATAL ERROR] Geocode proxy:', e.message, e.stack)
    res.status(502).json({error: 'Service temporarily unavailable', debug: e.message})
  }
})

// Fallback: serve index.html for client-side routing
app.get('*', (req, res) => {
  console.log('[DEBUG] Fallback route:', req.path)
  res.sendFile(path.join(__dirname, 'index.html'), (err) => {
    if (err) {
      console.error('[ERROR] Failed to serve index.html:', err.message)
      res.status(500).json({error: 'Failed to serve index.html'})
    }
  })
})

app.listen(PORT, () => {
  console.log(`\n✅ Weather app proxy server running!`)
  console.log(`📍 Open http://localhost:${PORT} in browser\n`)
})
