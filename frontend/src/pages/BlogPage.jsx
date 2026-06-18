import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Search,
  Sparkles,
  Tag,
} from "lucide-react";
import ClientHelmet from "../components/ClientHelmet";

const WP_API_BASE =
  import.meta.env.VITE_WP_API_BASE ||
  "https://cms.filoteso.co.in/wp-json/wp/v2";

function stripHtml(html = "") {
  return String(html)
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&amp;/g, "&")
    .trim();
}

function formatDate(dateString) {
  if (!dateString) return "";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateString));
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

function getCategoryName(post) {
  return post?._embedded?.["wp:term"]?.[0]?.[0]?.name || "Fashion";
}

function getReadTime(content = "") {
  const text = stripHtml(content);
  const words = text.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));

  return `${minutes} min read`;
}

function normalizePost(post) {
  return {
    id: post.id,
    title: stripHtml(post?.title?.rendered),
    slug: post.slug,
    excerpt: stripHtml(post?.excerpt?.rendered),
    category: getCategoryName(post),
    date: formatDate(post.date),
    readTime: getReadTime(post?.content?.rendered),
    image: getFeaturedImage(post),
    imageAlt: getFeaturedImageAlt(post),
  };
}

export default function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([
    { id: "all", name: "All", slug: "all" },
  ]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchBlogData() {
      try {
        setIsLoading(true);
        setErrorText("");

        const [postsRes, categoriesRes] = await Promise.all([
          fetch(`${WP_API_BASE}/posts?_embed&per_page=12&status=publish`),
          fetch(`${WP_API_BASE}/categories?per_page=50&hide_empty=true`),
        ]);

        if (!postsRes.ok) {
          throw new Error("WordPress posts API failed");
        }

        if (!categoriesRes.ok) {
          throw new Error("WordPress categories API failed");
        }

        const postsData = await postsRes.json();
        const categoriesData = await categoriesRes.json();

        if (!isMounted) return;

        setPosts(postsData.map(normalizePost));

        setCategories([
          { id: "all", name: "All", slug: "all" },
          ...categoriesData.map((category) => ({
            id: category.id,
            name: category.name,
            slug: category.slug,
          })),
        ]);
      } catch (error) {
        if (!isMounted) return;

        console.error("Blog API Error:", error);
        setErrorText("Unable to load blogs from WordPress CMS.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchBlogData();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesCategory =
        activeCategory === "All" || post.category === activeCategory;

      const searchValue = searchTerm.trim().toLowerCase();

      const matchesSearch =
        searchValue.length === 0 ||
        post.title.toLowerCase().includes(searchValue) ||
        post.excerpt.toLowerCase().includes(searchValue) ||
        post.category.toLowerCase().includes(searchValue);

      return matchesCategory && matchesSearch;
    });
  }, [posts, activeCategory, searchTerm]);

  return (
    <main className="min-h-screen w-full bg-white text-neutral-950">
      <ClientHelmet>
        <title>Filo Teso Blog | Streetwear Fashion Guides & Style Notes</title>
        <meta
          name="description"
          content="Read the Filo Teso blog for streetwear fashion guides, styling ideas, product stories, and modern clothing inspiration."
        />
        <meta
          name="keywords"
          content="filo teso blog, streetwear fashion guides, modern streetwear fashion, premium streetwear brand india, oversized t shirts india, premium graphic tees india"
        />
      </ClientHelmet>

      <section className="relative overflow-hidden bg-neutral-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_36%),linear-gradient(135deg,#050505_0%,#121212_48%,#2a2a2a_100%)]" />

        <div className="absolute left-0 top-0 h-full w-full opacity-[0.08]">
          <div className="h-full w-full bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:80px_80px]" />
        </div>

        <div className="relative z-10 mx-auto flex min-h-[460px] w-[min(100%-32px,1320px)] items-center py-24">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white backdrop-blur">
              <Sparkles size={15} />
              Filo Teso Journal
            </div>

            <h1 className="max-w-4xl text-[44px] font-bold leading-[0.98] tracking-[-0.06em] text-white sm:text-6xl lg:text-7xl">
              Style Notes for Modern Streetwear
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-white/75 sm:text-lg">
              Explore fashion guides, styling ideas, product stories, and
              streetwear inspiration crafted for everyday confidence.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <a
                href="#latest-blogs"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-neutral-950 transition hover:-translate-y-0.5 hover:bg-neutral-200"
              >
                Explore Blogs
                <ArrowRight size={17} />
              </a>

              <a
                href="/products"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/35 px-6 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:border-white hover:bg-white/10"
              >
                Shop Collection
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="latest-blogs" className="py-16 sm:py-20 lg:py-24">
        <div className="mx-auto w-[min(100%-32px,1320px)]">
          <div className="mb-9 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                Latest Articles
              </p>

              <h2 className="max-w-3xl text-3xl font-bold leading-tight tracking-[-0.045em] text-neutral-950 sm:text-5xl">
                Read the Latest from Filo Teso
              </h2>
            </div>

            <div className="flex h-13 w-full items-center gap-3 rounded-full border border-neutral-200 bg-neutral-50 px-4 lg:w-[360px]">
              <Search size={18} className="shrink-0 text-neutral-500" />
              <input
                type="text"
                placeholder="Search blogs..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="h-full w-full bg-transparent text-sm text-neutral-950 outline-none placeholder:text-neutral-400"
              />
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="grid gap-6 md:grid-cols-2">
              {isLoading ? (
                <div className="rounded-[28px] border border-neutral-200 bg-neutral-50 px-6 py-14 text-center md:col-span-2">
                  <h3 className="text-2xl font-bold tracking-[-0.04em]">
                    Loading blogs...
                  </h3>
                  <p className="mt-2 text-sm text-neutral-600">
                    Fetching latest articles from WordPress CMS.
                  </p>
                </div>
              ) : errorText ? (
                <div className="rounded-[28px] border border-red-200 bg-red-50 px-6 py-14 text-center md:col-span-2">
                  <h3 className="text-2xl font-bold tracking-[-0.04em] text-red-700">
                    Blog API Error
                  </h3>
                  <p className="mt-2 text-sm text-red-600">{errorText}</p>
                </div>
              ) : filteredPosts.length > 0 ? (
                filteredPosts.map((post) => (
                  <article
                    key={post.id}
                    className="group flex h-full flex-col rounded-[28px] border border-neutral-200 bg-white p-4 transition duration-300 hover:-translate-y-1 hover:border-neutral-950 hover:shadow-[0_24px_70px_rgba(0,0,0,0.08)]"
                  >
                    <a
                      href={`/blog/${post.slug}`}
                      className="block aspect-[16/10] overflow-hidden rounded-[22px] bg-neutral-100"
                    >
                      <img
                        src={post.image}
                        alt={post.imageAlt || post.title}
                        loading="lazy"
                        className="h-full w-full object-contain transition duration-300 group-hover:opacity-90"
                      />
                    </a>

                    <div className="flex flex-1 flex-col p-1 pt-5">
                      <div className="mb-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-neutral-500">
                        <span className="inline-flex items-center gap-1.5">
                          <Tag size={14} />
                          {post.category}
                        </span>

                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays size={14} />
                          {post.date}
                        </span>

                        <span className="inline-flex items-center gap-1.5">
                          <Clock3 size={14} />
                          {post.readTime}
                        </span>
                      </div>

                      <h3 className="text-2xl font-bold leading-tight tracking-[-0.04em] text-neutral-950">
                        <a
                          href={`/blog/${post.slug}`}
                          className="transition hover:underline hover:decoration-neutral-950 hover:underline-offset-4"
                        >
                          {post.title}
                        </a>
                      </h3>

                      <p className="mt-4 line-clamp-3 text-sm leading-7 text-neutral-600 sm:text-[15px]">
                        {post.excerpt}
                      </p>

                      <a
                        href={`/blog/${post.slug}`}
                        className="mt-auto inline-flex w-fit items-center gap-2 pt-6 text-sm font-bold text-neutral-950"
                      >
                        Read Article
                        <ArrowRight
                          size={16}
                          className="transition group-hover:translate-x-1"
                        />
                      </a>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-[28px] border border-dashed border-neutral-300 bg-neutral-50 px-6 py-14 text-center md:col-span-2">
                  <h3 className="text-2xl font-bold tracking-[-0.04em]">
                    No blogs found
                  </h3>
                  <p className="mt-2 text-sm text-neutral-600">
                    Add posts in WordPress admin or try another search keyword.
                  </p>
                </div>
              )}
            </div>

            <aside className="grid gap-6 self-start lg:sticky lg:top-24">
              <div className="rounded-[28px] border border-neutral-200 bg-neutral-50 p-6">
                <h3 className="mb-5 text-2xl font-bold tracking-[-0.04em] text-neutral-950">
                  Categories
                </h3>

                <div className="grid gap-3">
                  {categories.map((category) => {
                    const isActive = activeCategory === category.name;

                    return (
                      <button
                        key={category.id || category.slug || category.name}
                        type="button"
                        onClick={() => setActiveCategory(category.name)}
                        className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-full border px-4 text-left text-sm font-semibold transition ${
                          isActive
                            ? "border-neutral-950 bg-neutral-950 text-white"
                            : "border-neutral-200 bg-white text-neutral-800 hover:border-neutral-950 hover:bg-neutral-950 hover:text-white"
                        }`}
                      >
                        <span>{category.name}</span>
                        <ArrowRight size={15} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex aspect-square min-h-[340px] flex-col justify-end overflow-hidden rounded-[30px] bg-neutral-950 p-7 text-white">
                <div className="mb-4 w-fit rounded-full bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-neutral-950">
                  New Drop
                </div>

                <h3 className="max-w-[280px] text-3xl font-bold leading-none tracking-[-0.055em] text-white sm:text-[34px]">
                  Upgrade Your Everyday Style
                </h3>

                <p className="mt-4 max-w-[290px] text-sm leading-7 text-white/70">
                  Discover premium t-shirts, oversized fits, and fashion
                  essentials made for modern streetwear.
                </p>

                <a
                  href="/products"
                  className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-neutral-950 transition hover:-translate-y-0.5 hover:bg-neutral-200"
                >
                  Shop Now
                  <ArrowRight size={17} />
                </a>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
