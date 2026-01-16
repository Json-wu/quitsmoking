// cloudfunctions/collectArticle/index.js
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
    // 检查是否已经收藏
    const existResult = await db.collection('collections').where({
      _openid: wxContext.OPENID,
      articleId: articleId
    }).get();

    if (existResult.data.length > 0) {
      return {
        success: false,
        message: '已经收藏过了'
      };
    }

    // 获取文章信息
    const articleResult = await db.collection('articles').doc(articleId).get();
    
    if (!articleResult.data) {
      return {
        success: false,
        message: '文章不存在'
      };
    }

    // 添加收藏记录
    await db.collection('collections').add({
      data: {
        _openid: wxContext.OPENID,
        articleId: articleId,
        articleTitle: articleResult.data.title,
        createTime: db.serverDate()
      }
    });

    // 更新文章收藏数
    await db.collection('articles').doc(articleId).update({
      data: {
        collectCount: _.inc(1)
      }
    });

    return {
      success: true,
      message: '收藏成功'
    };
  } catch (err) {
    console.error('收藏失败:', err);
    return {
      success: false,
      message: '收藏失败，请重试',
      error: err.message
    };
  }
};
