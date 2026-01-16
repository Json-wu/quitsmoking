// services/article.js - 文章服务

const { callFunction } = require('../utils/request.js');

class ArticleService {
  /**
   * 获取文章列表
   * @param {Object} params - 查询参数
   * @returns {Promise} 文章列表
   */
  async getArticleList(params = {}) {
    try {
      const { category = 'all', page = 1, pageSize = 10 } = params;
      const res = await callFunction('getArticles', {
        category,
        page,
        pageSize
      });
      console.log('获取文章列表结果:', res);
      return res.result;
    } catch (err) {
      console.error('获取文章列表失败:', err);
      throw err;
    }
  }

  /**
   * 获取文章详情
   * @param {String} articleId - 文章ID
   * @returns {Promise} 文章详情
   */
  async getArticleDetail(articleId) {
    try {
      const res = await callFunction('getArticleDetail', { articleId });
      return res.result;
    } catch (err) {
      console.error('获取文章详情失败:', err);
      throw err;
    }
  }

  /**
   * 收藏文章
   * @param {String} articleId - 文章ID
   * @returns {Promise} 收藏结果
   */
  async collectArticle(articleId) {
    try {
      const res = await callFunction('collectArticle', { articleId });
      return res.result;
    } catch (err) {
      console.error('收藏文章失败:', err);
      throw err;
    }
  }

  /**
   * 取消收藏文章
   * @param {String} articleId - 文章ID
   * @returns {Promise} 取消收藏结果
   */
  async uncollectArticle(articleId) {
    try {
      const res = await callFunction('uncollectArticle', { articleId });
      return res.result;
    } catch (err) {
      console.error('取消收藏失败:', err);
      throw err;
    }
  }

  /**
   * 点赞文章
   * @param {String} articleId - 文章ID
   * @returns {Promise} 点赞结果
   */
  async likeArticle(articleId) {
    try {
      const res = await callFunction('likeArticle', { articleId });
      return res.result;
    } catch (err) {
      console.error('点赞文章失败:', err);
      throw err;
    }
  }

  /**
   * 取消点赞文章
   * @param {String} articleId - 文章ID
   * @returns {Promise} 取消点赞结果
   */
  async unlikeArticle(articleId) {
    try {
      const res = await callFunction('unlikeArticle', { articleId });
      return res.result;
    } catch (err) {
      console.error('取消收藏失败:', err);
      throw err;
    }
  }

  /**
   * 获取收藏列表
   * @param {Number} page - 页码
   * @param {Number} pageSize - 每页数量
   * @returns {Promise} 收藏列表
   */
  async getCollectionList(page = 1, pageSize = 10) {
    try {
      const res = await callFunction('getCollectionList', {
        page,
        pageSize
      });
      return res.result;
    } catch (err) {
      console.error('获取收藏列表失败:', err);
      throw err;
    }
  }

  /**
   * 搜索文章
   * @param {String} keyword - 关键词
   * @param {Number} page - 页码
   * @param {Number} pageSize - 每页数量
   * @returns {Promise} 搜索结果
   */
  async searchArticles(keyword, page = 1, pageSize = 10) {
    try {
      const result = await callFunction('searchArticles', {
        keyword,
        page,
        pageSize
      });
      return result;
    } catch (err) {
      console.error('搜索文章失败:', err);
      throw err;
    }
  }

  /**
   * 分享文章
   * @param {Object} article - 文章信息
   * @returns {Object} 分享配置
   */
  shareArticle(article) {
    return {
      title: article.title,
      path: `/pages/article/article?id=${article._id}`,
      imageUrl: article.coverImage || '/assets/images/share-default.png'
    };
  }
}

module.exports = new ArticleService();
