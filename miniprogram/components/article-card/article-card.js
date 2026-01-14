// components/article-card/article-card.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    articleId: {
      type: String,
      value: ''
    },
    title: {
      type: String,
      value: ''
    },
    summary: {
      type: String,
      value: ''
    },
    coverImage: {
      type: String,
      value: ''
    },
    categoryName: {
      type: String,
      value: '其他'
    },
    viewCount: {
      type: Number,
      value: 0
    },
    likeCount: {
      type: Number,
      value: 0
    },
    isLiked: {
      type: Boolean,
      value: false
    },
    customClass: {
      type: String,
      value: ''
    }
  },

  /**
   * 组件的初始数据
   */
  data: {},

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 点击卡片
     */
    handleTap() {
      this.triggerEvent('tap', {
        articleId: this.properties.articleId
      });
    },

    /**
     * 点赞
     */
    handleLike(e) {
      this.triggerEvent('like', {
        articleId: this.properties.articleId,
        isLiked: this.properties.isLiked
      });
    }
  }
});
