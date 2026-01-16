// cloudfunctions/login/index.js
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

/**
 * 用户登录云函数
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    // 查询用户是否存在
    const { data } = await db.collection('users').where({
      _openid: openid
    }).get();

    // 如果用户不存在，创建新用户
    if (data.length === 0) {
      console.log('用户不存在，创建新用户');
      await db.collection('users').add({
        data: {
          _openid: openid,
          nickName: '',
          avatarUrl: '',
          quitDate: new Date().toISOString().slice(0, 10),  // 格式: YYYY-MM-DD
          dailyCigarettes: 20,
          cigarettePrice: 15,
          cigarettesPerPack: 20,
          makeUpCount: 3,
          lastResetMonth: new Date().toISOString().slice(0, 7),
          continuousDays: 0,
          totalCheckin: 0,
          settings: {
            reminderEnabled: true,                 // 是否开启签到提醒
            reminderTime: "09:00",                 // 提醒时间
            showInRanking: true,                    // 是否在排行榜显示
            notifySurprise: true,
            notifyArticle: false,
            customRefuseText: '戒烟中,请勿劝烟!',
          },
          createTime: new Date(),
          updateTime: new Date()
        }
      });
    }

    return {
      success: true,
      openid,
      message: '登录成功'
    };
  } catch (err) {
    console.error('登录失败:', err);
    return {
      success: false,
      error: err.message
    };
  }
};
