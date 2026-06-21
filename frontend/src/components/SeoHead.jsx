import { useEffect, useLayoutEffect } from "react";

const useSeoEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

const upsertMeta = (attribute, key, content) => {
  if (!content) return;

  const selector = `meta[${attribute}="${key}"]`;
  const matches = Array.from(document.head.querySelectorAll(selector));
  const element = matches.shift() || document.createElement("meta");

  element.setAttribute(attribute, key);
  element.setAttribute("content", String(content));
  element.setAttribute("data-seo-managed", "true");
  element.removeAttribute("data-rh");

  if (!element.parentNode) document.head.appendChild(element);
  matches.forEach((duplicate) => duplicate.remove());
};

const upsertCanonical = (canonical) => {
  if (!canonical) return;

  const matches = Array.from(
    document.head.querySelectorAll('link[rel="canonical"]')
  );
  const element = matches.shift() || document.createElement("link");

  element.setAttribute("rel", "canonical");
  element.setAttribute("href", canonical);
  element.setAttribute("data-seo-managed", "true");
  element.removeAttribute("data-rh");

  if (!element.parentNode) document.head.appendChild(element);
  matches.forEach((duplicate) => duplicate.remove());
};

const upsertTitle = (title) => {
  if (!title) return;

  const matches = Array.from(document.head.querySelectorAll("title"));
  const element = matches.shift() || document.createElement("title");

  element.textContent = title;
  element.setAttribute("data-seo-managed", "true");
  element.removeAttribute("data-rh");

  if (!element.parentNode) document.head.appendChild(element);
  matches.forEach((duplicate) => duplicate.remove());
};

export default function SeoHead({
  title,
  description,
  keywords,
  canonical,
  image,
  type = "website",
  robots,
  routeKey,
}) {
  useSeoEffect(() => {
    upsertTitle(title);
    upsertMeta("name", "title", title);
    upsertMeta("name", "description", description);
    upsertMeta("name", "keywords", keywords);
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:image", image);
    upsertMeta("property", "og:url", canonical);
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", image);
    upsertMeta("name", "robots", robots);
    upsertCanonical(canonical);
  }, [
    canonical,
    description,
    image,
    keywords,
    robots,
    routeKey,
    title,
    type,
  ]);

  return null;
}
