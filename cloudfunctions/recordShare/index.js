// cloudfunctions/recordShare/index.js
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

/**
 * 记录分享行为云函数
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { shareType } = event;

  try {
    const today = new Date();
    const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // 查询今日分享记录
    const { data: records } = await db.collection('shares').where({
      _openid: openid,
      date: dateString
    }).get();

    if (records.length > 0) {
      // 更新今日记录
      const record = records[0];
      const updateResult = await db.collection('shares').doc(record._id).update({
        data: {
          shareCount: _.inc(1),
          shareType,
          updateTime: db.serverDate()
        }
      });

      return {
        success: true,
        message: '记录成功',
        shareCount: (record.shareCount || 0) + 1
      };
    } else {
      // 创建今日记录
      const newRecord = {
        _openid: openid,
        date: dateString,
        shareType,
        shareCount: 1,
        createTime: db.serverDate()
      };

      await db.collection('shares').add({
        data: newRecord
      });

      return {
        success: true,
        message: '记录成功',
        shareCount: 1
      };
    }
  } catch (err) {
    console.error('记录分享失败:', err);
    return {
      success: false,
      error: err.message
    };
  }
};
