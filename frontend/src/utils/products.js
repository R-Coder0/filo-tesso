export const extractProducts = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.products)) return payload.products;
  if (Array.isArray(payload?.data?.products)) return payload.data.products;
  return [];
};

export const getProductIdentifier = (product) =>
  product?.slug || product?.handle || product?._id || product?.productId || product?.id;

export const getProductPath = (product) =>
  `/product/${encodeURIComponent(getProductIdentifier(product) || "")}`;
