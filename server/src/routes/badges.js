const express = require('express');

const Badge = require('../models/Badge');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const openid = req.openid;
    const badges = await Badge.find({ openid }).sort({ unlockTime: -1 });

    res.json({
      success: true,
      badges
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
