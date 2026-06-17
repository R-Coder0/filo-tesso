const express = require("express");
const {
  getInstagramConfigStatus,
  getInstagramFeed,
} = require("../services/instagramService");

const router = express.Router();

const getHttpStatus = (error) =>
  error.status >= 400 && error.status < 600 ? error.status : 502;

router.get("/posts", async (req, res) => {
  try {
    const feed = await getInstagramFeed();

    res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=900");
    res.json(feed);
  } catch (error) {
    const status = getHttpStatus(error);
    const metaError = error.response?.data || error.metaError || null;

    console.error("GET /api/instagram/posts error:", {
      message: error.message,
      code: error.code,
      status,
      safeUrl: error.safeUrl,
      missing: error.missing,
      config: getInstagramConfigStatus(),
      metaError,
    });

    res.status(status).json({
      message:
        error.publicMessage ||
        metaError?.message ||
        "Instagram feed could not be loaded",
      code: error.code || "INSTAGRAM_FEED_ERROR",
      missing: error.missing,
      metaStatus: error.metaStatus,
      metaError,
      config: getInstagramConfigStatus(),
    });
  }
});

module.exports = router;
