import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Images,
  Instagram,
  Pause,
  Play,
} from "lucide-react";
import { useSsrData } from "../context/SsrDataContext";

const INSTAGRAM_USERNAME = "filoteso.co.in";
const INSTAGRAM_PROFILE_URL = `https://www.instagram.com/${INSTAGRAM_USERNAME}/`;

let hasWarnedAboutLocalhostApi = false;

const getApiUrl = () => {
  const apiUrl = String(import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

  if (
    import.meta.env.PROD &&
    /localhost|127\.0\.0\.1/.test(apiUrl) &&
    !hasWarnedAboutLocalhostApi
  ) {
    console.error(
      "VITE_API_URL points to localhost in production. Set it to your deployed backend domain."
    );
    hasWarnedAboutLocalhostApi = true;
  }

  return apiUrl;
};

const getPostLabel = (post) => {
  if (post.mediaType === "VIDEO") return "Reel";
  if (post.mediaType === "CAROUSEL_ALBUM") return "Carousel";
  return "Post";
};

const getPostTitle = (post, index) =>
  post.caption?.split("\n").find(Boolean)?.trim().slice(0, 100) ||
  `Filo Teso Instagram ${getPostLabel(post).toLowerCase()} ${index + 1}`;

function ReelMedia({ post, title }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlayback = async () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      try {
        await video.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  return (
    <>
      <video
        ref={videoRef}
        src={post.mediaUrl}
        poster={post.thumbnailUrl || undefined}
        muted
        loop
        playsInline
        preload="metadata"
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        className="h-full w-full bg-black object-cover transition duration-700 group-hover:scale-[1.035]"
        aria-label={title}
      />
      <button
        type="button"
        onClick={togglePlayback}
        aria-label={isPlaying ? `Pause ${title}` : `Play ${title}`}
        className={`absolute left-1/2 top-1/2 z-20 inline-flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/50 bg-black/35 text-white shadow-xl backdrop-blur-md transition duration-300 hover:scale-105 hover:bg-black/60 ${
          isPlaying
            ? "h-11 w-11 opacity-0 group-hover:opacity-100"
            : "h-16 w-16 opacity-100"
        }`}
      >
        {isPlaying ? (
          <Pause size={18} fill="currentColor" aria-hidden="true" />
        ) : (
          <Play
            size={25}
            fill="currentColor"
            className="ml-1"
            aria-hidden="true"
          />
        )}
      </button>
    </>
  );
}

function InstagramMedia({ post, index }) {
  const title = getPostTitle(post, index);

  if (post.mediaType === "VIDEO" && post.mediaUrl) {
    return <ReelMedia post={post} title={title} />;
  }

  const imageUrl = post.mediaUrl || post.thumbnailUrl;

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={title}
        loading="lazy"
        className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.035]"
      />
    );
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-neutral-900 px-6 text-center text-white">
      <Instagram size={38} aria-hidden="true" />
      <span className="text-xs font-semibold uppercase tracking-[0.2em]">
        View on Instagram
      </span>
    </div>
  );
}

