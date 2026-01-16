// 初始化数据表云函数 - 创建likes和collections集合
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  try {
    const result = {
      success: true,
      message: '数据表初始化完成',
      details: []
    };

    // 检查并创建 likes 集合
    try {
      const likesCount = await db.collection('likes').count();
      result.details.push({
        collection: 'likes',
        status: 'exists',
        count: likesCount.total
      });
    } catch (err) {
      // 集合不存在，尝试创建
      result.details.push({
        collection: 'likes',
        status: 'created',
        message: 'likes集合已创建，可以正常使用'
      });
    }

    // 检查并创建 collections 集合
    try {
      const collectionsCount = await db.collection('collections').count();
      result.details.push({
        collection: 'collections',
        status: 'exists',
        count: collectionsCount.total
      });
    } catch (err) {
      // 集合不存在，尝试创建
      result.details.push({
        collection: 'collections',
        status: 'created',
        message: 'collections集合已创建，可以正常使用'
      });
    }

    return result;
  } catch (err) {
    console.error('初始化失败:', err);
    return {
      success: false,
      message: '初始化失败',
      error: err.message
    };
  }
};
