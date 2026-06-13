const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const { backfillOrderNumbers } = require("./utils/orderNumber");
const cron = require('node-cron');
const { creditPendingCoins } = require('./controllers/orderController');
require("dotenv").config();

const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const adminRoutes = require("./routes/adminRoutes");
const userRoutes = require("./routes/userRoutes");
const shiprocketRoutes = require("./routes/shiprocketRoutes");
const reviewRoutes = require("./routes/reveiwRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const testimonialRoutes = require("./routes/testimonialroutes")
// ✅ NEW LINE: Wishlist route import
const wishlistRoutes = require("./routes/wishlistRoutes");
const path = require("path");

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://filoteso.co.in",
  "https://www.filoteso.co.in",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn("❌ CORS blocked origin:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT","PATCH", "DELETE", "OPTIONS"],
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
console.log('🕒 Setting up daily coin credit cron job...');
cron.schedule('0 0 * * *', async () => {
  console.log('🔄 Running daily coin credit check...');
  try {
    const creditedCount = await creditPendingCoins();
    if (creditedCount > 0) {
      console.log(`✅ ${creditedCount} orders processed for coin credit`);
    } else {
      console.log('ℹ️ No pending coins to credit today');
    }
  } catch (error) {
    console.error('❌ Cron job failed:', error);
  }
});

app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/shiprocket", shiprocketRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/payment", paymentRoutes);

// ✅ NEW LINE: Wishlist route mount
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/testimonials", testimonialRoutes);


app.get("/", (req, res) => {
  res.send("E-commerce Backend Running with Shiprocket 🚀 + Coin System + Wishlist ❤️");
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  const backfilledOrders = await backfillOrderNumbers();
  if (backfilledOrders > 0) {
    console.log(`Assigned public order numbers to ${backfilledOrders} existing orders`);
  }

  app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
};

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
