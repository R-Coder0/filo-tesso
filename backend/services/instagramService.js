const crypto = require("crypto");

const DEFAULT_API_VERSION = "v20.0";
const DEFAULT_CACHE_TTL_MS = 15 * 60 * 1000;
const DEFAULT_GRAPH_API_BASE_URL = "https://graph.instagram.com";
const PAGE_SIZE = 100;

let feedCache = {
  expiresAt: 0,
  value: null,
};
let feedRequest = null;

const cleanEnvValue = (value) => String(value || "").trim();

const firstEnvValue = (...keys) => {
  for (const key of keys) {
    const value = cleanEnvValue(process.env[key]);
    if (value) return value;
  }

  return "";
};

const toPositiveNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const getMaxPosts = () => {
  const configured = Number(process.env.INSTAGRAM_MAX_POSTS);
  return Number.isFinite(configured) && configured > 0
    ? Math.floor(configured)
    : Number.POSITIVE_INFINITY;
};

const redactAccessToken = (urlValue) => {
  try {
    const url = new URL(String(urlValue));
    if (url.searchParams.has("access_token")) {
      url.searchParams.set("access_token", "[REDACTED]");
    }
    if (url.searchParams.has("appsecret_proof")) {
      url.searchParams.set("appsecret_proof", "[REDACTED]");
    }
    return url.toString();
  } catch {
    return String(urlValue)
      .replace(/access_token=[^&]+/g, "access_token=[REDACTED]")
      .replace(/appsecret_proof=[^&]+/g, "appsecret_proof=[REDACTED]");
  }
};

const getAppSecretProof = (accessToken, appSecret) => {
  if (!accessToken || !appSecret) return "";

  return crypto
    .createHmac("sha256", appSecret)
    .update(accessToken)
    .digest("hex");
};

const getGraphBaseUrl = () =>
  firstEnvValue("INSTAGRAM_GRAPH_BASE_URL", "META_GRAPH_BASE_URL") ||
  DEFAULT_GRAPH_API_BASE_URL;

const appendAppSecretProof = (urlValue, appSecretProof) => {
  if (!appSecretProof) return cleanEnvValue(urlValue);

  const url = new URL(String(urlValue));
  url.searchParams.set("appsecret_proof", appSecretProof);
  return url.toString();
};

const getConfig = () => ({
  accessToken: firstEnvValue("INSTAGRAM_ACCESS_TOKEN"),
  appSecret: firstEnvValue(
    "INSTAGRAM_APP_SECRET",
    "META_APP_SECRET",
    "FACEBOOK_APP_SECRET"
  ),
  userId: firstEnvValue(
    "INSTAGRAM_BUSINESS_ACCOUNT_ID",
    "INSTAGRAM_USER_ID",
    "INSTAGRAM_IG_USER_ID"
  ),
  username: firstEnvValue("INSTAGRAM_USERNAME") || "filoteso.co.in",
  graphBaseUrl: getGraphBaseUrl(),
  apiVersion:
    firstEnvValue("INSTAGRAM_API_VERSION", "META_GRAPH_API_VERSION") ||
    DEFAULT_API_VERSION,
  maxPosts: getMaxPosts(),
  cacheTtlMs: toPositiveNumber(
    process.env.INSTAGRAM_CACHE_TTL_MS,
    DEFAULT_CACHE_TTL_MS
  ),
});

const createConfigError = (missing, message) => {
  const error = new Error(message);
  error.status = 503;
  error.code = "INSTAGRAM_CONFIG_ERROR";
  error.missing = missing;
  error.publicMessage = message;
  return error;
};

const validateConfig = (config) => {
  const missing = [];

  if (!config.accessToken) missing.push("INSTAGRAM_ACCESS_TOKEN");
  if (!config.userId) {
    missing.push(
      "INSTAGRAM_BUSINESS_ACCOUNT_ID or INSTAGRAM_USER_ID or INSTAGRAM_IG_USER_ID"
    );
  }

  if (missing.length) {
    throw createConfigError(
      missing,
      `Instagram feed is not configured. Missing: ${missing.join(", ")}`
    );
  }
};

