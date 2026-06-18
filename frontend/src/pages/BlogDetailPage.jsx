import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock3,
  Facebook,
  Instagram,
  Link as LinkIcon,
  Tag,
  UserRound,
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

function normalizePost(post) {
  const category = getCategory(post);

  return {
    id: post.id,
    title: stripHtml(post?.title?.rendered),
    slug: post.slug,
    excerpt: stripHtml(post?.excerpt?.rendered),
    content: post?.content?.rendered || "",
    date: formatDate(post.date),
    modifiedDate: formatDate(post.modified),
    rawDate: post.date,
    rawModifiedDate: post.modified,
    readTime: getReadTime(post?.content?.rendered),
    image: getFeaturedImage(post),
    imageAlt: getFeaturedImageAlt(post),
    category,
    author: getAuthor(post),
  };
}

export default function BlogDetailPage() {
  const { slug } = useParams();

  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchBlogDetail() {
      try {
        setIsLoading(true);
        setErrorText("");
        setPost(null);
        setRelatedPosts([]);

        const postRes = await fetch(
          `${WP_API_BASE}/posts?slug=${encodeURIComponent(slug)}&_embed`
        );

        if (!postRes.ok) {
          throw new Error("WordPress single post API failed");
        }

        const postData = await postRes.json();

        if (!isMounted) return;

        if (!postData || postData.length === 0) {
          setErrorText("Blog not found.");
          return;
        }

        const currentPost = normalizePost(postData[0]);
        setPost(currentPost);

        if (currentPost.category.id) {
          const relatedRes = await fetch(
            `${WP_API_BASE}/posts?_embed&per_page=3&categories=${currentPost.category.id}&exclude=${currentPost.id}`
          );

          if (relatedRes.ok) {
            const relatedData = await relatedRes.json();

            if (isMounted) {
              setRelatedPosts(relatedData.map(normalizePost));
            }
          }
        }
      } catch (error) {
        if (!isMounted) return;

        console.error("Blog Detail API Error:", error);
        setErrorText("Unable to load this blog from WordPress CMS.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchBlogDetail();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const articleSchema = useMemo(() => {
    if (!post) return null;

    return {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.excerpt,
      image: post.image,
      author: {
        "@type": "Organization",
        name: "Filo Teso",
      },
      publisher: {
        "@type": "Organization",
        name: "Filo Teso",
      },
      datePublished: post.rawDate,
      dateModified: post.rawModifiedDate,
      mainEntityOfPage: `https://filoteso.co.in/blog/${post.slug}`,
    };
  }, [post]);

  const canonicalUrl = post
    ? `https://filoteso.co.in/blog/${post.slug}`
    : `https://filoteso.co.in/blog/${slug}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch (error) {
      console.error("Copy link failed:", error);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-white px-4 py-24 text-neutral-950">
        <div className="mx-auto max-w-4xl rounded-[28px] border border-neutral-200 bg-neutral-50 px-6 py-16 text-center">
          <h1 className="text-3xl font-bold tracking-[-0.04em]">
            Loading blog...
          </h1>
          <p className="mt-3 text-sm text-neutral-600">
            Fetching article from WordPress CMS.
          </p>
        </div>
      </main>
    );
  }

  if (errorText || !post) {
    return (
      <main className="min-h-screen bg-white px-4 py-24 text-neutral-950">
        <div className="mx-auto max-w-4xl rounded-[28px] border border-neutral-200 bg-neutral-50 px-6 py-16 text-center">
          <h1 className="text-3xl font-bold tracking-[-0.04em]">
            {errorText || "Blog not found"}
          </h1>
          <p className="mt-3 text-sm text-neutral-600">
            Please check the blog URL or publish the post in WordPress.
          </p>

          <a
            href="/blog"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-neutral-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-neutral-800"
          >
            <ArrowLeft size={17} />
            Back to Blogs
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-neutral-950">
      <ClientHelmet>
        <title>{post.title} | Filo Teso Blog</title>
        <meta name="description" content={post.excerpt} />
        <meta
          name="keywords"
          content={`${post.title}, filo teso blog, streetwear fashion, modern streetwear fashion, premium streetwear brand india`}
        />
        <meta property="og:title" content={`${post.title} | Filo Teso Blog`} />
        <meta property="og:description" content={post.excerpt} />
        <meta property="og:image" content={post.image} />
        <meta property="og:url" content={canonicalUrl} />
        <link rel="canonical" href={canonicalUrl} />
      </ClientHelmet>

      {articleSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(articleSchema),
          }}
        />
      )}

      {/* Hero */}
      <section className="relative overflow-hidden bg-neutral-950">
        <div className="absolute inset-0">
          <img
            src={post.image}
            alt={post.imageAlt}
            className="h-full w-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/40" />
        </div>

        <div className="relative z-10 mx-auto w-[min(100%-32px,1180px)] py-20 sm:py-24 lg:py-28">
          <a
            href="/blog"
            className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-white/80 transition hover:text-white"
          >
            <ArrowLeft size={17} />
            Back to Blogs
          </a>

          <div className="max-w-4xl">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-neutral-950">
                <Tag size={14} />
                {post.category.name}
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white backdrop-blur">
                <CalendarDays size={14} />
                {post.date}
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white backdrop-blur">
                <Clock3 size={14} />
                {post.readTime}
              </span>
            </div>

            <h1 className="text-[42px] font-bold leading-[1.02] tracking-[-0.06em] text-white sm:text-6xl lg:text-5xl">
              {post.title}
            </h1>

            {/* {post.excerpt && (
              <p className="mt-6 max-w-3xl text-base leading-8 text-white/75 sm:text-lg">
                {post.excerpt}
              </p>
            )} */}

            <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-white/75">
              <span className="inline-flex items-center gap-2">
                <UserRound size={17} />
                By {post.author}
              </span>

              <span className="hidden h-1 w-1 rounded-full bg-white/40 sm:block" />

              <span>Updated {post.modifiedDate}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-14 sm:py-16 lg:py-20">
        <div className="mx-auto grid w-[min(100%-32px,1180px)] gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <article className="min-w-0">
            <div className="mb-8 overflow-hidden rounded-[30px] border border-neutral-200 bg-neutral-100">
              <img
                src={post.image}
                alt={post.imageAlt}
                className="h-auto w-full object-cover"
              />
            </div>

            <div
              className="
                blog-content
                text-[17px] leading-8 text-neutral-700
                [&_a]:font-bold [&_a]:text-neutral-950 [&_a]:underline [&_a]:underline-offset-4
                [&_blockquote]:my-8 [&_blockquote]:border-l-4 [&_blockquote]:border-neutral-950 [&_blockquote]:bg-neutral-50 [&_blockquote]:px-6 [&_blockquote]:py-4 [&_blockquote]:text-xl [&_blockquote]:font-semibold [&_blockquote]:leading-8 [&_blockquote]:text-neutral-950
                [&_figure]:my-8
                [&_h1]:mb-5 [&_h1]:mt-10 [&_h1]:text-4xl [&_h1]:font-bold [&_h1]:leading-tight [&_h1]:tracking-[-0.04em] [&_h1]:text-neutral-950
                [&_h2]:mb-4 [&_h2]:mt-10 [&_h2]:text-3xl [&_h2]:font-bold [&_h2]:leading-tight [&_h2]:tracking-[-0.04em] [&_h2]:text-neutral-950
                [&_h3]:mb-3 [&_h3]:mt-8 [&_h3]:text-2xl [&_h3]:font-bold [&_h3]:leading-tight [&_h3]:tracking-[-0.035em] [&_h3]:text-neutral-950
                [&_img]:my-8 [&_img]:w-full [&_img]:rounded-[24px]
                [&_li]:mb-2
                [&_ol]:my-5 [&_ol]:list-decimal [&_ol]:pl-6
                [&_p]:mb-6
                [&_strong]:font-bold [&_strong]:text-neutral-950
                [&_ul]:my-5 [&_ul]:list-disc [&_ul]:pl-6
              "
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </article>

          {/* Sidebar */}
          <aside className="grid gap-6 lg:sticky lg:top-24">
            <div className="rounded-[28px] border border-neutral-200 bg-neutral-50 p-6">
              <h3 className="text-2xl font-bold tracking-[-0.04em]">
                Article Info
              </h3>

              <div className="mt-5 grid gap-4 text-sm text-neutral-700">
                <div className="flex items-center justify-between gap-4 border-b border-neutral-200 pb-4">
                  <span>Category</span>
                  <strong className="text-right text-neutral-950">
                    {post.category.name}
                  </strong>
                </div>

                <div className="flex items-center justify-between gap-4 border-b border-neutral-200 pb-4">
                  <span>Published</span>
                  <strong className="text-right text-neutral-950">
                    {post.date}
                  </strong>
                </div>

                <div className="flex items-center justify-between gap-4 border-b border-neutral-200 pb-4">
                  <span>Read Time</span>
                  <strong className="text-right text-neutral-950">
                    {post.readTime}
                  </strong>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span>Author</span>
                  <strong className="text-right text-neutral-950">
                    {post.author}
                  </strong>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-neutral-200 bg-white p-6">
              <h3 className="text-2xl font-bold tracking-[-0.04em]">
                Share Article
              </h3>

              <div className="mt-5 grid gap-3">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex min-h-12 items-center justify-between rounded-full border border-neutral-200 bg-neutral-50 px-4 text-sm font-bold text-neutral-950 transition hover:border-neutral-950 hover:bg-neutral-950 hover:text-white"
                >
                  Copy Link
                  <LinkIcon size={17} />
                </button>

                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                    window.location.href
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-12 items-center justify-between rounded-full border border-neutral-200 bg-neutral-50 px-4 text-sm font-bold text-neutral-950 transition hover:border-neutral-950 hover:bg-neutral-950 hover:text-white"
                >
                  Share on Facebook
                  <Facebook size={17} />
                </a>

                <a
                  href="https://www.instagram.com/filoteso.co.in/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-12 items-center justify-between rounded-full border border-neutral-200 bg-neutral-50 px-4 text-sm font-bold text-neutral-950 transition hover:border-neutral-950 hover:bg-neutral-950 hover:text-white"
                >
                  Instagram
                  <Instagram size={17} />
                </a>
              </div>
            </div>

            <div className="flex aspect-square min-h-[320px] flex-col justify-end overflow-hidden rounded-[30px] bg-neutral-950 p-7 text-white">
              <div className="mb-4 w-fit rounded-full bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-neutral-950">
                Filo Teso
              </div>

              <h3 className="max-w-[280px] text-3xl font-bold leading-none tracking-[-0.055em]">
                Discover Premium Streetwear
              </h3>

              <p className="mt-4 max-w-[290px] text-sm leading-7 text-white/70">
                Explore oversized fits, graphic tees, and everyday fashion
                essentials crafted for comfort and confidence.
              </p>

              <a
                href="/products"
                className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-neutral-950 transition hover:-translate-y-0.5 hover:bg-neutral-200"
              >
                Shop Collection
                <ArrowRight size={17} />
              </a>
            </div>
          </aside>
        </div>
      </section>

      {/* Related Blogs */}
      {relatedPosts.length > 0 && (
        <section className="border-t border-neutral-200 bg-neutral-50 py-16 sm:py-20">
          <div className="mx-auto w-[min(100%-32px,1180px)]">
            <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                  More from Journal
                </p>
                <h2 className="text-3xl font-bold tracking-[-0.045em] sm:text-5xl">
                  Related Blogs
                </h2>
              </div>

              <a
                href="/blog"
                className="inline-flex w-fit items-center gap-2 text-sm font-bold text-neutral-950"
              >
                View All
                <ArrowRight size={17} />
              </a>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {relatedPosts.map((relatedPost) => (
                <article
                  key={relatedPost.id}
                  className="group overflow-hidden rounded-[28px] border border-neutral-200 bg-white transition hover:-translate-y-1 hover:border-neutral-950 hover:shadow-[0_20px_60px_rgba(0,0,0,0.08)]"
                >
                  <a
                    href={`/blog/${relatedPost.slug}`}
                    className="block h-56 overflow-hidden bg-neutral-100"
                  >
                    <img
                      src={relatedPost.image}
                      alt={relatedPost.imageAlt}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </a>

                  <div className="p-5">
                    <div className="mb-3 flex items-center gap-2 text-xs text-neutral-500">
                      <Tag size={13} />
                      {relatedPost.category.name}
                    </div>

                    <h3 className="text-xl font-bold leading-tight tracking-[-0.035em]">
                      <a
                        href={`/blog/${relatedPost.slug}`}
                        className="hover:underline hover:underline-offset-4"
                      >
                        {relatedPost.title}
                      </a>
                    </h3>

                    <a
                      href={`/blog/${relatedPost.slug}`}
                      className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-neutral-950"
                    >
                      Read Article
                      <ArrowRight size={16} />
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
