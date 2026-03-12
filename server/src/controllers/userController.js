// 用户控制器
const User = require('../models/User');
const Checkin = require('../models/Checkin');
const Cigarette = require('../models/Cigarette');
const Share = require('../models/Share');

/**
 * 用户登录
 */
exports.login = async (req, res) => {
  try {
    const { openid } = req.body;

    if (!openid) {
      return res.json({ success: false, message: '缺少openid' });
    }

    // 查询用户是否存在
    let user = await User.findOne({ openid });

    // 如果用户不存在，创建新用户
    if (!user) {
      console.log('用户不存在，创建新用户');
      user = await User.create({
        openid,
        nickName: '',
        avatarUrl: '',
        quitDate: new Date().toISOString().slice(0, 10),
        dailyCigarettes: 20,
        cigarettePrice: 15,
        cigarettesPerPack: 20,
        makeUpCount: 3,
        lastMakeUpResetMonth: new Date().toISOString().slice(0, 7),
        continuousDays: 0,
        totalCheckin: 0,
        settings: {
          reminderEnabled: true,
          reminderTime: "09:00",
          showInRanking: true,
          notifySurprise: true,
          notifyArticle: false,
          customRefuseText: '戒烟中,请勿劝烟!',
        }
      });
    }

    res.json({
      success: true,
      openid,
      message: '登录成功'
    });
  } catch (err) {
    console.error('登录失败:', err);
    res.json({
      success: false,
      error: err.message
    });
  }
};

/**
 * 获取用户统计数据
 */
exports.getUserStats = async (req, res) => {
  try {
    const { openid } = req.body;

    if (!openid) {
      return res.json({ success: false, message: '缺少openid' });
    }

    // 获取用户信息
    const user = await User.findOne({ openid });

    if (!user) {
      return res.json({
        success: false,
        message: '用户不存在'
      });
    }

    // 每月自动重置补签次数为 3 次
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    let makeUpCount = user.makeUpCount;
    
    if (user.lastMakeUpResetMonth !== currentMonthKey) {
      user.makeUpCount = 3;
      user.lastMakeUpResetMonth = currentMonthKey;
      await user.save();
      makeUpCount = 3;
    }

    // 获取今日签到状态
    const today = new Date().toISOString().slice(0, 10);
    const todayCheckin = await Checkin.findOne({ openid, date: today });
    const hasCheckedToday = !!todayCheckin;

    // 获取签到统计
    const latestCheckin = await Checkin.findOne({ openid }).sort({ date: -1 });
    let continuousCheckin = 0;
    let totalCheckin = 0;

    if (latestCheckin) {
      continuousCheckin = latestCheckin.continuousDays;
      totalCheckin = latestCheckin.totalDays;
    }

    // 计算戒烟天数
    let quitDays = 0;
    if (user.quitDate) {
      const quitDate = new Date(user.quitDate);
      quitDate.setHours(0, 0, 0, 0);
      const quitDateStr = quitDate.toISOString().slice(0, 10);

      quitDays = await Checkin.countDocuments({
        openid,
        date: { $gte: quitDateStr }
      });
    }

    // 计算健康收益
    const savedCigarettes = quitDays * user.dailyCigarettes;
    const savedMoney = ((savedCigarettes / user.cigarettesPerPack) * user.cigarettePrice).toFixed(2);
    const healthIndex = Math.min(100, Math.floor(quitDays / 3.65));
    const nicotineReduced = (savedCigarettes * 1.2).toFixed(2);

    // 获取电子烟统计
    const cigaretteStats = await Cigarette.find({ openid });
    const cigaretteCount = cigaretteStats.reduce((total, record) => total + (record.puffCount || 0), 0);

    // 获取送烟次数统计
    const shareStats = await Share.find({ openid });
    const shareCount = shareStats.reduce((total, record) => total + (record.shareCount || 0), 0);

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
      healthStats: {
        savedCigarettes,
        savedMoney,
        healthIndex,
        nicotineReduced
      },
      makeUpCount,
      cigaretteCount,
      shareCount
    });
  } catch (err) {
    console.error('获取用户统计失败:', err);
    res.json({
      success: false,
      error: err.message
    });
  }
};

/**
 * 设置戒烟日期
 */
exports.setQuitDate = async (req, res) => {
  try {
    const { openid, quitDate } = req.body;

    if (!openid || !quitDate) {
      return res.json({ success: false, message: '缺少必要参数' });
    }

    const user = await User.findOne({ openid });
    if (!user) {
      return res.json({ success: false, message: '用户不存在' });
    }

    user.quitDate = quitDate;
    await user.save();

    res.json({
      success: true,
      message: '设置成功',
      quitDate
    });
  } catch (err) {
    console.error('设置戒烟日期失败:', err);
    res.json({
      success: false,
      error: err.message
    });
  }
};

/**
 * 更新吸烟数据
 */
exports.updateSmokingData = async (req, res) => {
  try {
    const { openid, dailyCigarettes, cigarettePrice } = req.body;

    if (!openid) {
      return res.json({ success: false, message: '缺少openid' });
    }

    const user = await User.findOne({ openid });
    if (!user) {
      return res.json({ success: false, message: '用户不存在' });
    }

    if (dailyCigarettes !== undefined) {
      user.dailyCigarettes = dailyCigarettes;
    }
    if (cigarettePrice !== undefined) {
      user.cigarettePrice = cigarettePrice;
    }

    await user.save();

    res.json({
      success: true,
      message: '更新成功'
    });
  } catch (err) {
    console.error('更新吸烟数据失败:', err);
    res.json({
      success: false,
      error: err.message
    });
  }
};

/**
 * 初始化数据库
 */
exports.initDB = async (req, res) => {
  try {
    // 这里可以添加数据库初始化逻辑
    res.json({
      success: true,
      message: '数据库初始化成功'
    });
  } catch (err) {
    console.error('初始化数据库失败:', err);
    res.json({
      success: false,
      error: err.message
    });
  }
};