const getGraphUrl = (baseUrl, version, path, params = {}) => {
  const cleanVersion = String(version || DEFAULT_API_VERSION).replace(
    /^\/+|\/+$/g,
    ""
  );
  const cleanPath = String(path).replace(/^\/+/, "");
  const cleanBaseUrl = String(baseUrl || DEFAULT_GRAPH_API_BASE_URL).replace(
    /\/+$/g,
    ""
  );
  const url = new URL(`${cleanBaseUrl}/${cleanVersion}/${cleanPath}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  return url;
};

const fetchGraphJson = async (url) => {
  const safeUrl = redactAccessToken(url);
  let response;
  let data;

  try {
    response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
    });
    data = await response.json().catch(() => null);
  } catch (fetchError) {
    const error = new Error(`Meta Graph API network error: ${fetchError.message}`);
    error.status = 502;
    error.code = "META_GRAPH_NETWORK_ERROR";
    error.safeUrl = safeUrl;
    error.metaError = { message: fetchError.message };
    throw error;
  }

  if (!response.ok || data?.error) {
    const metaError = data?.error || data || {};
    const error = new Error(
      metaError.message ||
        `Meta Graph API request failed with status ${response.status}`
    );
    error.status = response.status || 502;
    error.code = "META_GRAPH_API_ERROR";
    error.safeUrl = safeUrl;
    error.metaStatus = response.status;
    error.metaError = metaError;
    throw error;
  }

  return data;
};

const normalizePost = (media) => ({
  id: String(media?.id || ""),
  caption: cleanEnvValue(media?.caption),
  mediaType: cleanEnvValue(media?.media_type),
  mediaUrl: cleanEnvValue(media?.media_url),
  permalink: cleanEnvValue(media?.permalink),
  thumbnailUrl: cleanEnvValue(media?.thumbnail_url),
  timestamp: cleanEnvValue(media?.timestamp),
});

const fetchInstagramPosts = async (config) => {
  validateConfig(config);
  const appSecretProof = getAppSecretProof(config.accessToken, config.appSecret);

  const fields = [
    "id",
    "caption",
    "media_type",
    "media_url",
    "permalink",
    "thumbnail_url",
    "timestamp",
  ].join(",");

  const firstPageLimit = Number.isFinite(config.maxPosts)
    ? Math.min(PAGE_SIZE, config.maxPosts)
    : PAGE_SIZE;

  let nextUrl = getGraphUrl(
    config.graphBaseUrl,
    config.apiVersion,
    `${config.userId}/media`,
    {
      fields,
      limit: firstPageLimit,
      access_token: config.accessToken,
      appsecret_proof: appSecretProof,
    }
  ).toString();

  const posts = [];
  const seenIds = new Set();
  const seenPageUrls = new Set();

  while (
    nextUrl &&
    !seenPageUrls.has(nextUrl) &&
    posts.length < config.maxPosts
  ) {
    seenPageUrls.add(nextUrl);

    const page = await fetchGraphJson(nextUrl);
    const pagePosts = Array.isArray(page?.data) ? page.data : [];

    pagePosts.map(normalizePost).forEach((post) => {
      if (!post.id || seenIds.has(post.id)) return;
      seenIds.add(post.id);
      posts.push(post);
    });

    nextUrl = appendAppSecretProof(page?.paging?.next, appSecretProof);
  }

  const orderedPosts = posts.sort(
    (first, second) =>
      new Date(second.timestamp || 0).getTime() -
      new Date(first.timestamp || 0).getTime()
  );
  const limitedPosts = Number.isFinite(config.maxPosts)
    ? orderedPosts.slice(0, config.maxPosts)
    : orderedPosts;

  return {
    username: config.username,
    posts: limitedPosts,
    fetchedAt: new Date().toISOString(),
  };
};

const getInstagramConfigStatus = () => {
  const config = getConfig();

  return {
    hasAccessToken: Boolean(config.accessToken),
    hasAppSecret: Boolean(config.appSecret),
    hasUserId: Boolean(config.userId),
    graphBaseUrl: config.graphBaseUrl,
    apiVersion: config.apiVersion,
    username: config.username,
    maxPosts: Number.isFinite(config.maxPosts) ? config.maxPosts : "all",
  };
};

const getInstagramFeed = async () => {
  const config = getConfig();
  validateConfig(config);

  if (feedCache.value && feedCache.expiresAt > Date.now()) {
    return feedCache.value;
  }

  if (!feedRequest) {
    feedRequest = fetchInstagramPosts(config)
      .then((feed) => {
        feedCache = {
          value: feed,
          expiresAt: Date.now() + config.cacheTtlMs,
        };
        return feed;
      })
      .catch((error) => {
        if (feedCache.value) {
          return { ...feedCache.value, stale: true };
        }
        throw error;
      })
      .finally(() => {
        feedRequest = null;
      });
  }

  return feedRequest;
};

module.exports = {
  getInstagramConfigStatus,
  getInstagramFeed,
};
