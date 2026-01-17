// cloudfunctions/getArticles/index.js
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { category = 'all', page = 1, pageSize = 10, aIds } = event;

  try {
    // 构建查询条件
    const where = {
      status: 'published'
    };

    if (category && category !== 'all') {
      where.category = category;
    }

    if (aIds && aIds.length > 0) {
      where._id = _.in(aIds);
    }

    // 计算跳过数量
    const skip = (page - 1) * pageSize;

    // 查询文章列表
    const articlesResult = await db.collection('articles')
      .where(where)
      .orderBy('publishTime', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get();

    // 获取用户的点赞和收藏记录
    const articleIds = articlesResult.data.map(item => item._id);
    
    let likedArticles = [];
    let collectedArticles = [];

    if (articleIds.length > 0) {
      // 查询点赞记录
      const likesResult = await db.collection('likes').where({
        _openid: wxContext.OPENID,
        articleId: _.in(articleIds)
      }).get();
      likedArticles = likesResult.data.map(item => item.articleId);

      // 查询收藏记录
      const collectsResult = await db.collection('collections').where({
        _openid: wxContext.OPENID,
        articleId: _.in(articleIds)
      }).get();
      collectedArticles = collectsResult.data.map(item => item.articleId);
    }

    // 组装文章数据
    const articles = articlesResult.data.map(article => ({
      ...article,
      isLiked: likedArticles.includes(article._id),
      isCollected: collectedArticles.includes(article._id)
    }));

    return {
      success: true,
      articles: articles,
      page: page,
      pageSize: pageSize
    };
  } catch (err) {
    console.error('获取文章列表失败:', err);
    return {
      success: false,
      message: '获取失败，请重试',
      articles: []
    };
  }
};
