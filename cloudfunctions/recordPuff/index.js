// cloudfunctions/recordPuff/index.js
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { type, count = 1 } = event;

  try {
    // 验证类型
    const validTypes = ['puff', 'shake', 'new'];
    if (!validTypes.includes(type)) {
      return {
        success: false,
        message: '无效的操作类型'
      };
    }

    const today = new Date();
    const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // 查询今日记录
    const recordResult = await db.collection('cigarettes').where({
      _openid: wxContext.OPENID,
      date: dateString
    }).get();

    if (recordResult.data.length > 0) {
      // 更新今日记录
      const record = recordResult.data[0];
      const updateData = {
        updateTime: db.serverDate()
      };

      if (type === 'puff') {
        updateData.puffCount = _.inc(count);
      } else if (type === 'shake') {
        updateData.shakeCount = _.inc(count);
      } else if (type === 'new') {
        updateData.newCount = _.inc(count);
      }

      await db.collection('cigarettes').doc(record._id).update({
        data: updateData
      });

      // 获取更新后的记录
      const updatedResult = await db.collection('cigarettes').doc(record._id).get();

      return {
        success: true,
        message: '记录成功',
        stats: {
          puffCount: updatedResult.data.puffCount || 0,
          shakeCount: updatedResult.data.shakeCount || 0,
          newCount: updatedResult.data.newCount || 0
        }
      };
    } else {
      // 创建今日记录
      const newRecord = {
        _openid: wxContext.OPENID,
        date: dateString,
        puffCount: type === 'puff' ? count : 0,
        shakeCount: type === 'shake' ? count : 0,
        newCount: type === 'new' ? count : 0,
        createTime: db.serverDate()
      };

      await db.collection('cigarettes').add({
        data: newRecord
      });

      return {
        success: true,
        message: '记录成功',
        stats: {
          puffCount: newRecord.puffCount,
          shakeCount: newRecord.shakeCount,
          newCount: newRecord.newCount
        }
      };
    }
  } catch (err) {
    console.error('记录失败:', err);
    return {
      success: false,
      message: '记录失败，请重试'
    };
  }
};
