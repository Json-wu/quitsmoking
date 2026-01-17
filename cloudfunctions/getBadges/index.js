// cloudfunctions/getBadges/index.js
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

/**
 * 获取用户勋章列表
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    // 获取用户的所有勋章
    const { data: badges } = await db.collection('badges')
      .where({
        _openid: openid
      })
      .orderBy('unlockTime', 'desc')
      .get();

    return {
      success: true,
      badges: badges || []
    };
  } catch (err) {
    console.error('获取勋章列表失败:', err);
    return {
      success: false,
      error: err.message,
      badges: []
    };
  }
};
