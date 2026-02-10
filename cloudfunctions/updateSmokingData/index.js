// 云函数：更新用户抽烟数据
const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { dailyCigarettes, cigarettePrice } = event;

  try {
    // 更新用户信息中的抽烟数据
    const result = await db.collection('users').where({
      openid: wxContext.OPENID
    }).update({
      data: {
        dailyCigarettes: dailyCigarettes,
        cigarettePrice: cigarettePrice,
        updateTime: db.serverDate()
      }
    });

    console.log('更新抽烟数据成功:', result);

    return {
      success: true,
      message: '保存成功',
      data: {
        dailyCigarettes,
        cigarettePrice
      }
    };
  } catch (err) {
    console.error('更新抽烟数据失败:', err);
    return {
      success: false,
      error: err.message
    };
  }
};
