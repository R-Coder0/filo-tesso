const DEFAULT_API_VERSION = "v25.0";
const DEFAULT_CACHE_TTL_MS = 15 * 60 * 1000;
const PAGE_SIZE = 100;

let feedCache = {
  expiresAt: 0,
  value: null,
};
let feedRequest = null;

const cleanEnvValue = (value) => String(value || "").trim();

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

const getConfig = () => ({
  accessToken: cleanEnvValue(process.env.INSTAGRAM_ACCESS_TOKEN),
  userId: cleanEnvValue(process.env.INSTAGRAM_USER_ID),
  apiVersion:
    cleanEnvValue(process.env.INSTAGRAM_API_VERSION) || DEFAULT_API_VERSION,
  maxPosts: getMaxPosts(),
  cacheTtlMs: toPositiveNumber(
    process.env.INSTAGRAM_CACHE_TTL_MS,
    DEFAULT_CACHE_TTL_MS
  ),
});

const getGraphUrl = (version, path, params = {}) => {
  const cleanVersion = String(version).replace(/^\/+|\/+$/g, "");
  const cleanPath = String(path).replace(/^\/+/, "");
  const url = new URL(
    `https://graph.instagram.com/${cleanVersion}/${cleanPath}`
  );

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  return url;
};

const fetchGraphJson = async (url) => {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(10000),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || data?.error) {
    const error = new Error(
      data?.error?.message || `Instagram API request failed (${response.status})`
    );
    error.status = response.status || 502;
    throw error;
  }

  return data;
};

const resolveInstagramUser = async ({ accessToken, apiVersion, userId }) => {
  if (userId) return { userId, username: "" };

  const url = getGraphUrl(apiVersion, "me", {
    fields: "user_id,username",
    access_token: accessToken,
  });
  const response = await fetchGraphJson(url);
  const user = Array.isArray(response?.data) ? response.data[0] : response;

  return {
    userId: cleanEnvValue(user?.user_id || user?.id),
    username: cleanEnvValue(user?.username),
  };
};

const normalizePost = (media) => ({
  id: String(media?.id || ""),
  caption: cleanEnvValue(media?.caption),
  mediaType: cleanEnvValue(media?.media_type),
  mediaUrl: cleanEnvValue(media?.media_url),
  permalink: cleanEnvValue(media?.permalink),
  thumbnailUrl: cleanEnvValue(media?.thumbnail_url),
  timestamp: cleanEnvValue(media?.timestamp),
  username: cleanEnvValue(media?.username),
  shortcode: cleanEnvValue(media?.shortcode),
});

const fetchInstagramPosts = async (config) => {
  const account = await resolveInstagramUser(config);

  if (!account.userId) {
    const error = new Error(
      "Instagram user ID could not be resolved from the configured token"
    );
    error.status = 502;
    throw error;
  }

  const fields = [
    "id",
    "caption",
    "media_type",
    "media_url",
    "permalink",
    "thumbnail_url",
    "timestamp",
    "username",
    "shortcode",
  ].join(",");

  let nextUrl = getGraphUrl(config.apiVersion, `${account.userId}/media`, {
    fields,
    limit: Math.min(PAGE_SIZE, config.maxPosts),
    access_token: config.accessToken,
  }).toString();
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
    nextUrl = cleanEnvValue(page?.paging?.next);
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
    username:
      limitedPosts.find((post) => post.username)?.username ||
      account.username ||
      "filoteso.co.in",
    posts: limitedPosts,
    fetchedAt: new Date().toISOString(),
  };
};

const getInstagramFeed = async () => {
  const config = getConfig();

  if (!config.accessToken) {
    const error = new Error("Instagram access token is not configured");
    error.status = 503;
    error.code = "INSTAGRAM_NOT_CONFIGURED";
    throw error;
  }

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
  getInstagramFeed,
};
