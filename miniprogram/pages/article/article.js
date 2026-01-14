// pages/article/article.js
const articleService = require('../../services/article.js');
const { formatDate } = require('../../utils/date.js');

Page({
  data: {
    articleId: '',
    article: {
      title: '',
      content: '',
      coverImage: '',
      categoryName: '',
      publishDate: '',
      viewCount: 0,
      likeCount: 0,
      collectCount: 0,
      isLiked: false,
      isCollected: false,
      tags: []
    },
    relatedArticles: []
  },

  onLoad(options) {
    const { id } = options;
    if (!id) {
      wx.showToast({
        title: '文章不存在',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }

    this.setData({ articleId: id });
    this.loadArticle();
  },

  onShareAppMessage() {
    return articleService.shareArticle(
      this.data.articleId,
      this.data.article.title
    );
  },

  /**
   * 加载文章详情
   */
  async loadArticle() {
    try {
      wx.showLoading({ title: '加载中...' });

      const result = await articleService.getArticleDetail(this.data.articleId);

      if (result.success) {
        const article = {
          ...result.article,
          publishDate: formatDate(new Date(result.article.createTime), 'YYYY-MM-DD'),
          categoryName: this.getCategoryName(result.article.category)
        };

        this.setData({
          article,
          relatedArticles: result.relatedArticles || []
        });
      } else {
        wx.showToast({
          title: result.message || '加载失败',
          icon: 'none'
        });
      }
    } catch (err) {
      console.error('加载文章失败:', err);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  /**
   * 获取分类名称
   */
  getCategoryName(categoryId) {
    const categories = {
      'scientific': '科学戒烟',
      'psychological': '心理调节',
      'lifestyle': '生活习惯',
      'skills': '应对技巧'
    };
    return categories[categoryId] || '其他';
  },

  /**
   * 点赞文章
   */
  async handleLike() {
    try {
      const result = await articleService.likeArticle(this.data.articleId);

      if (result.success) {
        this.setData({
          'article.isLiked': !this.data.article.isLiked,
          'article.likeCount': this.data.article.isLiked 
            ? this.data.article.likeCount - 1 
            : this.data.article.likeCount + 1
        });

        wx.showToast({
          title: this.data.article.isLiked ? '点赞成功' : '取消点赞',
          icon: 'success'
        });
      }
    } catch (err) {
      console.error('点赞失败:', err);
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      });
    }
  },

  /**
   * 收藏文章
   */
  async handleCollect() {
    try {
      const isCollected = this.data.article.isCollected;
      const result = isCollected 
        ? await articleService.cancelCollectArticle(this.data.articleId)
        : await articleService.collectArticle(this.data.articleId);

      if (result.success) {
        this.setData({
          'article.isCollected': !isCollected,
          'article.collectCount': isCollected 
            ? this.data.article.collectCount - 1 
            : this.data.article.collectCount + 1
        });

        wx.showToast({
          title: isCollected ? '取消收藏' : '收藏成功',
          icon: 'success'
        });
      }
    } catch (err) {
      console.error('收藏失败:', err);
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      });
    }
  },

  /**
   * 跳转到文章详情
   */
  goToArticle(e) {
    const { id } = e.currentTarget.dataset;
    wx.redirectTo({
      url: `/pages/article/article?id=${id}`
    });
  }
});
