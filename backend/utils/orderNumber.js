const Counter = require("../models/Counter");
const Order = require("../models/Order");

const COUNTER_ID = "orderNumber";
const ORDER_PREFIX = "FT";
const ORDER_NUMBER_PATTERN = /^FT(\d+)$/;

const formatOrderNumber = (sequence) =>
  `${ORDER_PREFIX}${String(sequence).padStart(5, "0")}`;

const getNextOrderNumber = async () => {
  const counter = await Counter.findByIdAndUpdate(
    COUNTER_ID,
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return formatOrderNumber(counter.seq);
};

const getHighestExistingSequence = async () => {
  const existingNumbers = await Order.find({
    orderNumber: { $regex: "^FT[0-9]+$" },
  })
    .select("orderNumber")
    .lean();

  return existingNumbers.reduce((highest, order) => {
    const match = ORDER_NUMBER_PATTERN.exec(order.orderNumber || "");
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
};

const backfillOrderNumbers = async () => {
  const highestSequence = await getHighestExistingSequence();
  await Counter.findByIdAndUpdate(
    COUNTER_ID,
    { $max: { seq: highestSequence } },
    { upsert: true, setDefaultsOnInsert: true }
  );

  const orders = await Order.find({
    $or: [
      { orderNumber: { $exists: false } },
      { orderNumber: null },
      { orderNumber: "" },
    ],
  }).sort({ createdAt: 1, _id: 1 });

  for (const order of orders) {
    const orderNumber = await getNextOrderNumber();
    await Order.updateOne(
      {
        _id: order._id,
        $or: [
          { orderNumber: { $exists: false } },
          { orderNumber: null },
          { orderNumber: "" },
        ],
      },
      { $set: { orderNumber } }
    );
  }

  return orders.length;
};

module.exports = {
  backfillOrderNumbers,
  formatOrderNumber,
  getNextOrderNumber,
};
