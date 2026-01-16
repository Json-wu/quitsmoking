// cloudfunctions/uncollectArticle/index.js
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { articleId } = event;

  try {
    // 查找收藏记录
    const existResult = await db.collection('collections').where({
      _openid: wxContext.OPENID,
      articleId: articleId
    }).get();

    if (existResult.data.length === 0) {
      return {
        success: false,
        message: '还未收藏'
      };
    }

    // 删除收藏记录
    await db.collection('collections').doc(existResult.data[0]._id).remove();

    // 更新文章收藏数
    await db.collection('articles').doc(articleId).update({
      data: {
        collectCount: _.inc(-1)
      }
    });

    return {
      success: true,
      message: '取消收藏成功'
    };
  } catch (err) {
    console.error('取消收藏失败:', err);
    return {
      success: false,
      message: '取消收藏失败，请重试',
      error: err.message
    };
  }
};
