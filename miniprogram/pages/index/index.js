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
    userInfo: null,            // 用户信息
    categories: {
      'scientific': '科学戒烟',
      'psychology': '心理调节',
      'lifestyle': '生活习惯',
      'coping': '应对技巧'
    },
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
  async initPage() {
    // 设置今天日期
    const today = app.formatDate(new Date(), 'YYYY-MM-DD');
    this.setData({ today });

    // 等待登录完成
    await this.waitForLogin();
    
    // 加载数据
    this.loadData();
  },

  /**
   * 等待登录完成
   */
  waitForLogin() {
    return new Promise((resolve) => {
      // 如果已经登录，直接返回
      if (app.globalData.isLogin) {
        resolve();
        return;
      }

      // 否则轮询等待登录完成，最多等待10秒
      let checkCount = 0;
      const maxChecks = 50; // 10秒 (50 * 200ms)
      
      const checkLogin = setInterval(() => {
        checkCount++;
        
        if (app.globalData.isLogin) {
          clearInterval(checkLogin);
          resolve();
        } else if (checkCount >= maxChecks) {
          // 超时后仍然继续，但不阻塞
          clearInterval(checkLogin);
          console.warn('等待登录超时，继续加载页面');
          resolve();
        }
      }, 200);
    });
  },

  /**
   * 加载数据
   */
  async loadData() {
    try {
      wx.showLoading({ title: '加载中...' });

      // 确保用户数据已加载
      if (!app.globalData.userInfo) {
        console.log('用户数据未加载，等待加载...');
        await app.loadUserData(false);
      }

      // 从全局数据获取
      const globalData = app.globalData;
      
      console.log('当前戒烟日期:', globalData.quitDate);
      
      // 如果没有设置戒烟日期，显示设置弹窗
      // 注意：现在默认会在注册时设置为当前日期，所以这个判断基本不会触发
      if (!globalData.quitDate) {
        console.log('未设置戒烟日期，显示设置弹窗');
        this.setData({ showDatePicker: true });
        wx.hideLoading();
        return;
      }

      // 使用全局数据中的戒烟天数（由云函数基于戒烟开始日期计算）
      const quitDays = globalData.quitDays || 0;
      
      // 基于戒烟天数计算健康收益
      const healthStats = this.calculateHealthStats(quitDays);

      // 更新页面数据
      this.setData({
        quitDays: quitDays,
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
      // 检查登录状态
      if (!app.globalData.isLogin) {
        console.log('未登录，等待登录完成...');
        await this.waitForLogin();
      }
      
      // 刷新全局数据
      await app.loadUserData(false);
      
      // 重新加载页面数据
      await this.loadData();
      
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
      const res = await wx.cloud.callFunction({
        name: 'getArticles',
        data: {
          category: 'all',
          page: 1,
          pageSize: 3
        }
      });

      console.log('getArticles云函数返回:', res);

      if (res.errMsg === 'cloud.callFunction:ok' && res.result) {
        this.setData({
          recommendArticles: res.result.articles || []
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

      const res = await wx.cloud.callFunction({
        name: 'checkIn'
      });

      console.log('checkIn云函数返回:', res);

      if (res.errMsg === 'cloud.callFunction:ok' && res.result) {
        const result = res.result;
        
        // 签到成功，更新签到相关数据
        this.setData({
          hasCheckedToday: true,
          currentStreak: result.continuousDays,
          totalCheckin: result.totalDays
        });

        // 更新全局数据
        app.globalData.hasCheckedToday = true;
        app.globalData.currentStreak = result.continuousDays;
        app.globalData.totalCheckin = result.totalDays;

        // 戒烟天数基于戒烟开始日期计算，不受签到影响
        // 无需更新 quitDays 和健康收益数据

        // 显示签到成功动画
        this.showCheckinSuccess(result);

        // 检查是否有新勋章
        if (result.newBadges && result.newBadges.length > 0) {
          this.showNewBadges(result.newBadges);
        }
      } else {
        wx.showToast({
          title: res.result?.message || '签到失败',
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

      const result = await wx.cloud.callFunction({
        name: 'setQuitDate',
        data: { quitDate }
      });

      console.log('setQuitDate云函数返回:', result);

      if (result.errMsg === 'cloud.callFunction:ok') {
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
