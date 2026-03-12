// 电子烟控制器
const Cigarette = require('../models/Cigarette');
const Share = require('../models/Share');

/**
 * 记录吸烟次数
 */
exports.recordPuff = async (req, res) => {
  try {
    const { openid, count = 1, type } = req.body;

    if (!openid) {
      return res.json({ success: false, message: '缺少openid' });
    }

    const today = new Date().toISOString().slice(0, 10);

    // 查找今天的记录
    let record = await Cigarette.findOne({ openid, date: today });

    if (record) {
      if (type === 'puff') {
        record.puffCount += count;
      } else if (type === 'shake') {
        record.shakeCount += count;
      } else if (type === 'new') {
        record.newCount += count;
      } else if (type === 'light') {
        record.lightCount += count;
      }
      await record.save();
    } else {
      record = await Cigarette.create({
        openid,
        date: today,
        puffCount: type === 'puff' ? count : 0,
        shakeCount: type === 'shake' ? count : 0,
        newCount: type === 'new' ? count : 0,
        lightCount: type === 'light' ? count : 0
      });
    }

    res.json({
      success: true,
      message: '记录成功',
      totalPuffCount: record.puffCount
    });
  } catch (err) {
    console.error('记录吸烟次数失败:', err);
    res.json({
      success: false,
      error: err.message
    });
  }
};

/**
 * 记录送烟次数
 */
exports.recordShare = async (req, res) => {
  try {
    const { openid, shareCount = 1 } = req.body;

    if (!openid) {
      return res.json({ success: false, message: '缺少openid' });
    }

    const today = new Date().toISOString().slice(0, 10);

    let record = await Share.findOne({ openid, date: today });

    if (record) {
      record.shareCount += shareCount;
      await record.save();
    } else {
      record = await Share.create({
        openid,
        date: today,
        shareCount
      });
    }

    res.json({
      success: true,
      message: '记录成功',
      totalShareCount: record.shareCount
    });
  } catch (err) {
    console.error('记录送烟次数失败:', err);
    res.json({
      success: false,
      error: err.message
    });
  }
};

/**
 * 获取电子烟统计
 */
exports.getCigaretteStats = async (req, res) => {
  try {
    const { openid } = req.body;

    if (!openid) {
      return res.json({ success: false, message: '缺少openid' });
    }

    const date = new Date().toISOString().slice(0, 10);
    const stats = await Cigarette.findOne({ openid, date });

    // 如果没有记录，返回默认值
    const result = stats ? {
      puffCount: stats.puffCount || 0,
      shakeCount: stats.shakeCount || 0,
      newCount: stats.newCount || 0,
      lightCount: stats.lightCount || 0
    } : {
      puffCount: 0,
      shakeCount: 0,
      newCount: 0,
      lightCount: 0
    };

    res.json({
      success: true,
      stats: result
    });
  } catch (err) {
    console.error('获取电子烟统计失败:', err);
    res.json({
      success: false,
      error: err.message
    });
  }
};
