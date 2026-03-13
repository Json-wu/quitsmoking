// pages/index/index.js
const app = getApp();
const { getCanvasNode } = require('../../utils/canvas.js');

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
    showDatePicker: false,    // 显示日期选择器
    today: '',                // 今天日期
    todayDate: '',            // 今日日期显示（格式：2026-02-09）
    userInfo: null,           // 用户信息
    recentDays: [],           // 最近7天签到记录
    cigaretteProgress: 0,     // 电子烟进度
    todayCheckinCount: 10,  // 今日签到人数
    categories: {
      'scientific': '科学戒烟',
      'psychology': '心理调节',
      'lifestyle': '生活习惯',
      'coping': '应对技巧'
    },
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

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('首页加载');
    this.initPage();
    this.initReliefCanvas();
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
      title: `我已戒烟${this.data.quitDays}天，快来试试吧！`,
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
    // 荣誉证书显示开始戒烟日期
    const todayDate = app.globalData.quitDate || app.formatDate(new Date(), 'YYYY-MM-DD');
    this.setData({ today, todayDate });

    // 初始化最近7天数据
    this.initRecentDays();

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
      // 确保用户数据已加载
      if (!app.globalData.userInfo) {
        console.log('用户数据未加载，等待加载...');
        await app.loadUserData(false);
      }

      // 从全局数据获取
      const globalData = app.globalData;

      // 使用全局数据中的戒烟天数（由云函数基于戒烟开始日期计算）
      const quitDays = globalData.quitDays || 0;

      // 基于戒烟天数计算健康收益
      const healthStats = this.calculateHealthStats(quitDays);

      // 更新页面数据
      this.setData({
        quitDays: quitDays,
        quitDate: globalData.quitDate || app.formatDate(new Date(), 'YYYY-MM-DD'),
        currentStreak: globalData.currentStreak || 0,
        totalCheckin: globalData.totalCheckin || 0,
        hasCheckedToday: globalData.hasCheckedToday || false,
        userInfo: globalData.userInfo,
        cigaretteProgress: Math.min(100, (globalData.cigaretteCount || 0) * 10),
        ...healthStats
      });

      // 更新最近签到记录
      this.updateRecentDays();

      // 获取今日签到人数
      this.getTodayCheckinCount();

    } catch (err) {
      console.error('加载数据失败:', err);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
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

    const api = require('../../utils/api.js');
    try {
      wx.showLoading({ title: '签到中...' });

      const result = await api.checkIn({ openid: app.globalData.openid });

      if (result.success) {

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

        // 刷新首页数据
        await this.refreshData();

        // 显示签到成功动画
        this.showCheckinSuccess(result);
      } else {
        wx.showToast({
          title: result?.message || '签到失败',
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
      title: `签到成功！`,
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
   * 跳转到电子烟
   */
  goToCigarette() {
    wx.navigateTo({
      url: '/pages/cigarette-detail/cigarette-detail'
    });
  },

  /**
   * 跳转到戒烟阵营
   */
  goToCamp() {
    wx.navigateTo({
      url: '/pages/camp/camp'
    });
  },

  /**
   * 跳转到佛性戒烟页面
   */
  goToBuddhist() {
    console.log('跳转到佛性戒烟页面');
    wx.navigateTo({
      url: '/pages/buddhist/buddhist'
    });
  },

  /**
   * 跳转到呼吸训练页面
   */
  goToBreathing() {
    wx.navigateTo({
      url: '/pages/breathing/breathing'
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
   * 初始化最近7天数据
   */
  initRecentDays() {
    const recentDays = [];
    const today = new Date();
    const dayLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const day = date.getDate();
      const weekDay = date.getDay();
      const label = dayLabels[weekDay === 0 ? 6 : weekDay - 1];

      recentDays.push({
        day: String(day).padStart(2, '0'),
        label: label,
        checked: false
      });
    }

    this.setData({ recentDays });
  },

  /**
   * 更新最近签到记录
   */
  updateRecentDays() {
    // TODO: 从云函数获取最近7天的签到记录
    // 这里暂时使用模拟数据
    const recentDays = this.data.recentDays.map((item, index) => {
      // 假设最近3天已签到
      return {
        ...item,
        checked: index >= 4
      };
    });

    this.setData({ recentDays });
  },

  /**
   * 处理分享
   */
  handleShare() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline'],
      success: () => {
        wx.showToast({
          title: '请点击右上角分享',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },


  /**
   * 跳转到数据统计
   */
  goToProfile() {
    console.log('跳转到个人中心');
    wx.switchTab({
      url: '/pages/profile/profile'
    });
  },

  /**
   * 初始化缓解烟瘾区域的Canvas
   */
  async initReliefCanvas() {
    try {
      const { canvas, ctx, width, height } = await getCanvasNode('#relief-cigarette-canvas', this);
      this.reliefCanvas = canvas;
      this.reliefCtx = ctx;
      this.reliefCanvasWidth = width;
      this.reliefCanvasHeight = height;

      // 绘制点燃的香烟
      this.drawReliefCigarette();
    } catch (err) {
      console.error('缓解烟瘾Canvas初始化失败:', err);
    }
  },

  /**
   * 绘制缓解烟瘾区域的香烟
   */
  drawReliefCigarette() {
    const ctx = this.reliefCtx;
    const width = this.reliefCanvasWidth;
    const height = this.reliefCanvasHeight;

    if (!ctx) return;

    // 清空画布
    ctx.clearRect(0, 0, width, height);

    // 香烟参数（占满横向区域）
    const padding = 0;           // 左右留白（减少）
    const cigaretteLength = width - (padding * 2);  // 香烟总长度占满可用区域
    const cigaretteWidth = 36;    // 香烟粗度（继续增加）
    const filterLength = cigaretteLength * 0.2;  // 过滤嘴长度（占总长度20%）
    const ashLength = cigaretteLength * 0.001;    // 烟灰长度（占总长度8%）
    const fireWidth = 6;          // 火焰宽度

    // 计算起始位置（居中）
    const startX = padding;
    const startY = (height - cigaretteWidth) / 2;

    // 绘制烟灰（灰色，左端带圆角）
    const radius = cigaretteWidth / 20;
    ctx.fillStyle = '#A9A9A9';
    ctx.beginPath();
    ctx.arc(startX + radius, startY + radius, radius, Math.PI / 2, Math.PI * 1.5);
    ctx.lineTo(startX + ashLength, startY);
    ctx.lineTo(startX + ashLength, startY + cigaretteWidth);
    ctx.lineTo(startX + radius, startY + cigaretteWidth);
    ctx.closePath();
    ctx.fill();

    // 添加烟灰颗粒纹理
    for (let i = 0; i < ashLength; i += 2) {
      for (let j = 0; j < cigaretteWidth; j += 2) {
        if (Math.random() > 0.5) {
          const gray = Math.floor(Math.random() * 50 + 120);
          ctx.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
          ctx.fillRect(startX + i, startY + j, 2, 2);
        }
      }
    }

    // 绘制火焰（深红色）
    const fireX = startX + ashLength;
    ctx.fillStyle = '#8B0000';
    ctx.fillRect(fireX, startY, fireWidth, cigaretteWidth);

    // 火焰中心（鲜红色）
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(fireX + 1, startY, fireWidth - 2, cigaretteWidth);

    // 绘制未燃烧的烟身（白色）
    const bodyX = fireX + fireWidth;
    const bodyLength = cigaretteLength - filterLength - ashLength - fireWidth;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(bodyX, startY, bodyLength, cigaretteWidth);

    // 绘制烟身纹理（竖条纹）
    ctx.strokeStyle = '#636465ff';
    ctx.lineWidth = 0.8; // 更细的线条
    const stripeSpacing = 6; // 固定间距2px（更小）
    const stripeCount = Math.floor(bodyLength / stripeSpacing);
    for (let i = 0; i <= stripeCount; i++) {
      const x = bodyX + (i * stripeSpacing);
      if (x <= bodyX + bodyLength) {
        ctx.beginPath();
        ctx.moveTo(x, startY);
        ctx.lineTo(x, startY + cigaretteWidth);
        ctx.stroke();
      }
    }

    // 绘制过滤嘴（橙黄色）
    const filterX = startX + cigaretteLength - filterLength;
    ctx.fillStyle = '#FFB84D';
    ctx.fillRect(filterX, startY, filterLength, cigaretteWidth);

    // 绘制过滤嘴纹理（不规则金黄色圆点）
    ctx.fillStyle = '#E69500';
    const dotCount = Math.floor((filterLength * cigaretteWidth) / 20); // 根据面积计算圆点数量
    for (let i = 0; i < dotCount; i++) {
      const dotRadius = 0.5 + Math.random() * 1.5; // 随机半径0.5-2px
      // 确保圆点不超出过滤嘴边界
      const dotX = filterX + dotRadius + Math.random() * (filterLength - dotRadius * 2);
      const dotY = startY + dotRadius + Math.random() * (cigaretteWidth - dotRadius * 2);
      ctx.beginPath();
      ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  /**
   * 获取今日签到人数
   */
  async getTodayCheckinCount() {
    const api = require('../../utils/api.js');
    try {
      const result = await api.getTodayCheckinCount();

      if (result && result.success) {
        // 获取云函数返回的签到人数并+10
        const count = (result.count || 0) + 10;
        this.setData({
          todayCheckinCount: count
        });
      }
    } catch (err) {
      console.error('获取今日签到人数失败:', err);
      // 失败时保持默认值
       this.setData({
          todayCheckinCount: 9
        });
    }
  }
});
