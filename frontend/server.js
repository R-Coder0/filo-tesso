import fs from 'node:fs/promises'
import express from 'express'
import { Transform } from 'node:stream'
import {
  getRankMathApiBase,
  parseRankMathHead,
} from './src/utils/rankMathSeo.js'
import {
  getCanonicalUrl,
  getGenericRouteSeo,
  getProductListSeo,
  normalizeCanonicalPath,
  routeSeo,
  titleCase,
} from './src/utils/siteSeo.js'

// Constants
const isProduction = process.env.NODE_ENV === 'production'
const port = process.env.PORT || 5173
const base = process.env.BASE || '/'
const ABORT_DELAY = 10000
const API_TIMEOUT_MS = 3500
const RANK_MATH_CACHE_TTL_MS = 60 * 1000
const rankMathSeoCache = new Map()

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

const getWpApiBase = () =>
  trimTrailingSlash(
    process.env.SSR_WP_API_BASE ||
      process.env.VITE_WP_API_BASE ||
      'https://cms.filoteso.co.in/wp-json/wp/v2',
  )

const toProductList = (data) =>
  Array.isArray(data) ? data : data?.products || data?.data?.products || []

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

const fetchExternalJson = async (url) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
    })
    if (!response.ok) {
      throw new Error(`SSR fetch failed ${response.status} for ${url}`)
    }
    return response.json()
  } finally {
    clearTimeout(timeout)
  }
}

const safeFetchExternalJson = async (url) => {
  try {
    return await fetchExternalJson(url)
  } catch (error) {
    console.warn(`[ssr-data] ${error.message}`)
    return null
  }
}

const getProductRouteParams = (pathname) => {
  const [, , category = 'all', subcategory = 'all'] = pathname.split('/')
  return { category, subcategory }
}

