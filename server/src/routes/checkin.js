const express = require('express');

const { findOrCreateUser, ensureMonthlyMakeupQuota } = require('../services/userService');
const { checkInToday, makeUpCheckIn } = require('../services/checkinService');
const { httpError } = require('../utils/errors');

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const openid = req.openid;
    await findOrCreateUser(openid);

    const result = await checkInToday(openid);
    res.json({
      success: true,
      message: '签到成功',
      continuousDays: result.continuousDays,
      totalDays: result.totalDays
    });
  } catch (e) {
    next(e);
  }
});

router.post('/makeup', async (req, res, next) => {
  try {
    const openid = req.openid;
    let user = await findOrCreateUser(openid);
    user = await ensureMonthlyMakeupQuota(user);

    if (user.makeUpCount === 0) {
      throw httpError(400, '本月补签次数已用完');
    }

    const { date } = req.body || {};
    const result = await makeUpCheckIn(openid, date);

    user.makeUpCount = Math.max(0, (user.makeUpCount || 0) - 1);
    await user.save();

    res.json({
      success: true,
      message: '补签成功',
      remainingCount: user.makeUpCount,
      continuousDays: result.continuousDays,
      totalDays: result.totalDays
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
