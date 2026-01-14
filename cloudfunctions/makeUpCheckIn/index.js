// cloudfunctions/makeUpCheckIn/index.js
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { date } = event;

  try {
    // 验证日期
    if (!date) {
      return {
        success: false,
        message: '请选择补签日期'
      };
    }

    const targetDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 不能补签未来日期
    if (targetDate >= today) {
      return {
        success: false,
        message: '不能补签今天或未来日期'
      };
    }

    // 只能补签本月的日期
    if (targetDate.getMonth() !== today.getMonth() || 
        targetDate.getFullYear() !== today.getFullYear()) {
      return {
        success: false,
        message: '只能补签本月的日期'
      };
    }

    // 获取用户信息
    const userResult = await db.collection('users').where({
      _openid: wxContext.OPENID
    }).get();

    if (userResult.data.length === 0) {
      return {
        success: false,
        message: '用户不存在'
      };
    }

    const user = userResult.data[0];

    // 检查补签次数
    const makeUpCount = user.makeUpCount || 0;
    if (makeUpCount >= 3) {
      return {
        success: false,
        message: '本月补签次数已用完'
      };
    }

    // 检查是否已经签到过
    const checkinResult = await db.collection('checkins').where({
      _openid: wxContext.OPENID,
      date: date
    }).get();

    if (checkinResult.data.length > 0) {
      return {
        success: false,
        message: '该日期已签到，无需补签'
      };
    }

    // 创建补签记录
    await db.collection('checkins').add({
      data: {
        _openid: wxContext.OPENID,
        date: date,
        isMakeUp: true,
        createTime: db.serverDate()
      }
    });

    // 更新用户补签次数
    await db.collection('users').where({
      _openid: wxContext.OPENID
    }).update({
      data: {
        makeUpCount: _.inc(1),
        updateTime: db.serverDate()
      }
    });

    return {
      success: true,
      message: '补签成功',
      remainingCount: 2 - makeUpCount
    };
  } catch (err) {
    console.error('补签失败:', err);
    return {
      success: false,
      message: '补签失败，请重试'
    };
  }
};
