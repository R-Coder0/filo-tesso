import fs from 'node:fs/promises'
import express from 'express'
import { Transform } from 'node:stream'

// Constants
const isProduction = process.env.NODE_ENV === 'production'
const port = process.env.PORT || 5173
const base = process.env.BASE || '/'
const ABORT_DELAY = 10000
const API_TIMEOUT_MS = 3500
const SITE_ORIGIN = 'https://filoteso.co.in'

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

const loadBlogDetailSsrData = async (pathname) => {
  const [, slug] = pathname.replace(/^\/+/, '').split('/')
  if (!slug) return {}

  const posts = await safeFetchExternalJson(
    `${getWpApiBase()}/posts?slug=${encodeURIComponent(slug)}&_embed`,
  )
  const post = Array.isArray(posts) ? posts[0] : null
  if (!post) return { blogDetail: { slug } }

  return {
    blogDetail: {
      slug,
      post: {
        title: stripHtml(post?.title?.rendered),
        excerpt: truncateText(post?.excerpt?.rendered),
        image: getBlogFeaturedImage(post),
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

const homeSeo = {
  title: 'Filo Teso | Premium Streetwear Clothing Brand in India',
  description:
    'Shop Filo Teso for premium streetwear, graphic tees, oversized fits, and everyday styles made for comfort, quality, and self-expression.',
  keywords:
    'streetwear clothing brand india, premium streetwear brand india, graphic streetwear clothing, streetwear fashion india, premium graphic t shirts india, urban streetwear brand india, modern streetwear clothing, graphic tees india, premium fashion brand india, filo teso',
}

const routeSeo = {
  '/': homeSeo,
  '/about': {
    title: 'About Filo Teso | Premium Streetwear Clothing Brand in India',
    description:
      'Learn about Filo Teso, a premium streetwear clothing brand in India focused on oversized T-shirts, graphic tees, quality craftsmanship, and modern streetwear fashion.',
    keywords:
      'about filo teso, filo teso streetwear, streetwear clothing brand india, premium streetwear brand india, indian streetwear brand, filo teso clothing, premium graphic tees india, oversized t shirts india, modern streetwear fashion',
  },
  '/contact': {
    title: 'Contact Filo Teso | Customer Support & Store Information',
    description:
      "Get in touch with Filo Teso for product inquiries, order support, collaborations, or general questions. We're here to help with all your streetwear needs.",
    keywords:
      'contact filo teso, filo teso customer support, contact streetwear brand india, filo teso contact information, customer service filo teso, streetwear clothing support, filo teso help',
  },
  '/blog': {
    title: 'Filo Teso Blog | Streetwear Fashion Guides & Style Notes',
    description:
      'Read the Filo Teso blog for streetwear fashion guides, styling ideas, product stories, and modern clothing inspiration.',
    keywords:
      'filo teso blog, streetwear fashion guides, modern streetwear fashion, premium streetwear brand india, oversized t shirts india, premium graphic tees india',
  },
  '/collabration': {
    title: 'Collaborate With Filo Teso | Streetwear Brand Partnerships',
    description:
      'Connect with Filo Teso for streetwear collaborations, creator partnerships, styling projects, and brand opportunities.',
    keywords:
      'filo teso collaboration, streetwear brand collaboration india, creator partnerships, fashion collaborations india',
  },
  '/help/cancellation-and-returns': {
    title: 'Cancellation & Returns | Filo Teso Help',
    description:
      'Learn about Filo Teso cancellation, return, and exchange support for your streetwear clothing orders.',
    keywords:
      'filo teso returns, filo teso cancellation, streetwear clothing support, order return help',
  },
  '/help/faqs': {
    title: 'Filo Teso FAQs | Streetwear Clothing Help',
    description:
      'Find answers to common questions about Filo Teso orders, sizing, shipping, returns, payments, and customer support.',
    keywords:
      'filo teso faq, filo teso help, streetwear clothing support, customer service filo teso',
  },
  '/help/payments': {
    title: 'Payments Help | Filo Teso',
    description:
      'Get help with Filo Teso payment options, payment issues, checkout support, and order payment questions.',
    keywords:
      'filo teso payments, payment support, checkout help, streetwear clothing support',
  },
  '/help/shipping': {
    title: 'Shipping Help | Filo Teso',
    description:
      'Learn about Filo Teso shipping information, delivery support, order tracking, and streetwear order updates.',
    keywords:
      'filo teso shipping, order tracking, delivery support, streetwear clothing support',
  },
  '/consumer-policies/privacy': {
    title: 'Privacy Policy | Filo Teso',
    description:
      'Read the Filo Teso privacy policy to understand how customer information is collected, used, and protected.',
    keywords:
      'filo teso privacy policy, customer privacy, data protection, filo teso policies',
  },
  '/consumer-policies/return-and-refund': {
    title: 'Return & Refund Policy | Filo Teso',
    description:
      'Read the Filo Teso return and refund policy for order returns, refunds, exchanges, and customer support.',
    keywords:
      'filo teso refund policy, filo teso return policy, exchange policy, streetwear clothing support',
  },
  '/consumer-policies/security': {
    title: 'Security Policy | Filo Teso',
    description:
      'Read the Filo Teso security policy for information about safe shopping, payment protection, and customer account safety.',
    keywords:
      'filo teso security policy, secure shopping, payment security, customer account safety',
  },
  '/consumer-policies/terms-and-conditions': {
    title: 'Terms & Conditions | Filo Teso',
    description:
      'Read the Filo Teso terms and conditions for using the website, placing orders, payments, returns, and customer responsibilities.',
    keywords:
      'filo teso terms and conditions, website terms, shopping terms, filo teso policies',
  },
  '/login': {
    title: 'Login | Filo Teso',
    description:
      'Login to your Filo Teso account to manage orders, wishlist, checkout, and streetwear shopping details.',
    keywords: 'filo teso login, customer account, streetwear shopping account',
  },
  '/register': {
    title: 'Create Account | Filo Teso',
    description:
      'Create a Filo Teso account to shop streetwear, manage your orders, save wishlist items, and checkout faster.',
    keywords:
      'filo teso register, create account, streetwear shopping account',
  },
  '/profile': {
    title: 'My Profile | Filo Teso',
    description:
      'Manage your Filo Teso profile, order details, saved information, and streetwear shopping account.',
    keywords: 'filo teso profile, customer profile, account details',
  },
  '/wishlist': {
    title: 'Wishlist | Filo Teso',
    description:
      'View your saved Filo Teso streetwear pieces, graphic tees, oversized T-shirts, and favorite products.',
    keywords: 'filo teso wishlist, saved products, graphic tees, oversized t shirts',
  },
  '/checkout': {
    title: 'Checkout | Filo Teso',
    description:
      'Complete your Filo Teso checkout for premium streetwear clothing, graphic tees, and oversized T-shirts.',
    keywords: 'filo teso checkout, streetwear checkout, buy graphic tees india',
  },
  '/my-orders': {
    title: 'My Orders | Filo Teso',
    description:
      'Track and manage your Filo Teso orders, shipping updates, and streetwear clothing purchase history.',
    keywords: 'filo teso orders, order tracking, customer orders',
  },
  '/order-confirmation': {
    title: 'Order Confirmation | Filo Teso',
    description:
      'Your Filo Teso order confirmation page for premium streetwear clothing purchases.',
    keywords: 'filo teso order confirmation, streetwear order, order status',
  },
  '/reveiw': {
    title: 'Review Filo Teso | Share Your Feedback',
    description:
      'Share your Filo Teso review and feedback to help us improve our streetwear clothing experience.',
    keywords: 'filo teso review, customer feedback, streetwear clothing review',
  },
  '/shiprocket-checkout-return': {
    title: 'Checkout Return | Filo Teso',
    description:
      'Return to Filo Teso after checkout and continue tracking your premium streetwear clothing order.',
    keywords: 'filo teso checkout return, order status, streetwear order',
  },
}

const subcategoryLabels = {
  'oversize-tshirt': 'Oversized T-Shirts',
  'polo-tshirt': 'Polo T-Shirts',
  'regular-tshirt': 'T-Shirts',
  'regular-shirt': 'Shirts',
  'oversize-shirt': 'Oversized Shirts',
  jeans: 'Jeans',
  trousers: 'Trousers',
}

const categoryLabels = {
  men: 'Men',
  women: 'Women',
  customize: 'Custom',
}

const normalizeCanonicalPath = (pathname) => {
  const cleanPathname = String(pathname || '/').split('#')[0].split('?')[0]
  if (!cleanPathname || cleanPathname === '/') return '/'
  return cleanPathname.replace(/\/+$/, '')
}

const getCanonicalUrl = (pathname) => {
  const cleanPath = normalizeCanonicalPath(pathname)
  return cleanPath === '/' ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${cleanPath}`
}

const titleCase = (value) =>
  String(value || '')
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ')

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
    title: `${blog?.title || fallbackTitle || 'Filo Teso Blog'} | Filo Teso Blog`,
    description:
      blog?.excerpt ||
      `Read ${fallbackTitle || 'this streetwear guide'} on the Filo Teso blog for modern streetwear fashion, styling ideas, and clothing inspiration.`,
    keywords: normalizeKeywords(
      blog?.keywords,
      `${fallbackTitle}, filo teso blog, streetwear fashion, modern streetwear fashion, premium streetwear brand india`,
    ),
    image: blog?.image,
  }
}

const getProductListSeo = (pathname) => {
  const { category, subcategory } = getProductRouteParams(pathname)
  const categoryLabel = categoryLabels[category] || titleCase(category)
  const subcategoryLabel = subcategoryLabels[subcategory] || titleCase(subcategory)

  if (!category || category === 'all') {
    return {
      title: 'Shop Premium Streetwear Clothing | Filo Teso',
      description:
        'Shop Filo Teso premium streetwear clothing, graphic tees, oversized T-shirts, modern fits, and everyday fashion essentials.',
      keywords:
        'filo teso clothing, premium streetwear brand india, streetwear clothing brand india, premium graphic tees india, oversized t shirts india',
    }
  }

  if (!subcategory || subcategory === 'all') {
    return {
      title: `${categoryLabel} Streetwear Clothing | Filo Teso`,
      description: `Shop ${categoryLabel.toLowerCase()} streetwear clothing from Filo Teso, including premium graphic tees, oversized fits, and modern everyday essentials.`,
      keywords: `${categoryLabel.toLowerCase()} streetwear clothing, filo teso clothing, premium streetwear brand india, modern streetwear fashion`,
    }
  }

  return {
    title: `${subcategoryLabel} for ${categoryLabel} | Filo Teso`,
    description: `Shop ${subcategoryLabel.toLowerCase()} for ${categoryLabel.toLowerCase()} from Filo Teso, a premium streetwear clothing brand in India focused on quality, comfort, and modern style.`,
    keywords: `${subcategoryLabel.toLowerCase()}, ${categoryLabel.toLowerCase()} streetwear clothing, filo teso clothing, premium streetwear brand india, oversized t shirts india, premium graphic tees india`,
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

const getGenericRouteSeo = (pathname) => {
  const label = titleCase(pathname.split('/').filter(Boolean).join(' '))

  return {
    title: `${label || 'Filo Teso'} | Filo Teso`,
    description:
      'Explore Filo Teso for premium streetwear clothing, graphic tees, oversized fits, and modern fashion essentials.',
    keywords:
      'filo teso, filo teso clothing, premium streetwear brand india, streetwear clothing brand india, modern streetwear fashion',
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
    tags.push(`<title>${escapeHtml(seo.title)}</title>`)
    tags.push(`<meta name="title" content="${escapeHtml(seo.title)}" />`)
    tags.push(`<meta property="og:title" content="${escapeHtml(seo.title)}" />`)
    tags.push(`<meta name="twitter:title" content="${escapeHtml(seo.title)}" />`)
  }

  if (seo.description) {
    tags.push(
      `<meta name="description" content="${escapeHtml(seo.description)}" />`,
    )
    tags.push(
      `<meta property="og:description" content="${escapeHtml(seo.description)}" />`,
    )
    tags.push(
      `<meta name="twitter:description" content="${escapeHtml(seo.description)}" />`,
    )
  }

  if (seo.keywords) {
    tags.push(`<meta name="keywords" content="${escapeHtml(seo.keywords)}" />`)
  }

  tags.push(`<meta property="og:url" content="${escapeHtml(seo.canonical)}" />`)
  tags.push(`<link rel="canonical" href="${escapeHtml(seo.canonical)}" />`)

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
