const express = require('express');

const { record, getStats } = require('../services/cigaretteService');

const router = express.Router();

router.get('/stats', async (req, res, next) => {
  try {
    const openid = req.openid;
    const result = await getStats(openid);

    res.json({
      success: true,
      ...result
    });
  } catch (e) {
    next(e);
  }
});

router.post('/record', async (req, res, next) => {
  try {
    const openid = req.openid;
    const { type, date } = req.body || {};

    const updated = await record(openid, type, date);

    res.json({
      success: true,
      data: {
        date: updated.date,
        puffCount: updated.puffCount || 0,
        shakeCount: updated.shakeCount || 0,
        lightCount: updated.lightCount != null ? updated.lightCount : (updated.newCount || 0)
      }
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
