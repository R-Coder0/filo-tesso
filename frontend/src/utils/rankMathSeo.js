const decodeHtmlEntities = (value = "") =>
  String(value)
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) =>
      String.fromCodePoint(Number.parseInt(code, 16))
    )
    .replace(/&nbsp;/gi, " ")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();

const getAttribute = (tag, attribute) => {
  const match = tag.match(
    new RegExp(`\\b${attribute}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, "i")
  );

  return match?.[2] || "";
};

export const getRankMathApiBase = (wpApiBase = "") => {
  const base = String(wpApiBase).replace(/\/+$/, "");

  if (/\/wp-json\/wp\/v2$/i.test(base)) {
    return base.replace(/\/wp-json\/wp\/v2$/i, "/wp-json/rankmath/v1");
  }

  return `${base}/rankmath/v1`;
};

export const getRankMathHeadUrl = (
  rankMathApiBase = "",
  postUrl = "",
  modifiedAt = ""
) => {
  const search = new URLSearchParams({ url: String(postUrl) });

  // Rank Math/edge caches can otherwise keep serving the previous metadata
  // immediately after an editor updates a post.
  if (modifiedAt) search.set("modified", String(modifiedAt));

  return `${String(rankMathApiBase).replace(/\/+$/, "")}/getHead?${search}`;
};

export const parseRankMathHead = (head = "") => {
  const meta = new Map();
  const articleTags = [];

  for (const match of String(head).matchAll(/<meta\b[^>]*>/gi)) {
    const tag = match[0];
    const key = (getAttribute(tag, "property") || getAttribute(tag, "name"))
      .toLowerCase()
      .trim();
    const content = decodeHtmlEntities(getAttribute(tag, "content"));

    if (!key || !content) continue;
    if (key === "article:tag") articleTags.push(content);
    if (!meta.has(key)) meta.set(key, content);
  }

  const titleTag = String(head).match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  const canonicalTag = String(head).match(
    /<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/i
  );

  return {
    title: decodeHtmlEntities(
      meta.get("og:title") ||
        meta.get("twitter:title") ||
        titleTag?.[1] ||
        ""
    ),
    description: decodeHtmlEntities(
      meta.get("description") ||
        meta.get("og:description") ||
        meta.get("twitter:description") ||
        ""
    ),
    keywords: meta.get("keywords") || articleTags.join(", "),
    image:
      meta.get("og:image") ||
      meta.get("twitter:image") ||
      meta.get("og:image:secure_url") ||
      "",
    robots: meta.get("robots") || "",
    canonical: canonicalTag
      ? decodeHtmlEntities(getAttribute(canonicalTag[0], "href"))
      : "",
  };
};
