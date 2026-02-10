// pages/profile/profile.js
const app = getApp();
const userService = require('../../services/user.js');

Page({
  data: {
    userInfo: {},
    badgeLevel: '初级戒烟者',
    quitDays: 0,
    savedCigarettes: 0,
    savedMoney: '0.00',
    healthIndex: 0,
    totalCheckin: app.globalData.totalCheckin || 0,
    cigaretteCount: 0,
    shareCount: 0,
    badgeCount: 0,
    totalBadges: 8,
    badges: [],
    showModal: false,
    modalClosing: false,
    dailyCigarettes: 20,
    cigarettePrice: 15,
    gameList: [
      { appId: 'wxd0e404d795ea6f80', name: '欢乐斗地主', icon: '/assets/images/ddz.jpeg' },
      { appId: 'wx375c80123d32f83f', name: '欢乐麻将', icon: '/assets/images/mj.jpeg' },
      { appId: 'wx4a0a73ec028e47d7', name: '王者荣耀', icon: '/assets/images/wz.jpeg' },
      { appId: 'wx17e1394849aa4de2', name: '和平精英', icon: '/assets/images/hpjy.jpeg' },
      { appId: 'wxd99f16d79f518160', name: '英雄联盟', icon: '/assets/images/lol.jpeg' },
      { appId: 'wx8d5601c84fff877d', name: '腾讯围棋', icon: '/assets/images/go.jpeg' },
      { appId: 'wx2f60a7b40f3828a9', name: '大惯蛋', icon: '/assets/images/gd.jpeg' },
      { appId: 'wx2f7fda52d8d031ee', name: '腾讯桌球', icon: '/assets/images/zq.jpeg' },
      { appId: 'wx507ad8f5f787f04c', name: '碳碳岛', icon: '/assets/images/ttd.jpeg' },
      { appId: 'wx9b673034f246b424', name: '乱世王者', icon: '/assets/images/lswz.jpeg' }
    ]
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
    const { quitDays, savedCigarettes, savedMoney } = this.data;
    return {
      title: `我已戒烟${quitDays}天，少抽${savedCigarettes}根烟，节省${savedMoney}元！一起加入戒烟吧！`,
      path: '/pages/index/index',
      imageUrl: '/assets/images/share-cover.jpg'
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
      const statsResult = await userService.getUserStats();

      // 获取勋章列表
      const badgesResult = await userService.getBadges();

      console.log('用户统计数据:', statsResult);
      console.log('勋章数据:', badgesResult);
      console.log('签到天数:', statsResult.totalCheckin);
      console.log('电子烟次数:', statsResult.cigaretteCount);
      console.log('送烟次数:', statsResult.shareCount);

      const totalCheckin = statsResult.totalCheckin || 0;

      // 计算勋章等级
      const badgeLevel = this.calculateBadgeLevel(statsResult.quitDays || globalData.quitDays || 0);

      // 初始化勋章数据
      const badges = this.initBadges(badgesResult.badges || [], totalCheckin);

      // 勋章数量：按累计签到天数自动解锁口径计算（与勋章页保持一致）
      const badgeCountByCheckin = badges.filter(b => b.unlocked).length;

      // 计算戒烟统计数据
      const quitDays = globalData.quitDays || 0;
      const healthStats = this.calculateHealthStats(quitDays);

      this.setData({
        userInfo: globalData.userInfo || {},
        badgeLevel,
        quitDays,
        savedCigarettes: healthStats.savedCigarettes,
        savedMoney: healthStats.savedMoney,
        healthIndex: healthStats.healthIndex,
        totalCheckin,
        cigaretteCount: statsResult.cigaretteCount || 0,
        shareCount: statsResult.shareCount || 0,
        badgeCount: badgeCountByCheckin,
        badges
      }, () => {
        console.log('页面数据已更新:', {
          quitDays: this.data.quitDays,
          totalCheckin: this.data.totalCheckin,
          cigaretteCount: this.data.cigaretteCount,
          shareCount: this.data.shareCount
        });
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
  },

  /**
   * 计算健康统计数据
   */
  calculateHealthStats(days) {
    // 从用户设置或默认值获取
    const dailyCigarettes = app.globalData.userInfo?.dailyCigarettes || this.data.dailyCigarettes || 20;
    const cigarettePrice = app.globalData.userInfo?.cigarettePrice || this.data.cigarettePrice || 15;
    const cigarettesPerPack = 20;

    const savedCigarettes = days * dailyCigarettes;
    const savedMoney = ((savedCigarettes / cigarettesPerPack) * cigarettePrice).toFixed(2);
    const healthIndex = Math.min(100, Math.floor((days / 365) * 100));

    return {
      savedCigarettes,
      savedMoney,
      healthIndex
    };
  },

  /**
   * 计算勋章等级
   */
  calculateBadgeLevel(days) {
    if (days >= 1095) return '传奇王者';
    if (days >= 730) return '傲视宗师';
    if (days >= 365) return '超凡大师';
    if (days >= 180) return '半年传奇';
    if (days >= 90) return '季度冠军';
    if (days >= 30) return '月度勇士';
    if (days >= 7) return '周度英雄';
    return '初级戒烟者';
  },

  /**
   * 初始化勋章数据
   */
  initBadges(unlockedBadges, totalCheckin) {
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

    return allBadges.map(badge => ({
      ...badge,
      unlocked: unlockedBadges.some(b => b.badgeType === badge.type) || (totalCheckin >= badge.days)
    }));
  },

  /**
   * 跳转到勋章详情
   */
  goToBadges() {
    wx.navigateTo({
      url: '/pages/badges/badges'
    });
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
      url: '/pages/methods/methods?source=collection'
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
    wx.showModal({
      title: '欢迎您联系我们',
      content: '邮箱地址：\nquitsmoking1@163.com\n\n微信ID：\nRiches_wu',
      showCancel: true,
      cancelText: '关闭',
      confirmText: '复制邮箱',
      success: (res) => {
        if (res.confirm) {
          wx.setClipboardData({
            data: 'quitsmoking1@163.com',
            success: () => {
              wx.showToast({
                title: '邮箱已复制',
                icon: 'success'
              });
            }
          });
        }
      }
    });
  },

  /**
   * 跳转到欢乐麻将
   */
  navigateToMahjong() {
    wx.navigateToMiniProgram({
      appId: 'wx375c80123d32f83f',
      path: '',
      extraData: {},
      envVersion: 'release',
      success: () => {
        console.log('跳转欢乐麻将成功');
      },
      fail: (err) => {
        console.error('跳转欢乐麻将失败:', err);
        wx.showToast({
          title: '跳转失败',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 跳转到欢乐斗地主小游戏
   */
  navigateToLandlord() {
    wx.navigateToMiniProgram({
      appId: 'wxd0e404d795ea6f80',
      path: '',
      extraData: {},
      envVersion: 'release',
      success: () => {
        console.log('跳转欢乐斗地主成功');
      },
      fail: (err) => {
        console.error('跳转欢乐斗地主失败:', err);
        wx.showToast({
          title: '跳转失败',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 显示编辑弹窗
   */
  showEditModal() {
    const dailyCigarettes = app.globalData.userInfo?.dailyCigarettes || 20;
    const cigarettePrice = app.globalData.userInfo?.cigarettePrice || 15;

    this.setData({
      showModal: true,
      dailyCigarettes,
      cigarettePrice
    });
  },

  /**
   * 隐藏编辑弹窗并保存
   */
  async hideEditModalWithSave() {
    // 先触发关闭动画
    this.setData({
      modalClosing: true
    });
    
    // 等待动画完成（300ms）
    setTimeout(async () => {
      await this.saveEditData();
      this.setData({
        modalClosing: false
      });
    }, 300);
  },

  /**
   * 隐藏编辑弹窗（不保存）
   */
  hideEditModal() {
    this.setData({
      showModal: false
    });
  },

  /**
   * 阻止事件冒泡
   */
  stopPropagation() {
    // 阻止点击弹窗内容时关闭弹窗
  },

  /**
   * 每日抽烟根数输入
   */
  onDailyCigarettesInput(e) {
    this.setData({
      dailyCigarettes: e.detail.value
    });
  },

  /**
   * 每包香烟价格输入
   */
  onCigarettePriceInput(e) {
    this.setData({
      cigarettePrice: e.detail.value
    });
  },

  /**
   * 保存编辑数据
   */
  async saveEditData() {
    const { dailyCigarettes, cigarettePrice } = this.data;

    try {
      const result = await wx.cloud.callFunction({
        name: 'updateSmokingData',
        data: {
          dailyCigarettes: Number(dailyCigarettes),
          cigarettePrice: Number(cigarettePrice)
        }
      });
      const healthStats = this.calculateHealthStats(this.data.quitDays);
      this.setData({
        savedCigarettes: healthStats.savedCigarettes,
        savedMoney: healthStats.savedMoney,
        showModal: false
      });

      if (result.result.success) {
        app.globalData.userInfo.dailyCigarettes = Number(dailyCigarettes);
        app.globalData.userInfo.cigarettePrice = Number(cigarettePrice);





        return true;
      } else {
        throw new Error(result.result.error || '保存失败');
      }
    } catch (err) {
      console.error('保存抽烟数据失败:', err);
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      });
      return false;
    }
  }
});
