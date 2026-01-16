// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  
  const { year, month } = event;

  try {
    // 构建查询日期范围
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDay = new Date(year, month, 0).getDate(); // 获取该月最后一天
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;

    console.log('查询日期范围:', openid, startDate, endDate);
    // 查询该月的签到记录
    const { data: records } = await db.collection('checkins')
      .where({
        _openid: openid,
        date: _.gte(startDate).and(_.lte(endDate + 'T23:59:59'))
      })
      .orderBy('date', 'asc')
      .get();
    
    console.log('查询到的签到记录:', records);

    // 获取用户统计信息
    const { data: users } = await db.collection('users')
      .where({
        _openid: openid
      })
      .get();

    const user = users[0] || {};

    // 计算连续签到天数
    const continuousDays = user.continuousCheckin || 0;
    const totalCheckin = user.totalCheckin || 0;
    const makeUpCount = user.makeUpCount || 0;

    return {
      success: true,
      records: records.map(r => ({
        date: r.date,
        isMakeUp: r.isMakeUp || false
      })),
      continuousDays,
      totalCheckin,
      makeUpCount
    };
  } catch (err) {
    console.error('获取签到记录失败:', err);
    return {
      success: false,
      message: err.message || '获取签到记录失败'
    };
  }
};