const loadHomeSsrData = async () => {
  const [popularProducts, instagramFeed] = await Promise.all([
    safeFetchJson('/api/products?category=men&page=1&limit=20'),
    safeFetchJson('/api/instagram/posts'),
  ])

  return {
    homeNewPopular: {
      gender: 'men',
      category: 'all',
      products: toProductList(popularProducts),
      totalPages: Number(popularProducts?.data?.total_pages || 1),
    },
    homeInstagramFeed: instagramFeed,
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

const getBlogFeaturedImage = (post) =>
  post?._embedded?.['wp:featuredmedia']?.[0]?.source_url || ''

const loadRankMathSeo = async (postUrl) => {
  if (!postUrl) return {}

  const cached = rankMathSeoCache.get(postUrl)
  if (cached?.expiresAt > Date.now()) return cached.seo

  const rankMathResponse = await safeFetchExternalJson(
    `${getRankMathApiBase(getWpApiBase())}/getHead?url=${encodeURIComponent(postUrl)}`,
  )
  const seo = parseRankMathHead(rankMathResponse?.head)

  if (seo.title || seo.description) {
    rankMathSeoCache.set(postUrl, {
      seo,
      expiresAt: Date.now() + RANK_MATH_CACHE_TTL_MS,
    })
  }

  return seo
}

const loadBlogDetailSsrData = async (pathname) => {
  const [, slug] = pathname.replace(/^\/+/, '').split('/')
  if (!slug) return {}

  const posts = await safeFetchExternalJson(
    `${getWpApiBase()}/posts?slug=${encodeURIComponent(slug)}&_embed`,
  )
  const post = Array.isArray(posts) ? posts[0] : null
  if (!post) return { blogDetail: { slug } }
  const seo = await loadRankMathSeo(post.link)

  return {
    blogDetail: {
      slug,
      post: {
        title: stripHtml(post?.title?.rendered),
        excerpt: truncateText(post?.excerpt?.rendered),
        image: getBlogFeaturedImage(post),
        seo,
      },
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
  if (pathname.startsWith('/blog/')) return loadBlogDetailSsrData(pathname)

  return {}
}

const serializeSsrData = (data) =>
  JSON.stringify(data).replace(/</g, '\\u003c')

const injectSsrData = (htmlEnd, data) => {
  const script = `<script>window.__SSR_DATA__=${serializeSsrData(data)}</script>`
  return htmlEnd.replace('</div>', `</div>${script}`)
}

const removeHeadTag = (html, pattern) => html.replace(pattern, '')

const stripHtml = (value = '') =>
  String(value)
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()

const truncateText = (value, maxLength = 155) => {
  const text = stripHtml(value)
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 1).trim()}...`
}

const normalizeKeywords = (value, fallback) => {
  if (Array.isArray(value)) return value.filter(Boolean).join(', ')
  if (typeof value === 'string' && value.trim()) return value.trim()
  return fallback
}

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const getBlogDetailSeo = (pathname, ssrData = {}) => {
  const slug = pathname.split('/').filter(Boolean)[1] || ''
  const blog = ssrData.blogDetail?.post
  const fallbackTitle = titleCase(slug)

  return {
    title:
      blog?.seo?.title ||
      `${blog?.title || fallbackTitle || 'Filo Teso Blog'} | Filo Teso Blog`,
    description:
      blog?.seo?.description ||
      blog?.excerpt ||
      `Read ${fallbackTitle || 'this streetwear guide'} on the Filo Teso blog for modern streetwear fashion, styling ideas, and clothing inspiration.`,
    keywords: normalizeKeywords(
      blog?.seo?.keywords || blog?.keywords,
      `${fallbackTitle}, filo teso blog, streetwear fashion, modern streetwear fashion, premium streetwear brand india`,
    ),
    image: blog?.seo?.image || blog?.image,
    robots: blog?.seo?.robots,
  }
}

const getProductDetailSeo = (pathname, ssrData = {}) => {
  const product = ssrData.productDetail?.product
  const fallbackName = titleCase(pathname.split('/').filter(Boolean)[1])
  const productName = product?.name || fallbackName || 'Filo Teso Product'

  return {
    title: product?.seo?.metaTitle || `${productName} | Filo Teso`,
    description:
      product?.seo?.metaDescription ||
      truncateText(product?.description) ||
      `Shop ${productName} from Filo Teso, a premium streetwear clothing brand in India.`,
    keywords: normalizeKeywords(
      product?.seo?.keywords,
      `${productName}, filo teso clothing, premium streetwear brand india, streetwear clothing brand india`,
    ),
    image: product?.image,
  }
}

const getRouteSeo = (requestUrl, ssrData = {}) => {
  const { pathname } = new URL(requestUrl, 'http://localhost')
  const normalizedPath = normalizeCanonicalPath(pathname)
  const canonical = getCanonicalUrl(normalizedPath)

  if (routeSeo[normalizedPath]) {
    return {
      ...routeSeo[normalizedPath],
      canonical,
    }
  }

  if (normalizedPath === '/products' || normalizedPath.startsWith('/products/')) {
    return {
      ...getProductListSeo(normalizedPath),
      canonical,
    }
  }

  if (normalizedPath.startsWith('/product/')) {
    return {
      ...getProductDetailSeo(normalizedPath, ssrData),
      canonical,
    }
  }

  if (normalizedPath.startsWith('/blog/')) {
    return {
      ...getBlogDetailSeo(normalizedPath, ssrData),
      canonical,
    }
  }

  return {
    ...getGenericRouteSeo(normalizedPath),
    canonical,
  }
}

const buildRouteSeoTags = (seo) => {
  const tags = []

  if (seo.title) {
    tags.push(`<title data-rh="true">${escapeHtml(seo.title)}</title>`)
    tags.push(`<meta data-rh="true" name="title" content="${escapeHtml(seo.title)}" />`)
    tags.push(`<meta data-rh="true" property="og:title" content="${escapeHtml(seo.title)}" />`)
    tags.push(`<meta data-rh="true" name="twitter:title" content="${escapeHtml(seo.title)}" />`)
  }

  if (seo.description) {
    tags.push(
      `<meta data-rh="true" name="description" content="${escapeHtml(seo.description)}" />`,
    )
    tags.push(
      `<meta data-rh="true" property="og:description" content="${escapeHtml(seo.description)}" />`,
    )
    tags.push(
      `<meta data-rh="true" name="twitter:description" content="${escapeHtml(seo.description)}" />`,
    )
  }

  if (seo.keywords) {
    tags.push(`<meta data-rh="true" name="keywords" content="${escapeHtml(seo.keywords)}" />`)
  }

  if (seo.robots) {
    tags.push(`<meta data-rh="true" name="robots" content="${escapeHtml(seo.robots)}" />`)
  }

  if (seo.image) {
    tags.push(`<meta data-rh="true" property="og:image" content="${escapeHtml(seo.image)}" />`)
    tags.push(`<meta data-rh="true" name="twitter:image" content="${escapeHtml(seo.image)}" />`)
    tags.push('<meta data-rh="true" name="twitter:card" content="summary_large_image" />')
  }

  tags.push(`<meta data-rh="true" property="og:url" content="${escapeHtml(seo.canonical)}" />`)
  tags.push(`<link data-rh="true" rel="canonical" href="${escapeHtml(seo.canonical)}" />`)

  return tags.map((tag) => `    ${tag}`).join('\n')
}

const injectRouteSeoHead = (htmlStart, seo) => {
  if (!seo?.canonical) return htmlStart

  let next = htmlStart

  if (seo.title) {
    next = removeHeadTag(next, /\s*<title\b[\s\S]*?<\/title>/i)
    next = removeHeadTag(next, /\s*<meta\b(?=[^>]*\bname=["']title["'])[^>]*>/i)
    next = removeHeadTag(next, /\s*<meta\b(?=[^>]*\bproperty=["']og:title["'])[^>]*>/i)
    next = removeHeadTag(next, /\s*<meta\b(?=[^>]*\bname=["']twitter:title["'])[^>]*>/i)
  }

  if (seo.description) {
    next = removeHeadTag(next, /\s*<meta\b(?=[^>]*\bname=["']description["'])[^>]*>/i)
    next = removeHeadTag(
      next,
      /\s*<meta\b(?=[^>]*\bproperty=["']og:description["'])[^>]*>/i,
    )
    next = removeHeadTag(
      next,
      /\s*<meta\b(?=[^>]*\bname=["']twitter:description["'])[^>]*>/i,
    )
  }

  if (seo.keywords) {
    next = removeHeadTag(next, /\s*<meta\b(?=[^>]*\bname=["']keywords["'])[^>]*>/i)
  }

  if (seo.robots) {
    next = removeHeadTag(next, /\s*<meta\b(?=[^>]*\bname=["']robots["'])[^>]*>/i)
  }

  if (seo.image) {
    next = removeHeadTag(next, /\s*<meta\b(?=[^>]*\bproperty=["']og:image["'])[^>]*>/i)
    next = removeHeadTag(next, /\s*<meta\b(?=[^>]*\bname=["']twitter:image["'])[^>]*>/i)
    next = removeHeadTag(next, /\s*<meta\b(?=[^>]*\bname=["']twitter:card["'])[^>]*>/i)
  }

  next = removeHeadTag(next, /\s*<meta\b(?=[^>]*\bproperty=["']og:url["'])[^>]*>/i)
  next = removeHeadTag(next, /\s*<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/i)

  return next.replace('</head>', `${buildRouteSeoTags(seo)}\n  </head>`)
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

    const seo = getRouteSeo(url, ssrData)

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

        res.write(injectRouteSeoHead(htmlStart, seo))

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
