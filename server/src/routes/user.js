const express = require('express');

const { findOrCreateUser, ensureMonthlyMakeupQuota } = require('../services/userService');
const { getLatestCheckin } = require('../services/checkinService');
const Checkin = require('../models/Checkin');
const Badge = require('../models/Badge');
const { formatDateYYYYMMDD } = require('../utils/date');

const router = express.Router();

router.get('/stats', async (req, res, next) => {
  try {
    const openid = req.openid;
    let user = await findOrCreateUser(openid);
    user = await ensureMonthlyMakeupQuota(user);

    const latest = await getLatestCheckin(openid);

    const todayStr = formatDateYYYYMMDD(new Date());
    const todayCheckin = await Checkin.findOne({ openid, date: todayStr });
    const hasCheckedToday = !!todayCheckin;

    const continuousCheckin = latest ? (latest.continuousDays || 0) : 0;
    const totalCheckin = latest ? (latest.totalDays || 0) : 0;

    let quitDays = 0;
    if (user.quitDate) {
      quitDays = await Checkin.countDocuments({ openid, date: { $gte: user.quitDate } });
    }

    const badgeCount = await Badge.countDocuments({ openid });

    res.json({
      success: true,
      userInfo: {
        nickName: user.nickName,
        avatarUrl: user.avatarUrl
      },
      quitDate: user.quitDate,
      quitDays,
      continuousCheckin,
      totalCheckin,
      hasCheckedToday,
      badgeCount,
      makeUpCount: user.makeUpCount,
      cigaretteCount: 0,
      shareCount: 0
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
