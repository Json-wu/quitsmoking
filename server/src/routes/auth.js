const express = require('express');
const jwt = require('jsonwebtoken');

const { code2Session } = require('../services/wechatService');
const { findOrCreateUser, ensureMonthlyMakeupQuota } = require('../services/userService');
const { httpError } = require('../utils/errors');

const router = express.Router();

router.post('/wxlogin', async (req, res, next) => {
  try {
    const { code, userInfo } = req.body || {};

    const { openid } = await code2Session(code);

    let user = await findOrCreateUser(openid);

    if (userInfo && typeof userInfo === 'object') {
      if (typeof userInfo.nickName === 'string') user.nickName = userInfo.nickName;
      if (typeof userInfo.avatarUrl === 'string') user.avatarUrl = userInfo.avatarUrl;
      await user.save();
    }

    user = await ensureMonthlyMakeupQuota(user);

    const secret = process.env.JWT_SECRET;
    if (!secret) throw httpError(500, 'Missing JWT_SECRET');

    const token = jwt.sign({ openid }, secret, { expiresIn: '30d' });

    res.json({
      success: true,
      token,
      openid,
      makeUpCount: user.makeUpCount
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
