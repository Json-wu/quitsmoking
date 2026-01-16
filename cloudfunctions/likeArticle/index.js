// cloudfunctions/likeArticle/index.js
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
    // 检查是否已经点赞
    const existResult = await db.collection('likes').where({
      _openid: wxContext.OPENID,
      articleId: articleId
    }).get();

    if (existResult.data.length > 0) {
      return {
        success: false,
        message: '已经点赞过了'
      };
    }

    // 添加点赞记录
    await db.collection('likes').add({
      data: {
        _openid: wxContext.OPENID,
        articleId: articleId,
        createTime: db.serverDate()
      }
    });

    // 更新文章点赞数
    await db.collection('articles').doc(articleId).update({
      data: {
        likeCount: _.inc(1)
      }
    });

    return {
      success: true,
      message: '点赞成功'
    };
  } catch (err) {
    console.error('点赞失败:', err);
    return {
      success: false,
      message: '点赞失败，请重试',
      error: err.message
    };
  }
};