export default function InstagramCarousel() {
  const ssrFeed = useSsrData("homeInstagramFeed");
  const initialPosts = Array.isArray(ssrFeed?.posts) ? ssrFeed.posts : [];
  const [posts, setPosts] = useState(initialPosts);
  const [username, setUsername] = useState(
    ssrFeed?.username || INSTAGRAM_USERNAME
  );
  const [feedStatus, setFeedStatus] = useState(
    initialPosts.length ? "ready" : "loading"
  );
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const carouselRef = useRef(null);
  const hasPosts = posts.length > 0;
  const isFeedLoading = feedStatus === "loading";

  useEffect(() => {
    const controller = new AbortController();

    const loadInstagramFeed = async () => {
      const endpoint = `${getApiUrl()}/api/instagram/posts`;

      try {
        setFeedStatus((currentStatus) =>
          currentStatus === "ready" ? currentStatus : "loading"
        );

        const response = await fetch(endpoint, {
          signal: controller.signal,
        });
        const data = await response.json().catch(() => null);

        if (!response.ok) {
          const message =
            data?.message ||
            `Instagram feed API failed with status ${response.status}`;

          console.error("Instagram feed API failed:", {
            endpoint,
            status: response.status,
            statusText: response.statusText,
            message,
            body: data,
          });

          setPosts([]);
          setFeedStatus("error");
          return;
        }

        if (Array.isArray(data?.posts) && data.posts.length) {
          setPosts(data.posts);
          setUsername(data.username || INSTAGRAM_USERNAME);
          setFeedStatus("ready");
          return;
        }

        console.warn("Instagram feed API returned no posts:", {
          endpoint,
          body: data,
        });

        setPosts([]);
        setFeedStatus("empty");
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Instagram feed request failed:", {
            endpoint,
            message: error.message,
          });
          setPosts([]);
          setFeedStatus("error");
        }
      }
    };

    loadInstagramFeed();
    return () => controller.abort();
  }, []);

  const updateScrollState = useCallback(() => {
    const carousel = carouselRef.current;
    if (!carousel || !hasPosts) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }

    const maxScrollLeft = carousel.scrollWidth - carousel.clientWidth;
    setCanScrollLeft(carousel.scrollLeft > 8);
    setCanScrollRight(carousel.scrollLeft < maxScrollLeft - 8);
  }, [hasPosts]);

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return undefined;

    updateScrollState();
    carousel.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      carousel.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [posts, updateScrollState]);

  const moveCarousel = useCallback((direction) => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const card = carousel.querySelector("[data-instagram-card]");
    const cardWidth = card?.getBoundingClientRect().width || carousel.clientWidth;

    carousel.scrollBy({
      left: direction * (cardWidth + 16),
      behavior: "smooth",
    });
  }, []);

  return (
    <section
      className="overflow-hidden border-y border-black/10 bg-[#eee9df] py-14 sm:py-16 lg:py-20"
      aria-labelledby="instagram-heading"
    >
      <div className="mx-auto max-w-[1700px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-7 border-b border-black/15 pb-8 lg:flex-row lg:items-end lg:justify-between lg:pb-10">
          <div className="max-w-3xl">
            <a
              href={INSTAGRAM_PROFILE_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-gray-600 transition hover:text-black"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black text-white">
                <Instagram size={16} aria-hidden="true" />
              </span>
              @{username}
            </a>

            <h2
              id="instagram-heading"
              className="mt-5 text-4xl font-black uppercase leading-[0.95] tracking-tight text-gray-950 sm:text-5xl lg:text-6xl"
            >
              Fresh From
              <span className="block font-serif italic normal-case text-[#ef6a4d]">
                the feed.
              </span>
            </h2>

            <p className="mt-5 max-w-xl text-sm font-medium leading-6 text-gray-600 sm:text-base">
              New drops, real fits, and everything happening behind the scenes
              at Filo Teso.
            </p>
          </div>

          <div className="flex w-full items-center justify-between gap-3 lg:w-auto lg:justify-start">
            <a
              href={INSTAGRAM_PROFILE_URL}
              target="_blank"
              rel="noreferrer"
              className="group inline-flex min-h-11 items-center justify-center gap-2.5 bg-black px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#ef6a4d] sm:min-h-12 sm:gap-3 sm:px-6"
            >
              <span className="sm:hidden">Follow</span>
              <span className="hidden sm:inline">Follow On Instagram</span>
              <ArrowUpRight
                size={17}
                className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                aria-hidden="true"
              />
            </a>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => moveCarousel(-1)}
                disabled={!hasPosts || !canScrollLeft}
                aria-label="Show previous Instagram posts"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/25 text-black transition hover:border-black hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-black sm:h-12 sm:w-12"
              >
                <ChevronLeft size={21} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => moveCarousel(1)}
                disabled={!hasPosts || !canScrollRight}
                aria-label="Show next Instagram posts"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/25 text-black transition hover:border-black hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-black sm:h-12 sm:w-12"
              >
                <ChevronRight size={21} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {hasPosts ? (
          <div
            ref={carouselRef}
            className="hide-scrollbar -mr-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pr-4 sm:-mr-6 sm:mt-10 sm:pr-6 lg:-mr-8 lg:pr-8"
          >
            {posts.map((post, index) => {
              const title = getPostTitle(post, index);

              return (
                <article
                  key={post.id}
                  data-instagram-card
                  className="group relative aspect-[4/5] w-[78vw] max-w-[330px] shrink-0 snap-start overflow-hidden bg-neutral-900 sm:w-[310px] lg:w-[330px]"
                >
                  <InstagramMedia post={post} index={index} />

                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/5 to-black/20" />

                  <div className="pointer-events-none absolute left-3 top-3 z-20 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-black/35 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-md">
                    {post.mediaType === "CAROUSEL_ALBUM" ? (
                      <Images size={13} aria-hidden="true" />
                    ) : post.mediaType === "VIDEO" ? (
                      <Play size={13} fill="currentColor" aria-hidden="true" />
                    ) : (
                      <Instagram size={13} aria-hidden="true" />
                    )}
                    {getPostLabel(post)}
                  </div>

                  <div className="absolute inset-x-0 bottom-0 z-20 p-4 sm:p-5">
                    <p className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-white">
                      {title}
                    </p>
                    <a
                      href={post.permalink || INSTAGRAM_PROFILE_URL}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Open ${title} on Instagram`}
                      className="mt-4 inline-flex items-center gap-2 border-b border-white/60 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white transition hover:border-[#ef6a4d] hover:text-[#ef6a4d]"
                    >
                      View Post
                      <ArrowUpRight size={14} aria-hidden="true" />
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-8 flex min-h-[280px] flex-col items-center justify-center border border-dashed border-black/20 bg-white/45 px-5 py-12 text-center sm:mt-10">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-black text-white">
              <Instagram size={24} aria-hidden="true" />
            </span>
            <h3 className="mt-5 text-2xl font-black uppercase tracking-tight text-gray-950">
              Follow us on Instagram for latest drops
            </h3>
            <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-gray-600 sm:text-base">
              {isFeedLoading
                ? "Loading the latest Instagram posts..."
                : "The live feed could not be loaded here right now. Tap through to see the newest Filo Teso posts on Instagram."}
            </p>
            <a
              href={INSTAGRAM_PROFILE_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 bg-black px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#ef6a4d]"
            >
              Open Instagram
              <ArrowUpRight size={16} aria-hidden="true" />
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
