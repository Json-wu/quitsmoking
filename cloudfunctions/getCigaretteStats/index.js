// cloudfunctions/getCigaretteStats/index.js
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

/**
 * 获取用户电子烟统计数据
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    // 获取今天的日期（YYYY-MM-DD格式）
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    // 获取今日的电子烟记录
    const { data: todayRecords } = await db.collection('cigarettes')
      .where({
        _openid: openid,
        date: todayStr
      })
      .get();

    let todayPuffCount = 0;
    let todayShakeCount = 0;
    let todayNewCount = 0;

    if (todayRecords && todayRecords.length > 0) {
      const record = todayRecords[0];
      todayPuffCount = record.puffCount || 0;
      todayShakeCount = record.shakeCount || 0;
      todayNewCount = record.newCount || 0;
    }

    // 获取所有记录统计总数
    const { data: allRecords } = await db.collection('cigarettes')
      .where({
        _openid: openid
      })
      .get();

    let totalPuffCount = 0;
    let totalShakeCount = 0;
    let totalNewCount = 0;

    if (allRecords && allRecords.length > 0) {
      allRecords.forEach(record => {
        totalPuffCount += record.puffCount || 0;
        totalShakeCount += record.shakeCount || 0;
        totalNewCount += record.newCount || 0;
      });
    }

    return {
      success: true,
      today: {
        puffCount: todayPuffCount,
        shakeCount: todayShakeCount,
        newCount: todayNewCount
      },
      total: {
        puffCount: totalPuffCount,
        shakeCount: totalShakeCount,
        newCount: totalNewCount
      }
    };
  } catch (err) {
    console.error('获取电子烟统计失败:', err);
    return {
      success: false,
      error: err.message,
      today: {
        puffCount: 0,
        shakeCount: 0,
        newCount: 0
      },
      total: {
        puffCount: 0,
        shakeCount: 0,
        newCount: 0
      }
    };
  }
};
