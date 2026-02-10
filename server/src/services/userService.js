const User = require('../models/User');
const { monthKey } = require('../utils/date');

async function findOrCreateUser(openid) {
  let user = await User.findOne({ openid });
  if (!user) {
    user = await User.create({ openid });
  }
  return user;
}

async function ensureMonthlyMakeupQuota(user) {
  const now = new Date();
  const currentMonth = monthKey(now);

  if (user.lastMakeUpResetMonth !== currentMonth) {
    user.makeUpCount = 3;
    user.lastMakeUpResetMonth = currentMonth;
    await user.save();
  } else if (typeof user.makeUpCount !== 'number') {
    user.makeUpCount = 3;
    await user.save();
  }

  return user;
}

module.exports = {
  findOrCreateUser,
  ensureMonthlyMakeupQuota
};
