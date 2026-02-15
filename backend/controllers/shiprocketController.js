const axios = require("axios");
const { getShiprocketToken } = require("../utils/shiprocket");

exports.createShipment = async (req, res) => {
  try {
    const token = await getShiprocketToken();

    const orderData = {
      order_id: "ORDER1234",
      order_date: "2025-06-17",
      pickup_location: "warehouse", // ✅ Must match Shiprocket verified name
      channel_id: "", // Optional unless using marketplace integration
      comment: "Test order via API",
      
      billing_customer_name: "John",
      billing_last_name: "Doe",
      billing_address: "123 Main Street",
      billing_city: "New Delhi",
      billing_pincode: "110001",
      billing_state: "Delhi",
      billing_country: "India",
      billing_email: "john@example.com",
      billing_phone: "9999999999",

      shipping_is_billing: true, // use billing address as shipping

      order_items: [
        {
          name: "Product 1",
          sku: "SKU123",
          units: 1,
          selling_price: 500,
        },
      ],

      payment_method: "COD", // or "Prepaid"
      sub_total: 500,

      // Recommended dimensions (required by many couriers)
      length: 10,
      breadth: 10,
      height: 10,
      weight: 1,
    };

    const response = await axios.post(
      "https://apiv2.shiprocket.in/v1/external/orders/create",
      orderData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("✅ Shiprocket Shipment Created:", response.data);
    res.status(200).json(response.data);

  } catch (err) {
    console.error("❌ Shiprocket Order Error:", err.response?.data || err.message);
    res.status(500).json({ message: "Failed to create shipment", error: err.response?.data || err.message });
  }
};
