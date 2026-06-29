export const normalizeBlogSlug = (value = "") =>
  String(value || "")
    .split("#")[0]
    .split("?")[0]
    .replace(/^\/+|\/+$/g, "")
    .trim();

export function stripHtml(html = "") {
  return String(html)
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function formatDate(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getFeaturedImage(post) {
  return (
    post?._embedded?.["wp:featuredmedia"]?.[0]?.source_url ||
    "/placeholder-blog.jpg"
  );
}

function getFeaturedImageAlt(post) {
  return (
    post?._embedded?.["wp:featuredmedia"]?.[0]?.alt_text ||
    stripHtml(post?.title?.rendered) ||
    "Filo Teso blog image"
  );
}

function getCategory(post) {
  const category = post?._embedded?.["wp:term"]?.[0]?.[0];

  return {
    id: category?.id || "",
    name: category?.name || "Fashion",
    slug: category?.slug || "fashion",
  };
}

function getAuthor(post) {
  return post?._embedded?.author?.[0]?.name || "Filo Teso";
}

function getReadTime(content = "") {
  const text = stripHtml(content);
  const words = text.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));

  return `${minutes} min read`;
}

export function normalizeBlogPost(post, initialSeo = {}) {
  const category = getCategory(post);

  return {
    id: post.id,
    title: stripHtml(post?.title?.rendered),
    slug: normalizeBlogSlug(post.slug),
    excerpt: stripHtml(post?.excerpt?.rendered),
    content: post?.content?.rendered || "",
    date: formatDate(post.date),
    modifiedDate: formatDate(post.modified),
    rawDate: post.date,
    rawModifiedDate: post.modified,
    rankMathModifiedAt: post.modified_gmt || post.modified,
    readTime: getReadTime(post?.content?.rendered),
    image: getFeaturedImage(post),
    imageAlt: getFeaturedImageAlt(post),
    category,
    author: getAuthor(post),
    link: post.link,
    seo: initialSeo || {},
  };
}
