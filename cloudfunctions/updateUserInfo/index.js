// cloudfunctions/updateUserInfo/index.js
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

/**
 * 更新用户信息
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    // 构建更新数据
    const updateData = {};

    // 支持更新的字段
    if (event.nickName !== undefined) {
      updateData.nickName = event.nickName;
    }
    if (event.avatarUrl !== undefined) {
      updateData.avatarUrl = event.avatarUrl;
    }
    if (event.dailyCigarettes !== undefined) {
      updateData.dailyCigarettes = event.dailyCigarettes;
    }
    if (event.cigarettesPerPack !== undefined) {
      updateData.cigarettesPerPack = event.cigarettesPerPack;
    }
    if (event.cigarettePrice !== undefined) {
      updateData.cigarettePrice = event.cigarettePrice;
    }
    if (event.settings !== undefined) {
      updateData.settings = event.settings;
    }

    // 如果没有要更新的数据
    if (Object.keys(updateData).length === 0) {
      return {
        success: false,
        error: '没有要更新的数据'
      };
    }

    // 添加更新时间
    updateData.updateTime = new Date();

    // 查找用户记录
    const { data: users } = await db.collection('users')
      .where({
        _openid: openid
      })
      .get();

    if (users && users.length > 0) {
      // 用户存在，更新记录
      await db.collection('users')
        .where({
          _openid: openid
        })
        .update({
          data: updateData
        });
    } else {
      // 用户不存在，创建新记录
      updateData._openid = openid;
      updateData.createTime = new Date();
      await db.collection('users').add({
        data: updateData
      });
    }

    return {
      success: true,
      message: '更新成功'
    };
  } catch (err) {
    console.error('更新用户信息失败:', err);
    return {
      success: false,
      error: err.message
    };
  }
};
