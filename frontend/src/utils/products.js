export const extractProducts = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.products)) return payload.products;
  if (Array.isArray(payload?.data?.products)) return payload.data.products;
  return [];
};

export const resolveImageSrc = (apiUrl, image, fallback = "/placeholder.png") => {
  if (!image) return fallback;
  if (/^(https?:)?\/\//i.test(image) || /^(data|blob):/i.test(image)) return image;
  const baseUrl = String(apiUrl || "").replace(/\/$/, "");
  const imagePath = String(image).startsWith("/") ? image : `/${image}`;
  return `${baseUrl}${imagePath}`;
};

export const getProductCardImageSources = (
  product,
  apiUrl,
  fallback = "/placeholder.png"
) => {
  const mainSrc = resolveImageSrc(apiUrl, product?.image, fallback);
  const firstGalleryImage = Array.isArray(product?.gallery)
    ? product.gallery.find(Boolean)
    : null;
  const hoverSrc = firstGalleryImage
    ? resolveImageSrc(apiUrl, firstGalleryImage, fallback)
    : null;

  return {
    mainSrc,
    hoverSrc: hoverSrc && hoverSrc !== mainSrc ? hoverSrc : null,
  };
};

export const getProductIdentifier = (product) =>
  product?.slug || product?.handle || product?._id || product?.productId || product?.id;

export const getProductPath = (product) =>
  `/product/${encodeURIComponent(getProductIdentifier(product) || "")}`;
