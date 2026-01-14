// cloudfunctions/checkIn/index.js
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

/**
 * 签到云函数
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    const today = new Date().toISOString().slice(0, 10);

    // 检查今天是否已签到
    const { data: todayCheckin } = await db.collection('checkins').where({
      _openid: openid,
      date: today
    }).get();

    if (todayCheckin.length > 0) {
      return {
        success: false,
        message: '今天已经签到过了'
      };
    }

    // 获取昨天的签到记录
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const { data: yesterdayCheckin } = await db.collection('checkins').where({
      _openid: openid,
      date: yesterday
    }).get();

    // 计算连续签到天数
    let continuousDays = 1;
    let totalDays = 1;

    if (yesterdayCheckin.length > 0) {
      continuousDays = yesterdayCheckin[0].continuousDays + 1;
      totalDays = yesterdayCheckin[0].totalDays + 1;
    } else {
      // 获取总签到天数
      const { total } = await db.collection('checkins').where({
        _openid: openid
      }).count();
      totalDays = total + 1;
    }

    // 添加签到记录
    await db.collection('checkins').add({
      data: {
        _openid: openid,
        date: today,
        timestamp: Date.now(),
        isMakeUp: false,
        continuousDays,
        totalDays,
        createTime: new Date()
      }
    });

    // 检查是否解锁新勋章
    const newBadges = await checkAndUnlockBadges(openid, continuousDays);

    return {
      success: true,
      message: '签到成功',
      continuousDays,
      totalDays,
      newBadges
    };
  } catch (err) {
    console.error('签到失败:', err);
    return {
      success: false,
      error: err.message
    };
  }
};

/**
 * 检查并解锁勋章
 */
async function checkAndUnlockBadges(openid, continuousDays) {
  const badges = [];
  const badgeConfigs = [
    { days: 7, type: 'week_hero', name: '周度英雄', icon: '🏅' },
    { days: 30, type: 'month_warrior', name: '月度勇士', icon: '🥉' },
    { days: 60, type: 'bimonth_hero', name: '双月英雄', icon: '🥈' },
    { days: 90, type: 'quarter_champion', name: '季度冠军', icon: '🥇' },
    { days: 180, type: 'halfyear_legend', name: '半年传奇', icon: '🏆' },
    { days: 365, type: 'year_king', name: '年度王者', icon: '👑' }
  ];

  for (const config of badgeConfigs) {
    if (continuousDays === config.days) {
      // 检查是否已经解锁
      const { data } = await db.collection('badges').where({
        _openid: openid,
        badgeType: config.type
      }).get();

      if (data.length === 0) {
        await db.collection('badges').add({
          data: {
            _openid: openid,
            badgeType: config.type,
            badgeName: config.name,
            days: config.days,
            icon: config.icon,
            description: `连续签到${config.days}天`,
            unlockTime: new Date()
          }
        });
        badges.push(config);
      }
    }
  }

  return badges;
}
