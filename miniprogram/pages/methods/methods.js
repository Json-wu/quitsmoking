// pages/methods/methods.js
const articleService = require('../../services/article.js');

Page({
  data: {
    currentCategory: 'all',
    categories: [
      { id: 'all', name: '全部' },
      { id: 'scientific', name: '科学戒烟' },
      { id: 'psychology', name: '心理调节' },
      { id: 'lifestyle', name: '生活习惯' },
      { id: 'coping', name: '应对技巧' }
    ],
    articles: [],
    page: 1,
    pageSize: 10,
    loading: false,
    noMore: false
  },

  onLoad(options) {
    this.loadArticles();
  },

  onPullDownRefresh() {
    this.refreshArticles();
  },

  onReachBottom() {
    this.loadMoreArticles();
  },

  onShareAppMessage() {
    return {
      title: '戒烟方法大全 - 科学戒烟从这里开始',
      path: '/pages/methods/methods'
    };
  },

  /**
   * 切换分类
   */
  onCategoryChange(e) {
    const { id } = e.currentTarget.dataset;
    if (id === this.data.currentCategory) return;

    this.setData({
      currentCategory: id,
      articles: [],
      page: 1,
      noMore: false
    });

    this.loadArticles();
  },

  /**
   * 加载文章列表
   */
  async loadArticles() {
    if (this.data.loading) return;

    try {
      this.setData({ loading: true });

      console.log('加载文章，分类:', this.data.currentCategory, '页码:', this.data.page);

      const result = await articleService.getArticleList({
        category: this.data.currentCategory,
        page: this.data.page,
        pageSize: this.data.pageSize
      });

      console.log('文章加载结果:', result);

      if (result.success) {
        const articles = result.articles.map(item => ({
          ...item,
          categoryName: this.getCategoryName(item.category)
        }));

        console.log('处理后的文章列表:', articles);

        this.setData({
          articles: this.data.page === 1 ? articles : [...this.data.articles, ...articles],
          noMore: articles.length < this.data.pageSize
        });

        if (articles.length === 0 && this.data.page === 1) {
          wx.showToast({
            title: '暂无文章数据',
            icon: 'none'
          });
        }
      } else {
        wx.showToast({
          title: result.message || '加载失败',
          icon: 'none'
        });
      }
    } catch (err) {
      console.error('加载文章失败:', err);
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 刷新文章列表
   */
  async refreshArticles() {
    this.setData({
      articles: [],
      page: 1,
      noMore: false
    });

    await this.loadArticles();
    wx.stopPullDownRefresh();
  },

  /**
   * 加载更多文章
   */
  async loadMoreArticles() {
    if (this.data.loading || this.data.noMore) return;

    this.setData({
      page: this.data.page + 1
    });

    await this.loadArticles();
  },

  /**
   * 获取分类名称
   */
  getCategoryName(categoryId) {
    const category = this.data.categories.find(c => c.id === categoryId);
    return category ? category.name : '其他';
  },

  /**
   * 点赞/取消点赞文章
   */
  async handleLike(e) {
    const { id } = e.currentTarget.dataset;
    
    // 找到当前文章
    const article = this.data.articles.find(item => item._id === id);
    if (!article) return;

    try {
      let result;
      
      // 根据当前状态调用不同的接口
      if (article.isLiked) {
        result = await articleService.unlikeArticle(id);
      } else {
        result = await articleService.likeArticle(id);
      }
      
      if (result.success) {
        // 更新文章列表中的点赞状态
        const articles = this.data.articles.map(item => {
          if (item._id === id) {
            return {
              ...item,
              isLiked: !item.isLiked,
              likeCount: item.isLiked ? item.likeCount - 1 : item.likeCount + 1
            };
          }
          return item;
        });

        this.setData({ articles });

        wx.showToast({
          title: result.message || '操作成功',
          icon: 'success',
          duration: 1500
        });
      } else {
        wx.showToast({
          title: result.message || '操作失败',
          icon: 'none'
        });
      }
    } catch (err) {
      console.error('点赞操作失败:', err);
      wx.showToast({
        title: '操作失败，请重试',
        icon: 'none'
      });
    }
  },

  /**
   * 跳转到文章详情
   */
  goToArticle(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/article/article?id=${id}`
    });
  }
});
