// pages/profile/profile.js
const app = getApp();
const userService = require('../../services/user.js');

Page({
  data: {
    userInfo: {},
    badgeLevel: '初级戒烟者',
    totalCheckin: app.globalData.totalCheckin || 0,
    cigaretteCount: 0,
    shareCount: 0,
    badgeCount: 0,
    totalBadges: 6,
    badges: []
  },

  onLoad(options) {
    this.loadUserData();
  },

  onShow() {
    this.refreshData();
  },

  onPullDownRefresh() {
    this.refreshData().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  onShareAppMessage() {
    return {
      title: '我要戒烟 - 健康生活从戒烟开始',
      path: '/pages/index/index'
    };
  },

  /**
   * 加载用户数据
   */
  async loadUserData() {
    try {
      wx.showLoading({ title: '加载中...' });

      // 获取全局用户信息
      const globalData = app.globalData;
      
      // 获取用户统计
      const statsResponse = await userService.getUserStats();
      const statsResult = statsResponse.result || {};
      
      // 获取勋章列表
      const badgesResponse = await userService.getBadges();
      const badgesResult = badgesResponse.result || {};

      console.log('用户统计数据:', statsResult);
      console.log('勋章数据:', badgesResult);

      // 计算勋章等级
      const badgeLevel = this.calculateBadgeLevel(statsResult.quitDays || globalData.quitDays || 0);

      // 初始化勋章数据
      const badges = this.initBadges(badgesResult.badges || []);

      this.setData({
        userInfo: globalData.userInfo || {},
        badgeLevel,
        cigaretteCount: statsResult.cigaretteCount || 0,
        shareCount: statsResult.shareCount || 0,
        badgeCount: badgesResult.badges?.length || 0,
        badges
      });

    } catch (err) {
      console.error('加载用户数据失败:', err);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  /**
   * 刷新数据
   */
  async refreshData() {
    await this.loadUserData();
    wx.showToast({
      title: '刷新成功',
      icon: 'success'
    });
  },

  /**
   * 计算勋章等级
   */
  calculateBadgeLevel(days) {
    if (days >= 365) return '年度王者';
    if (days >= 180) return '半年传奇';
    if (days >= 90) return '季度冠军';
    if (days >= 30) return '月度勇士';
    if (days >= 7) return '周度英雄';
    return '初级戒烟者';
  },

  /**
   * 初始化勋章数据
   */
  initBadges(unlockedBadges) {
    const allBadges = [
      { type: 'week_hero', name: '周度英雄', icon: '🏅', days: 7 },
      { type: 'month_warrior', name: '月度勇士', icon: '🥉', days: 30 },
      { type: 'bimonth_hero', name: '双月英雄', icon: '🥈', days: 60 },
      { type: 'quarter_champion', name: '季度冠军', icon: '🥇', days: 90 },
      { type: 'halfyear_legend', name: '半年传奇', icon: '🏆', days: 180 },
      { type: 'year_king', name: '年度王者', icon: '👑', days: 365 }
    ];

    return allBadges.map(badge => ({
      ...badge,
      unlocked: unlockedBadges.some(b => b.badgeType === badge.type)
    }));
  },

  /**
   * 跳转到我的证书
   */
  goToCertificate() {
    wx.navigateTo({
      url: '/pages/certificate/certificate'
    });
  },

  /**
   * 跳转到我的收藏
   */
  goToCollection() {
    wx.navigateTo({
      url: '/pages/collection/collection'
    });
  },

  /**
   * 跳转到签到日历
   */
  goToCalendar() {
    wx.navigateTo({
      url: '/pages/calendar/calendar'
    });
  },

  /**
   * 跳转到设置中心
   */
  goToSettings() {
    wx.navigateTo({
      url: '/pages/settings/settings'
    });
  },

  /**
   * 跳转到关于我们
   */
  goToAbout() {
    wx.navigateTo({
      url: '/pages/about/about'
    });
  },

  /**
   * 意见反馈
   */
  handleFeedback() {
    wx.navigateTo({
      url: 'plugin-private://wx8abaf00ee8c3202e/pages/feedback/feedback'
    });
  }
});
