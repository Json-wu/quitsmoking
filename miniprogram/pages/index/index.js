// pages/index/index.js
const app = getApp();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    quitDays: 0,              // 戒烟天数
    quitDate: '',             // 开始戒烟日期
    targetDays: 365,          // 目标天数
    currentStreak: 0,         // 连续签到天数
    totalCheckin: 0,          // 累计签到天数
    hasCheckedToday: false,   // 今日是否已签到
    savedMoney: '0.00',       // 节省金额
    savedCigarettes: 0,       // 节省香烟数
    healthIndex: 0,           // 健康指数
    recommendArticles: [],    // 推荐文章
    showDatePicker: false,    // 显示日期选择器
    today: '',                // 今天日期
    userInfo: null            // 用户信息
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('首页加载');
    this.initPage();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    console.log('首页显示');
    this.refreshData();
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    console.log('下拉刷新');
    this.refreshData().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: `我已成功戒烟${this.data.quitDays}天，你也可以！`,
      path: '/pages/index/index',
      imageUrl: '/assets/images/share-bg.png'
    };
  },

  /**
   * 初始化页面
   */
  initPage() {
    // 设置今天日期
    const today = app.formatDate(new Date(), 'YYYY-MM-DD');
    this.setData({ today });

    // 检查登录状态
    if (!app.globalData.isLogin) {
      wx.showModal({
        title: '提示',
        content: '请先登录',
        showCancel: false,
        success: () => {
          // 等待登录完成
          setTimeout(() => {
            this.loadData();
          }, 1000);
        }
      });
    } else {
      this.loadData();
    }
  },

  /**
   * 加载数据
   */
  async loadData() {
    try {
      wx.showLoading({ title: '加载中...' });

      // 从全局数据获取
      const globalData = app.globalData;
      
      // 如果没有设置戒烟日期，显示设置弹窗
      if (!globalData.quitDate) {
        this.setData({ showDatePicker: true });
        wx.hideLoading();
        return;
      }

      // 计算戒烟天数
      const quitDays = app.calculateQuitDays(globalData.quitDate);
      
      // 计算健康收益
      const healthStats = this.calculateHealthStats(quitDays);

      // 更新页面数据
      this.setData({
        quitDays,
        quitDate: globalData.quitDate,
        currentStreak: globalData.currentStreak,
        totalCheckin: globalData.totalCheckin,
        hasCheckedToday: globalData.hasCheckedToday,
        userInfo: globalData.userInfo,
        ...healthStats
      });

      // 加载推荐文章
      await this.loadRecommendArticles();

    } catch (err) {
      console.error('加载数据失败:', err);
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
    try {
      // 刷新全局数据
      await app.loadUserData();
      
      // 重新加载页面数据
      await this.loadData();
      
      wx.showToast({
        title: '刷新成功',
        icon: 'success'
      });
    } catch (err) {
      console.error('刷新失败:', err);
    }
  },

  /**
   * 计算健康收益
   */
  calculateHealthStats(days) {
    const userInfo = app.globalData.userInfo;
    
    // 默认值
    const dailyCigarettes = userInfo?.dailyCigarettes || 20;
    const cigarettePrice = userInfo?.cigarettePrice || 15;
    const cigarettesPerPack = userInfo?.cigarettesPerPack || 20;

    // 计算节省香烟数
    const savedCigarettes = days * dailyCigarettes;
    
    // 计算节省金额
    const savedMoney = ((savedCigarettes / cigarettesPerPack) * cigarettePrice).toFixed(2);
    
    // 计算健康指数 (365天达到100%)
    const healthIndex = Math.min(100, Math.floor(days / 3.65));

    return {
      savedCigarettes,
      savedMoney,
      healthIndex
    };
  },

  /**
   * 加载推荐文章
   */
  async loadRecommendArticles() {
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'getArticles',
        data: {
          category: 'all',
          page: 1,
          pageSize: 3
        }
      });

      if (result.success) {
        this.setData({
          recommendArticles: result.articles
        });
      }
    } catch (err) {
      console.error('加载推荐文章失败:', err);
    }
  },

  /**
   * 处理签到
   */
  async handleCheckin() {
    if (this.data.hasCheckedToday) {
      wx.showToast({
        title: '今天已签到',
        icon: 'none'
      });
      return;
    }

    try {
      wx.showLoading({ title: '签到中...' });

      const { result } = await wx.cloud.callFunction({
        name: 'checkIn'
      });

      if (result.success) {
        // 更新数据
        this.setData({
          hasCheckedToday: true,
          currentStreak: result.continuousDays,
          totalCheckin: result.totalDays
        });

        // 更新全局数据
        app.globalData.hasCheckedToday = true;
        app.globalData.currentStreak = result.continuousDays;
        app.globalData.totalCheckin = result.totalDays;

        // 显示签到成功动画
        this.showCheckinSuccess(result);

        // 检查是否有新勋章
        if (result.newBadges && result.newBadges.length > 0) {
          this.showNewBadges(result.newBadges);
        }
      } else {
        wx.showToast({
          title: result.message || '签到失败',
          icon: 'none'
        });
      }
    } catch (err) {
      console.error('签到失败:', err);
      wx.showToast({
        title: '签到失败，请重试',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  /**
   * 显示签到成功动画
   */
  showCheckinSuccess(result) {
    wx.showToast({
      title: `签到成功！连续${result.continuousDays}天`,
      icon: 'success',
      duration: 2000
    });

    // TODO: 添加签到动画效果
  },

  /**
   * 显示新勋章
   */
  showNewBadges(badges) {
    const badgeNames = badges.map(b => b.name).join('、');
    wx.showModal({
      title: '🎉 恭喜解锁新勋章',
      content: `您获得了：${badgeNames}`,
      showCancel: false,
      confirmText: '太棒了'
    });
  },

  /**
   * 日期选择改变
   */
  onDateChange(e) {
    this.setData({
      quitDate: e.detail.value
    });
  },

  /**
   * 确认戒烟日期
   */
  async confirmQuitDate() {
    const { quitDate } = this.data;
    
    if (!quitDate) {
      wx.showToast({
        title: '请选择日期',
        icon: 'none'
      });
      return;
    }

    try {
      wx.showLoading({ title: '保存中...' });

      const { result } = await wx.cloud.callFunction({
        name: 'setQuitDate',
        data: { quitDate }
      });

      if (result.success) {
        // 更新全局数据
        app.globalData.quitDate = quitDate;
        
        // 关闭弹窗
        this.setData({ showDatePicker: false });
        
        // 重新加载数据
        await this.loadData();
        
        wx.showToast({
          title: '设置成功',
          icon: 'success'
        });
      } else {
        wx.showToast({
          title: result.message || '设置失败',
          icon: 'none'
        });
      }
    } catch (err) {
      console.error('设置戒烟日期失败:', err);
      wx.showToast({
        title: '设置失败，请重试',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  /**
   * 关闭日期选择器
   */
  closeDatePicker() {
    this.setData({ showDatePicker: false });
  },

  /**
   * 阻止冒泡
   */
  stopPropagation() {
    // 阻止事件冒泡
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
   * 跳转到电子烟页面
   */
  goToCigarette() {
    wx.switchTab({
      url: '/pages/cigarette/cigarette'
    });
  },

  /**
   * 跳转到拒烟神器
   */
  goToRefuse() {
    wx.navigateTo({
      url: '/pages/refuse/refuse'
    });
  },

  /**
   * 跳转到荣誉证书
   */
  goToCertificate() {
    wx.navigateTo({
      url: '/pages/certificate/certificate'
    });
  },

  /**
   * 跳转到戒烟方法
   */
  goToMethods() {
    wx.navigateTo({
      url: '/pages/methods/methods'
    });
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
