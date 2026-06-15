const WP_API_BASE =
  process.env.WP_API_BASE || "https://cms.filoteso.co.in/wp-json/wp/v2";

function cleanHtml(html = "") {
  return String(html).replace(/<[^>]*>/g, "").trim();
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
    cleanHtml(post?.title?.rendered) ||
    "Filo Teso blog image"
  );
}

function getCategoryName(post) {
  return (
    post?._embedded?.["wp:term"]?.[0]?.[0]?.name ||
    "Fashion"
  );
}

function getReadTime(content = "") {
  const plainText = cleanHtml(content);
  const words = plainText.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));

  return `${minutes} min read`;
}

function formatDate(dateString) {
  if (!dateString) return "";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateString));
}

export function normalizePost(post) {
  return {
    id: post.id,
    title: cleanHtml(post?.title?.rendered),
    slug: post.slug,
    excerpt: cleanHtml(post?.excerpt?.rendered),
    content: post?.content?.rendered || "",
    category: getCategoryName(post),
    date: formatDate(post.date),
    modifiedDate: post.modified,
    readTime: getReadTime(post?.content?.rendered),
    image: getFeaturedImage(post),
    imageAlt: getFeaturedImageAlt(post),
  };
}

export async function getBlogPosts() {
  const res = await fetch(
    `${WP_API_BASE}/posts?_embed&per_page=12&status=publish`,
    {
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch WordPress blog posts");
  }

  const posts = await res.json();

  return posts.map(normalizePost);
}

export async function getBlogCategories() {
  const res = await fetch(
    `${WP_API_BASE}/categories?per_page=50&hide_empty=true`,
    {
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch WordPress categories");
  }

  const categories = await res.json();

  return [
    { id: "all", name: "All", slug: "all" },
    ...categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
    })),
  ];
}

export async function getBlogPageData() {
  const [posts, categories] = await Promise.all([
    getBlogPosts(),
    getBlogCategories(),
  ]);

  return {
    posts,
    categories,
  };
}