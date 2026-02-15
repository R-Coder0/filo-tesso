const axios = require("axios");


const getShiprocketToken = async () => {
  const { data } = await axios.post("https://apiv2.shiprocket.in/v1/external/auth/login", {
    email: process.env.SHIPROCKET_EMAIL,
    password: process.env.SHIPROCKET_PASSWORD,
  });
  console.log("✅ Shiprocket token received:", data.token);
  return data.token;
};

// 2. Create Order via /orders/create (standard endpoint)
const createShiprocketOrder = async (order) => {
  try {
    const token = await getShiprocketToken();

    const payload = {
      order_id: order._id.toString(),
      order_date: new Date(order.createdAt).toISOString().split("T")[0],
      pickup_location: "warehouse", // ✅ Confirmed verified and active
      channel_id: "", // Optional - keep empty unless you're selling via marketplace
      comment: "Auto order from backend",
      billing_customer_name: order.address.name,
      billing_last_name: "",
      billing_address: order.address.street,
      billing_city: order.address.city,
      billing_pincode: order.address.postalCode,
      billing_state: order.address.state,
      billing_country: "India",
      billing_email: order.address.email || "test@example.com",
      billing_phone: order.address.phone || "9999999999",

      shipping_is_billing: true, // We use same address for shipping
      order_items: order.products.map((item) => ({
        name: item.product?.name || "Product",
        sku: item.product?.sku || "SKU001",
        units: item.quantity,
        selling_price: item.product?.price || 0,
      })),

      payment_method: order.paymentStatus === "Paid" ? "Prepaid" : "COD",
      sub_total: order.totalAmount,
      length: 10,
      breadth: 10,
      height: 10,
      weight: 1,
    };

    const response = await axios.post(
      "https://apiv2.shiprocket.in/v1/external/orders/create",
      payload,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log("✅ Shiprocket Standard Order Created:", response.data);
    return response.data;

  } catch (error) {
    console.error("❌ Shiprocket Order Error:");
    console.error(error.response?.data || error.message);
    throw new Error("Shiprocket API failed");
  }
};

module.exports = { createShiprocketOrder };
