import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Images,
  Instagram,
  Play,
} from "lucide-react";
import { useSsrData } from "../context/SsrDataContext";

const INSTAGRAM_USERNAME = "filoteso.co.in";
const INSTAGRAM_PROFILE_URL = `https://www.instagram.com/${INSTAGRAM_USERNAME}/`;

// These official embeds are shown only until the Meta API token is configured.
const FALLBACK_POSTS = [
  { id: "DZjpPy5Cbqm", type: "reel", title: "Behind the scenes at Filo Teso" },
  { id: "DZg9NGngRrU", type: "p", title: "Filo Teso latest look" },
  { id: "DZefPb1TK1G", type: "p", title: "The Cool Edition" },
  { id: "DZaLV7DDi_z", type: "reel", title: "Filo Teso summer styles" },
  { id: "DZUOsb9n7cX", type: "p", title: "Filo Teso summer drop" },
  { id: "DZIFxLAk6uk", type: "p", title: "Filo Teso minimal essential" },
].map((post) => ({
  ...post,
  mediaType: "EMBED",
  permalink: `https://www.instagram.com/${post.type}/${post.id}/`,
  embedUrl: `https://www.instagram.com/${post.type}/${post.id}/embed/`,
}));

const getApiUrl = () =>
  String(import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

const getPostLabel = (post) => {
  if (post.mediaType === "VIDEO") return "Reel";
  if (post.mediaType === "CAROUSEL_ALBUM") return "Carousel";
  return "Post";
};

const getPostTitle = (post, index) =>
  post.caption?.split("\n").find(Boolean)?.slice(0, 90) ||
  post.title ||
  `Filo Teso Instagram ${getPostLabel(post).toLowerCase()} ${index + 1}`;

function InstagramMedia({ post, index }) {
  const title = getPostTitle(post, index);

  if (post.mediaType === "EMBED") {
    return (
      <iframe
        src={post.embedUrl}
        title={title}
        loading="lazy"
        scrolling="no"
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
        allowFullScreen
        className="h-full w-full border-0 bg-white"
      />
    );
  }

  if (post.mediaType === "VIDEO" && post.mediaUrl) {
    return (
      <video
        src={post.mediaUrl}
        poster={post.thumbnailUrl || undefined}
        controls
        muted
        playsInline
        preload="none"
        className="h-full w-full bg-black object-cover"
        aria-label={title}
      />
    );
  }

  const imageUrl = post.mediaUrl || post.thumbnailUrl;

  if (imageUrl) {
    return (
      <a
        href={post.permalink || INSTAGRAM_PROFILE_URL}
        target="_blank"
        rel="noreferrer"
        aria-label={`Open ${title} on Instagram`}
        className="block h-full w-full"
      >
        <img
          src={imageUrl}
          alt={title}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 hover:scale-[1.025]"
        />
      </a>
    );
  }

  if (post.permalink) {
    return (
      <iframe
        src={`${post.permalink.replace(/\/+$/, "")}/embed/`}
        title={title}
        loading="lazy"
        scrolling="no"
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
        allowFullScreen
        className="h-full w-full border-0 bg-white"
      />
    );
  }

  return (
    <a
      href={post.permalink || INSTAGRAM_PROFILE_URL}
      target="_blank"
      rel="noreferrer"
      className="flex h-full w-full flex-col items-center justify-center gap-3 bg-neutral-950 px-6 text-center text-white"
    >
      <Play size={38} aria-hidden="true" />
      <span className="text-sm font-semibold uppercase tracking-wide">
        Watch on Instagram
      </span>
    </a>
  );
}

export default function InstagramCarousel() {
  const ssrFeed = useSsrData("homeInstagramFeed");
  const initialPosts = Array.isArray(ssrFeed?.posts) ? ssrFeed.posts : [];
  const [posts, setPosts] = useState(
    initialPosts.length ? initialPosts : FALLBACK_POSTS
  );
  const [username, setUsername] = useState(
    ssrFeed?.username || INSTAGRAM_USERNAME
  );
  const carouselRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadInstagramFeed = async () => {
      try {
        const response = await fetch(`${getApiUrl()}/api/instagram/posts`, {
          signal: controller.signal,
        });
        if (!response.ok) return;

        const data = await response.json();
        if (Array.isArray(data?.posts) && data.posts.length) {
          setPosts(data.posts);
          setUsername(data.username || INSTAGRAM_USERNAME);
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.warn("Instagram feed could not be loaded:", error.message);
        }
      }
    };

    loadInstagramFeed();
    return () => controller.abort();
  }, []);

  const moveCarousel = useCallback((direction) => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const card = carousel.querySelector("[data-instagram-card]");
    const cardWidth = card?.getBoundingClientRect().width || carousel.clientWidth;

    carousel.scrollBy({
      left: direction * (cardWidth + 20),
      behavior: "smooth",
    });
  }, []);

  return (
    <section
      className="overflow-hidden bg-[#f3f0e8] py-14 sm:py-16 lg:py-20"
      aria-labelledby="instagram-heading"
    >
      <div className="mx-auto max-w-[1700px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <a
              href={INSTAGRAM_PROFILE_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-gray-700 transition hover:text-black"
            >
              <Instagram size={18} aria-hidden="true" />
              @{username}
            </a>

            <h2
              id="instagram-heading"
              className="mt-4 text-3xl font-black uppercase tracking-tight text-gray-950 sm:text-4xl lg:text-5xl"
            >
              Seen On Instagram
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-6 text-gray-600 sm:text-base">
              New drops, styling inspiration, and behind-the-scenes moments
              straight from our Instagram.
            </p>
          </div>

          <div className="flex items-center justify-between gap-4 sm:justify-start">
            <a
              href={INSTAGRAM_PROFILE_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center justify-center gap-2 bg-black px-5 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-gray-800"
            >
              Follow Us
              <ArrowUpRight size={17} aria-hidden="true" />
            </a>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => moveCarousel(-1)}
                aria-label="Show previous Instagram posts"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/25 bg-transparent text-black transition hover:border-black hover:bg-black hover:text-white"
              >
                <ChevronLeft size={21} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => moveCarousel(1)}
                aria-label="Show next Instagram posts"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/25 bg-transparent text-black transition hover:border-black hover:bg-black hover:text-white"
              >
                <ChevronRight size={21} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        <div
          ref={carouselRef}
          className="hide-scrollbar mt-9 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-3"
        >
          {posts.map((post, index) => (
            <article
              key={post.id}
              data-instagram-card
              className="w-[84vw] max-w-[360px] shrink-0 snap-start overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.08)] sm:w-[340px] lg:w-[360px]"
            >
              <div className="relative aspect-[9/16] overflow-hidden bg-white">
                <InstagramMedia post={post} index={index} />

                {post.mediaType !== "EMBED" && (
                  <div className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/75 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white backdrop-blur">
                    {post.mediaType === "CAROUSEL_ALBUM" ? (
                      <Images size={14} aria-hidden="true" />
                    ) : post.mediaType === "VIDEO" ? (
                      <Play size={14} fill="currentColor" aria-hidden="true" />
                    ) : (
                      <Instagram size={14} aria-hidden="true" />
                    )}
                    {getPostLabel(post)}
                  </div>
                )}
              </div>

              {post.mediaType !== "EMBED" && (
                <a
                  href={post.permalink || INSTAGRAM_PROFILE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-16 items-center justify-between gap-4 px-4 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
                >
                  <span className="line-clamp-2">{getPostTitle(post, index)}</span>
                  <ArrowUpRight
                    size={18}
                    className="shrink-0"
                    aria-hidden="true"
                  />
                </a>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
