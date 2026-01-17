// pages/badges/badges.js
const app = getApp();
const userService = require('../../services/user.js');

Page({
  data: {
    badges: [],
    quitDays: 0,
    unlockedCount: 0,
    totalCount: 8
  },

  onLoad(options) {
    this.loadBadgesData();
  },

  onShow() {
    this.loadBadgesData();
  },

  /**
   * 加载勋章数据
   */
  async loadBadgesData() {
    try {
      wx.showLoading({ title: '加载中...' });

      // 获取全局数据
      const globalData = app.globalData;
      const quitDays = globalData.quitDays || 0;

      console.log('当前戒烟天数:', quitDays);

      let unlockedBadges = [];
      
      try {
        // 获取已解锁的勋章
        const badgesResult = await userService.getBadges();
        unlockedBadges = badgesResult.badges || [];
        console.log('已解锁勋章:', unlockedBadges);
      } catch (badgeErr) {
        console.error('获取勋章失败，将显示所有勋章为未解锁状态:', badgeErr);
      }

      // 初始化所有勋章配置（即使没有获取到已解锁勋章，也要显示所有勋章）
      const allBadges = this.initAllBadges(unlockedBadges, quitDays);

      console.log('所有勋章数据:', allBadges);
      console.log('勋章总数:', allBadges.length);

      // 计算已解锁数量
      const unlockedCount = allBadges.filter(b => b.unlocked).length;

      this.setData({
        badges: allBadges,
        quitDays,
        unlockedCount,
        totalCount: allBadges.length
      }, () => {
        console.log('页面数据已更新，勋章数量:', this.data.badges.length);
      });

    } catch (err) {
      console.error('加载勋章数据失败:', err);
      
      // 即使出错，也显示所有勋章（未解锁状态）
      const allBadges = this.initAllBadges([], 0);
      this.setData({
        badges: allBadges,
        quitDays: 0,
        unlockedCount: 0,
        totalCount: allBadges.length
      });
      
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  /**
   * 初始化所有勋章
   */
  initAllBadges(unlockedBadges, quitDays) {
    const allBadges = [
      { type: 'week_hero', name: '周度英雄', icon: '🏅', days: 7 },
      { type: 'month_warrior', name: '月度勇士', icon: '🥉', days: 30 },
      { type: 'bimonth_hero', name: '双月英雄', icon: '🥈', days: 60 },
      { type: 'quarter_champion', name: '季度冠军', icon: '🥇', days: 90 },
      { type: 'halfyear_legend', name: '半年传奇', icon: '🏆', days: 180 },
      { type: 'year_king', name: '超凡大师', icon: '👑', days: 365 },
      { type: 'twoyear_legend', name: '傲视宗师', icon: '⭐', days: 730 },
      { type: 'threeyear_legend', name: '传奇王者', icon: '⭐', days: 1095 }
    ];

    return allBadges.map(badge => {
      const unlockedBadge = unlockedBadges.find(b => b.badgeType === badge.type);
      return {
        ...badge,
        unlocked: !!unlockedBadge,
        unlockDate: unlockedBadge ? this.formatDate(unlockedBadge.unlockTime) : null
      };
    });
  },

  /**
   * 格式化日期
   */
  formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadBadgesData().then(() => {
      wx.stopPullDownRefresh();
    });
  }
});
