// cloudfunctions/unlikeArticle/index.js
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
    // 查找点赞记录
    const existResult = await db.collection('likes').where({
      _openid: wxContext.OPENID,
      articleId: articleId
    }).get();

    if (existResult.data.length === 0) {
      return {
        success: false,
        message: '还未点赞'
      };
    }

    // 删除点赞记录
    await db.collection('likes').doc(existResult.data[0]._id).remove();

    // 更新文章点赞数
    await db.collection('articles').doc(articleId).update({
      data: {
        likeCount: _.inc(-1)
      }
    });

    return {
      success: true,
      message: '取消点赞成功'
    };
  } catch (err) {
    console.error('取消点赞失败:', err);
    return {
      success: false,
      message: '取消点赞失败，请重试',
      error: err.message
    };
  }
};
