// cloudfunctions/getCollections/index.js
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

/**
 * 获取用户收藏列表
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    // 获取用户的所有收藏
    const { data: collections } = await db.collection('collections')
      .where({
        _openid: openid
      })
      .orderBy('collectTime', 'desc')
      .get();

    return {
      success: true,
      collections: collections || []
    };
  } catch (err) {
    console.error('获取收藏列表失败:', err);
    return {
      success: false,
      error: err.message,
      collections: []
    };
  }
};
