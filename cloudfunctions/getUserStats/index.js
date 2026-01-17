// cloudfunctions/getUserStats/index.js
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

/**
 * 获取用户统计数据云函数
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    // 获取用户信息
    const { data: users } = await db.collection('users').where({
      _openid: openid
    }).get();

    console.log('获取用户统计:', users);
    if (users.length === 0) {
      return {
        success: false,
        message: '用户不存在'
      };
    }

    const user = users[0];

    // 获取今日签到状态
    const today = new Date().toISOString().slice(0, 10);
    const { data: todayCheckin } = await db.collection('checkins').where({
      _openid: openid,
      date: today
    }).get();

    const hasCheckedToday = (todayCheckin?.length || 0) > 0;

    // 获取签到统计（从最新的签到记录获取）
    const { data: checkins } = await db.collection('checkins').where({
      _openid: openid
    }).orderBy('date', 'desc').limit(1).get();

    let continuousCheckin = 0;
    let totalCheckin = 0;

    if (checkins && checkins.length > 0) {
      continuousCheckin = checkins[0].continuousDays;
      totalCheckin = checkins[0].totalDays;
    }

    // 计算戒烟天数：基于戒烟开始日期
    // 当天也算1天，所以需要 +1
    let quitDays = 0;
    if (user.quitDate) {
      const quitDate = new Date(user.quitDate);
      const now = new Date();
      // 将时间设置为0点，只比较日期
      quitDate.setHours(0, 0, 0, 0);
      now.setHours(0, 0, 0, 0);
      // 计算天数差，+1 表示包含当天
      quitDays = Math.floor((now - quitDate) / (1000 * 60 * 60 * 24)) + 1;
      // 确保天数不小于0
      if (quitDays < 0) quitDays = 0;
    }

    // 计算健康收益（基于戒烟天数）
    const savedCigarettes = quitDays * user.dailyCigarettes;
    const savedMoney = ((savedCigarettes / user.cigarettesPerPack) * user.cigarettePrice).toFixed(2);
    const healthIndex = Math.min(100, Math.floor(quitDays / 3.65));
    const nicotineReduced = (savedCigarettes * 1.2).toFixed(2);

    // 获取勋章数量
    const { total: badgeCount } = await db.collection('badges').where({
      _openid: openid
    }).count();

    // 获取电子烟统计 - 统计所有记录的总和
    const { data: cigaretteStats } = await db.collection('cigarettes').where({
      _openid: openid
    }).get();

    let cigaretteCount = 0;
    if (cigaretteStats && cigaretteStats.length > 0) {
      cigaretteCount = cigaretteStats.reduce((total, record) => {
        return total + (record.puffCount || 0);
      }, 0);
    }

    // 获取送烟次数统计 - 统计所有记录的总和
    const { data: shareStats } = await db.collection('shares').where({
      _openid: openid
    }).get();

    let shareCount = 0;
    if (shareStats && shareStats.length > 0) {
      shareCount = shareStats.reduce((total, record) => {
        return total + (record.shareCount || 0);
      }, 0);
    }

    return {
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
      badgeCount,
      makeUpCount: user.makeUpCount,
      cigaretteCount,
      shareCount
    };
  } catch (err) {
    console.error('获取用户统计失败:', err);
    return {
      success: false,
      error: err.message
    };
  }
};
