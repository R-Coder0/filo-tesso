const { sendEmail } = require("./sendEmail");

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const formatDate = (value) =>
  new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(value ? new Date(value) : new Date());

const getOrderReference = (order) =>
  escapeHtml(order.orderNumber || String(order._id));

const getProductRows = (order) =>
  (order.products || [])
    .map((item) => {
      const product =
        item.product && typeof item.product === "object" ? item.product : {};
      const name = escapeHtml(item.name || product.name || "Product");
      const size = item.selectedSize
        ? `<div style="color:#6b7280;font-size:12px;margin-top:3px;">Size: ${escapeHtml(item.selectedSize)}</div>`
        : "";
      const quantity = Math.max(1, Number(item.quantity || 1));
      const unitPrice = Number(
        item.priceAtPurchase ?? product.price?.sale ?? 0
      );

      return `
        <tr>
          <td style="padding:14px 0;border-bottom:1px solid #e5e7eb;">
            <strong>${name}</strong>
            ${size}
          </td>
          <td style="padding:14px 8px;border-bottom:1px solid #e5e7eb;text-align:center;">${quantity}</td>
          <td style="padding:14px 0;border-bottom:1px solid #e5e7eb;text-align:right;">${formatCurrency(unitPrice * quantity)}</td>
        </tr>
      `;
    })
    .join("");

const getAddressHtml = (address = {}) => {
  const locality = [address.city, address.state, address.postalCode]
    .filter(Boolean)
    .join(", ");

  return [
    address.name,
    address.street,
    locality,
    address.country || "India",
    address.phone ? `Phone: ${address.phone}` : "",
  ]
    .filter(Boolean)
    .map((line) => `<div>${escapeHtml(line)}</div>`)
    .join("");
};

const getEmailShell = ({ title, intro, order, admin = false }) => {
  const reference = getOrderReference(order);
  const address = order.address || {};

  return `
    <!doctype html>
    <html>
      <body style="margin:0;background:#f4f4f5;font-family:Arial,sans-serif;color:#111827;">
        <div style="max-width:680px;margin:0 auto;padding:28px 14px;">
          <div style="background:#050505;color:#fff;padding:22px 28px;border-radius:14px 14px 0 0;">
            <div style="font-size:24px;font-weight:700;letter-spacing:1px;">FILOTESO</div>
            <div style="color:#d1d5db;font-size:13px;margin-top:4px;">Order ${reference}</div>
          </div>
          <div style="background:#fff;padding:28px;border-radius:0 0 14px 14px;">
            <h1 style="font-size:24px;margin:0 0 10px;">${escapeHtml(title)}</h1>
            <p style="color:#4b5563;line-height:1.6;margin:0 0 24px;">${escapeHtml(intro)}</p>

            <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin-bottom:22px;">
              <table style="width:100%;border-collapse:collapse;font-size:14px;">
                <tr><td style="padding:5px 0;color:#6b7280;">Order ID</td><td style="padding:5px 0;text-align:right;font-weight:700;">${reference}</td></tr>
                <tr><td style="padding:5px 0;color:#6b7280;">Placed on</td><td style="padding:5px 0;text-align:right;">${escapeHtml(formatDate(order.createdAt))}</td></tr>
                <tr><td style="padding:5px 0;color:#6b7280;">Payment</td><td style="padding:5px 0;text-align:right;">${escapeHtml(order.paymentMethod || "COD")} - ${escapeHtml(order.paymentStatus || "Pending")}</td></tr>
              </table>
            </div>

            <h2 style="font-size:17px;margin:0 0 8px;">Items</h2>
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <thead>
                <tr style="color:#6b7280;">
                  <th style="padding:8px 0;text-align:left;">Product</th>
                  <th style="padding:8px;text-align:center;">Qty</th>
                  <th style="padding:8px 0;text-align:right;">Amount</th>
                </tr>
              </thead>
              <tbody>${getProductRows(order)}</tbody>
            </table>

            <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:16px;">
              <tr><td style="padding:5px 0;color:#6b7280;">Subtotal</td><td style="padding:5px 0;text-align:right;">${formatCurrency(order.totalAmount)}</td></tr>
              <tr><td style="padding:5px 0;color:#6b7280;">IGST (5%)</td><td style="padding:5px 0;text-align:right;">${formatCurrency(order.taxAmount)}</td></tr>
              <tr><td style="padding:10px 0 5px;font-size:16px;font-weight:700;">Total</td><td style="padding:10px 0 5px;text-align:right;font-size:18px;font-weight:700;">${formatCurrency(order.payableAmount)}</td></tr>
            </table>

            <div style="border-top:1px solid #e5e7eb;margin-top:22px;padding-top:20px;">
              <h2 style="font-size:17px;margin:0 0 8px;">Shipping address</h2>
              <div style="color:#4b5563;font-size:14px;line-height:1.6;">${getAddressHtml(address)}</div>
              ${admin && address.email ? `<div style="color:#4b5563;font-size:14px;margin-top:5px;">Email: ${escapeHtml(address.email)}</div>` : ""}
            </div>

            <p style="color:#6b7280;font-size:12px;line-height:1.5;margin:26px 0 0;">
              ${admin ? "This is an automated new-order notification for the admin team." : "We will send further updates as your order is processed."}
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
};

const sendOrderPlacedEmails = async (order) => {
  const reference = order.orderNumber || String(order._id);
  const customerEmail = order.address?.email;
  const adminEmail =
    process.env.ADMIN_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL;
  const deliveries = [];

  if (customerEmail) {
    deliveries.push({
      role: "customer",
      promise: sendEmail({
        to: customerEmail,
        subject: `Order confirmed - ${reference}`,
        html: getEmailShell({
          title: "Thank you for your order",
          intro: `Hi ${order.address?.name || "there"}, we have received your order and will keep you updated.`,
          order,
        }),
      }),
    });
  }

  if (adminEmail) {
    deliveries.push({
      role: "admin",
      promise: sendEmail({
        to: adminEmail,
        subject: `New order received - ${reference}`,
        html: getEmailShell({
          title: "New order received",
          intro: `${order.address?.name || "A customer"} placed a new ${order.paymentMethod || "COD"} order.`,
          order,
          admin: true,
        }),
      }),
    });
  }

  const results = await Promise.allSettled(
    deliveries.map((delivery) => delivery.promise)
  );

  return results.map((result, index) => ({
    role: deliveries[index].role,
    sent: result.status === "fulfilled",
    error: result.status === "rejected" ? result.reason?.message : "",
  }));
};

module.exports = { sendOrderPlacedEmails };
