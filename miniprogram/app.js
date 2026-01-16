// app.js
const dbInit = require('./utils/dbInit');

App({
  /**
   * 全局数据
   */
  globalData: {
    userInfo: null,              // 用户信息
    openid: null,                // 用户openid
    quitDate: null,              // 开始戒烟日期
    quitDays: 0,                 // 戒烟天数
    currentStreak: 0,            // 连续签到天数
    totalCheckin: 0,             // 累计签到天数
    hasCheckedToday: false,      // 今日是否已签到
    makeUpCount: 3,              // 剩余补签次数
    isLogin: false,              // 登录状态
    cloudEnvId: 'cloud1-5g9hlytr7a58a6f7',    // 云开发环境ID
    dbInitialized: true         // 数据库是否已初始化
  },

  /**
   * 小程序初始化
   */
  onLaunch() {
    console.log('小程序启动');
    
    // 初始化云开发
    this.initCloud();
    
    // 检查数据库
    this.checkDatabase();
    
    // 检查登录状态
    this.checkLogin();
    
    // 初始化广告
    this.initAd();
    
    // 检查更新
    this.checkUpdate();
  },

  /**
   * 小程序显示
   */
  onShow() {
    console.log('小程序显示');
    
    // 刷新用户数据
    if (this.globalData.isLogin) {
      this.loadUserData();
    }
  },

  /**
   * 初始化云开发
   */
  initCloud() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
      wx.showModal({
        title: '提示',
        content: '当前微信版本过低，无法使用该功能，请升级到最新微信版本后重试。',
        showCancel: false
      });
      return;
    }

    wx.cloud.init({
      env: this.globalData.cloudEnvId,
      traceUser: true
    });

    console.log('云开发初始化成功');
  },

  /**
   * 检查数据库集合
   */
  async checkDatabase() {
    try {
      console.log('开始检查数据库集合...');
      
      // 检查数据库集合是否存在（不显示弹窗）
      const isInitialized = await dbInit.initDBCheck(false);
      this.globalData.dbInitialized = isInitialized;
      
      if (!isInitialized) {
        console.warn('数据库未完全初始化，尝试自动初始化...');
        
        // 尝试调用云函数自动初始化数据库
        try {
          const res = await wx.cloud.callFunction({
            name: 'initDB'
          });
          
          console.log('数据库初始化结果:', res);
          
          if (res.errMsg === 'cloud.callFunction:ok' && res.result?.success) {
            this.globalData.dbInitialized = true;
            console.log('✓ 数据库自动初始化成功');
            
            wx.showToast({
              title: '数据库初始化成功',
              icon: 'success'
            });
          } else {
            console.error('数据库初始化失败:', res.result);
            this.showDBInitError();
          }
        } catch (err) {
          console.error('调用数据库初始化云函数失败:', err);
          this.showDBInitError();
        }
      } else {
        console.log('✓ 数据库检查通过');
      }
    } catch (err) {
      console.error('数据库检查异常:', err);
    }
  },

  /**
   * 显示数据库初始化错误
   */
  showDBInitError() {
    wx.showModal({
      title: '数据库未初始化',
      content: '数据库集合未创建或初始化失败。\n\n请联系管理员在云开发控制台创建必需的数据库集合，或部署并运行 initDB 云函数。',
      showCancel: false,
      confirmText: '我知道了'
    });
  },

  /**
   * 检查登录状态
   */
  async checkLogin() {
    try {
      // 调用云函数登录
      const res = await wx.cloud.callFunction({
        name: 'login'
      });

      console.log('login云函数返回:', res);

      if (!res.result) {
        console.error('登录失败: 云函数返回结果为空，请检查云函数是否已部署');
        this.showLoginError();
        return;
      }

      const { result } = res;

      if (res.errMsg === 'cloud.callFunction:ok') {
        this.globalData.openid = result.openid;
        this.globalData.isLogin = true;
        console.log('登录成功, openid:', result.openid);
        
        // 加载用户数据
        await this.loadUserData();
      } else {
        console.error('登录失败:', result.message || '未知错误');
        this.showLoginError();
      }
    } catch (err) {
      console.error('登录异常:', err);
      this.showLoginError();
    }
  },

  /**
   * 加载用户数据
   */
  async loadUserData(showLoading = true) {
    try {
      if (showLoading) {
        wx.showLoading({ title: '加载中...' });
      }

      const res = await wx.cloud.callFunction({
        name: 'getUserStats'
      });

      console.log('getUserStats云函数返回:', res);

      if (!res.result) {
        console.error('加载用户数据失败: 云函数返回结果为空，请检查云函数是否已部署');
        return;
      }

      const { result } = res;

      if (res.errMsg === 'cloud.callFunction:ok') {
        // 更新全局数据
        this.globalData.userInfo = result.userInfo;
        this.globalData.quitDate = result.quitDate;
        this.globalData.quitDays = result.quitDays;
        this.globalData.currentStreak = result.continuousCheckin;
        this.globalData.totalCheckin = result.totalCheckin;
        this.globalData.hasCheckedToday = result.hasCheckedToday;
        this.globalData.makeUpCount = result.makeUpCount;

        console.log('用户数据加载成功');
      } else {
        console.error('加载用户数据失败:', result.message || '未知错误');
      }
    } catch (err) {
      console.error('加载用户数据异常:', err);
    } finally {
      if (showLoading) {
        wx.hideLoading();
      }
    }
  },

  /**
   * 初始化广告
   */
  initAd() {
    // 预加载激励视频广告
    if (wx.createRewardedVideoAd) {
      this.rewardedVideoAd = wx.createRewardedVideoAd({
        adUnitId: 'adunit-xxxxxxxxxxxxxxxx' // 替换为真实的广告单元ID
      });

      // 监听广告加载
      this.rewardedVideoAd.onLoad(() => {
        console.log('激励视频广告加载成功');
      });

      // 监听广告错误
      this.rewardedVideoAd.onError((err) => {
        console.error('激励视频广告加载失败', err);
      });
    }
  },

  /**
   * 检查小程序更新
   */
  checkUpdate() {
    const updateManager = wx.getUpdateManager();

    updateManager.onCheckForUpdate((res) => {
      if (res.hasUpdate) {
        console.log('发现新版本');
      }
    });

    updateManager.onUpdateReady(() => {
      wx.showModal({
        title: '更新提示',
        content: '新版本已经准备好，是否重启应用？',
        success: (res) => {
          if (res.confirm) {
            updateManager.applyUpdate();
          }
        }
      });
    });

    updateManager.onUpdateFailed(() => {
      console.error('新版本下载失败');
    });
  },

  /**
   * 显示登录错误
   */
  showLoginError() {
    wx.showModal({
      title: '登录失败',
      content: '无法连接服务器，请检查网络后重试',
      confirmText: '重试',
      success: (res) => {
        if (res.confirm) {
          this.checkLogin();
        }
      }
    });
  },

  /**
   * 计算戒烟天数
   * @param {String} quitDate - 开始戒烟日期 (YYYY-MM-DD)
   * @returns {Number} 戒烟天数
   */
  calculateQuitDays(quitDate) {
    if (!quitDate) return 0;
    
    const start = new Date(quitDate);
    const today = new Date();
    const diffTime = today.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays >= 0 ? diffDays : 0;
  },

  /**
   * 检查今日签到状态
   * @returns {Boolean} 是否已签到
   */
  checkTodayCheckin() {
    return this.globalData.hasCheckedToday;
  },

  /**
   * 刷新签到状态
   */
  async refreshCheckinStatus() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'getUserStats'
      });

      console.log('refreshCheckinStatus云函数返回:', res);

      if (res.errMsg === 'cloud.callFunction:ok' && res.result) {
        const result = res.result;
        this.globalData.hasCheckedToday = result.hasCheckedToday;
        this.globalData.currentStreak = result.continuousCheckin;
        this.globalData.totalCheckin = result.totalCheckin;
        return result.hasCheckedToday;
      }
    } catch (err) {
      console.error('刷新签到状态失败:', err);
    }
    return false;
  },

  /**
   * 播放激励视频广告
   * @returns {Promise} 广告播放结果
   */
  showRewardedVideoAd() {
    return new Promise((resolve, reject) => {
      if (!this.rewardedVideoAd) {
        reject(new Error('广告组件未初始化'));
        return;
      }

      // 监听广告关闭
      const closeHandler = (res) => {
        if (res && res.isEnded) {
          resolve();
        } else {
          reject(new Error('广告未播放完成'));
        }
        this.rewardedVideoAd.offClose(closeHandler);
      };

      this.rewardedVideoAd.onClose(closeHandler);

      // 显示广告
      this.rewardedVideoAd.show().catch(() => {
        // 广告加载失败，重新加载
        this.rewardedVideoAd.load()
          .then(() => this.rewardedVideoAd.show())
          .catch((err) => {
            console.error('广告加载失败', err);
            reject(err);
          });
      });
    });
  },

  /**
   * 格式化日期
   * @param {Date|String} date - 日期对象或字符串
   * @param {String} format - 格式化模板
   * @returns {String} 格式化后的日期字符串
   */
  formatDate(date, format = 'YYYY-MM-DD') {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hour = String(d.getHours()).padStart(2, '0');
    const minute = String(d.getMinutes()).padStart(2, '0');
    const second = String(d.getSeconds()).padStart(2, '0');

    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hour)
      .replace('mm', minute)
      .replace('ss', second);
  },

  /**
   * 显示Toast提示
   * @param {String} title - 提示文字
   * @param {String} icon - 图标类型
   */
  showToast(title, icon = 'none') {
    wx.showToast({
      title,
      icon,
      duration: 2000
    });
  },

  /**
   * 显示加载中
   * @param {String} title - 提示文字
   */
  showLoading(title = '加载中...') {
    wx.showLoading({
      title,
      mask: true
    });
  },

  /**
   * 隐藏加载
   */
  hideLoading() {
    wx.hideLoading();
  }
});
