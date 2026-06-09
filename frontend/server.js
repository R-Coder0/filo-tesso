import fs from 'node:fs/promises'
import express from 'express'
import { Transform } from 'node:stream'

// Constants
const isProduction = process.env.NODE_ENV === 'production'
const port = process.env.PORT || 5173
const base = process.env.BASE || '/'
const ABORT_DELAY = 10000
const API_TIMEOUT_MS = 3500
const PRODUCT_CATEGORIES = ['men', 'women', 'customize']

// Cached production assets
const templateHtml = isProduction
  ? await fs.readFile('./dist/client/index.html', 'utf-8')
  : ''

// Create http server
const app = express()

const trimTrailingSlash = (value) => String(value || '').replace(/\/+$/, '')

const getApiUrl = () =>
  trimTrailingSlash(
    process.env.SSR_API_URL ||
      process.env.VITE_API_URL ||
      'http://localhost:5000',
  )

const toProductList = (data) => (Array.isArray(data) ? data : data?.products || [])

const buildApiPath = (pathname, params = {}) => {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value && value !== 'all') search.set(key, value)
  })
  const qs = search.toString()
  return qs ? `${pathname}?${qs}` : pathname
}

const fetchJson = async (path) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS)

  try {
    const response = await fetch(`${getApiUrl()}${path}`, {
      signal: controller.signal,
    })
    if (!response.ok) {
      throw new Error(`SSR fetch failed ${response.status} for ${path}`)
    }
    return response.json()
  } finally {
    clearTimeout(timeout)
  }
}

const safeFetchJson = async (path) => {
  try {
    return await fetchJson(path)
  } catch (error) {
    console.warn(`[ssr-data] ${error.message}`)
    return null
  }
}

const dedupeProducts = (products) => {
  const seen = new Set()
  return products.filter((product) => {
    const key = product?._id || product?.id || `${product?.name}-${product?.image}`
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

const interleave = (arrays) => {
  const max = Math.max(0, ...arrays.map((items) => items.length))
  const result = []

  for (let index = 0; index < max; index += 1) {
    arrays.forEach((items) => {
      if (items[index]) result.push(items[index])
    })
  }

  return result
}

const getProductRouteParams = (pathname) => {
  const [, , category = 'all', subcategory = 'all'] = pathname.split('/')
  return { category, subcategory }
}

const loadHomeSsrData = async () => {
  const [latest, allProducts, oversize, ...categoryLists] = await Promise.all([
    safeFetchJson('/api/products/latest?limit=20'),
    safeFetchJson('/api/products'),
    safeFetchJson('/api/products?subcategory=oversize-tshirt'),
    ...PRODUCT_CATEGORIES.map((category) =>
      safeFetchJson(buildApiPath('/api/products', { category })),
    ),
  ])

  const categoryWise = categoryLists.map((data) => toProductList(data))
  const bestsellers = interleave(categoryWise)

  return {
    homeLatestProducts: toProductList(latest).slice(0, 20),
    homeProducts: toProductList(allProducts).slice(0, 8),
    homeOversizeProducts: toProductList(oversize).slice(0, 8),
    homeBestsellerProducts: dedupeProducts(bestsellers),
  }
}

const loadProductListSsrData = async (pathname) => {
  const { category, subcategory } = getProductRouteParams(pathname)
  const products = await safeFetchJson(
    buildApiPath('/api/products', { category, subcategory }),
  )

  return {
    productList: {
      routeKey: `${category}:${subcategory}`,
      products: toProductList(products),
    },
  }
}

const loadProductDetailSsrData = async (pathname) => {
  const [, id] = pathname.replace(/^\/+/, '').split('/')
  if (!id) return {}

  const product = await safeFetchJson(`/api/products/${encodeURIComponent(id)}`)
  if (!product) return {}

  return {
    productDetail: {
      id,
      product,
    },
  }
}

const loadSsrData = async (requestUrl) => {
  const { pathname } = new URL(requestUrl, 'http://localhost')

  if (pathname === '/') return loadHomeSsrData()
  if (pathname === '/products' || pathname.startsWith('/products/')) {
    return loadProductListSsrData(pathname)
  }
  if (pathname.startsWith('/product/')) return loadProductDetailSsrData(pathname)

  return {}
}

const serializeSsrData = (data) =>
  JSON.stringify(data).replace(/</g, '\\u003c')

const injectSsrData = (htmlEnd, data) => {
  const script = `<script>window.__SSR_DATA__=${serializeSsrData(data)}</script>`
  return htmlEnd.replace('</div>', `</div>${script}`)
}

// Add Vite or respective production middlewares
/** @type {import('vite').ViteDevServer | undefined} */
let vite
if (!isProduction) {
  const { createServer } = await import('vite')
  vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    base,
  })
  app.use(vite.middlewares)
} else {
  const compression = (await import('compression')).default
  const sirv = (await import('sirv')).default
  app.use(compression())
  app.use(base, sirv('./dist/client', { extensions: [] }))
}

// Serve HTML
app.use('*all', async (req, res) => {
  try {
    const url =
      base === '/' ? req.originalUrl : req.originalUrl.replace(base, '/')
    const ssrData = await loadSsrData(req.originalUrl)

    /** @type {string} */
    let template
    /** @type {import('./src/entry-server.js').render} */
    let render
    if (!isProduction) {
      // Always read fresh template in development
      template = await fs.readFile('./index.html', 'utf-8')
      template = await vite.transformIndexHtml(url, template)
      render = (await vite.ssrLoadModule('/src/entry-server.jsx')).render
    } else {
      template = templateHtml
      render = (await import('./dist/server/entry-server.js')).render
    }

    let didError = false

    const { pipe, abort } = render(url, {
      onShellError() {
        res.status(500)
        res.set({ 'Content-Type': 'text/html' })
        res.send('<h1>Something went wrong</h1>')
      },
      onShellReady() {
        res.status(didError ? 500 : 200)
        res.set({ 'Content-Type': 'text/html' })

        const transformStream = new Transform({
          transform(chunk, encoding, callback) {
            res.write(chunk, encoding)
            callback()
          },
        })

        const [htmlStart, htmlEnd] = template.split(`<!--app-html-->`)

        res.write(htmlStart)

        transformStream.on('finish', () => {
          res.end(injectSsrData(htmlEnd, ssrData))
        })

        pipe(transformStream)
      },
      onError(error) {
        didError = true
        console.error(error)
      },
    }, ssrData)

    setTimeout(() => {
      abort()
    }, ABORT_DELAY)
  } catch (e) {
    vite?.ssrFixStacktrace(e)
    console.log(e.stack)
    res.status(500).end(e.stack)
  }
})

// Start http server
app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`)
})
