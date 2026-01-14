// cloudfunctions/getArticleDetail/index.js
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
    if (!articleId) {
      return {
        success: false,
        message: '文章ID不能为空'
      };
    }

    // 获取文章详情
    const articleResult = await db.collection('articles').doc(articleId).get();

    if (!articleResult.data) {
      return {
        success: false,
        message: '文章不存在'
      };
    }

    const article = articleResult.data;

    // 增加浏览量
    await db.collection('articles').doc(articleId).update({
      data: {
        viewCount: _.inc(1)
      }
    });

    // 检查用户是否点赞
    const likeResult = await db.collection('likes').where({
      _openid: wxContext.OPENID,
      articleId: articleId
    }).get();
    article.isLiked = likeResult.data.length > 0;

    // 检查用户是否收藏
    const collectResult = await db.collection('collections').where({
      _openid: wxContext.OPENID,
      articleId: articleId
    }).get();
    article.isCollected = collectResult.data.length > 0;

    // 获取相关推荐文章
    const relatedResult = await db.collection('articles')
      .where({
        category: article.category,
        _id: _.neq(articleId),
        status: 'published'
      })
      .orderBy('viewCount', 'desc')
      .limit(5)
      .get();

    return {
      success: true,
      article: article,
      relatedArticles: relatedResult.data
    };
  } catch (err) {
    console.error('获取文章详情失败:', err);
    return {
      success: false,
      message: '获取失败，请重试'
    };
  }
};
