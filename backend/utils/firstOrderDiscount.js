const DiscountSetting = require("../models/DiscountSetting");
const Order = require("../models/Order");

const DEFAULT_SETTING = {
  key: "firstOrder",
  enabled: true,
  percentage: 15,
};

const getFirstOrderDiscountSetting = async () => {
  const setting = await DiscountSetting.findOneAndUpdate(
    { key: DEFAULT_SETTING.key },
    { $setOnInsert: DEFAULT_SETTING },
    { new: true, upsert: true }
  ).lean();

  return {
    enabled: Boolean(setting.enabled),
    percentage: Number(setting.percentage || DEFAULT_SETTING.percentage),
  };
};

const isFirstOrderForUser = async (userId) => {
  const existingOrderCount = await Order.countDocuments({ user: userId });
  return existingOrderCount === 0;
};

const calculateFirstOrderDiscount = async (userId, amount) => {
  const setting = await getFirstOrderDiscountSetting();
  const eligible = setting.enabled && await isFirstOrderForUser(userId);
  const rate = eligible ? setting.percentage / 100 : 0;
  const discountAmount = Math.floor(Math.max(0, Number(amount || 0)) * rate);

  return {
    eligible,
    percentage: eligible ? setting.percentage : 0,
    rate,
    discountAmount,
  };
};

module.exports = {
  getFirstOrderDiscountSetting,
  isFirstOrderForUser,
  calculateFirstOrderDiscount,
};
