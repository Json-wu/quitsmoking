// cloudfunctions/setQuitDate/index.js
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { quitDate } = event;

  try {
    // 验证日期格式
    if (!quitDate) {
      return {
        success: false,
        message: '请选择戒烟日期'
      };
    }

    const quitDateObj = new Date(quitDate);
    const today = new Date();
    
    if (quitDateObj > today) {
      return {
        success: false,
        message: '戒烟日期不能是未来日期'
      };
    }

    // 更新用户戒烟日期
    const result = await db.collection('users').where({
      _openid: wxContext.OPENID
    }).update({
      data: {
        quitDate: quitDateObj,
        updateTime: db.serverDate()
      }
    });

    if (result.stats.updated === 0) {
      return {
        success: false,
        message: '更新失败，请重试'
      };
    }

    return {
      success: true,
      message: '设置成功',
      quitDate: quitDate
    };
  } catch (err) {
    console.error('设置戒烟日期失败:', err);
    return {
      success: false,
      message: '设置失败，请重试'
    };
  }
};
