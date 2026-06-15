const express = require("express");
const { getInstagramFeed } = require("../services/instagramService");

const router = express.Router();

router.get("/posts", async (req, res) => {
  try {
    const feed = await getInstagramFeed();

    res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=900");
    res.json(feed);
  } catch (error) {
    const status =
      error.code === "INSTAGRAM_NOT_CONFIGURED"
        ? 503
        : error.status >= 400 && error.status < 600
          ? error.status
          : 502;

    console.error("GET /api/instagram/posts error:", error.message);
    res.status(status).json({
      message:
        status === 503
          ? "Instagram feed is not configured"
          : "Instagram feed could not be loaded",
    });
  }
});

module.exports = router;
