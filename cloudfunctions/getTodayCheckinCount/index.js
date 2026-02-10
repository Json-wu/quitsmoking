// 云函数：获取今日签到人数
const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  try {
    // 获取今天的日期（格式：YYYY-MM-DD）
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    // 查询今日签到记录数量
    const result = await db.collection('checkins')
      .where({
        date: todayStr
      })
      .count();

    return {
      success: true,
      count: result.total,
      date: todayStr
    };
  } catch (err) {
    console.error('获取今日签到人数失败:', err);
    return {
      success: false,
      error: err.message,
      count: 0
    };
  }
};
