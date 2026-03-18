// app.js
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
    isLogin: false               // 登录状态
  },

  /**
   * 小程序初始化
   */
  onLaunch() {
    console.log('小程序启动');
    
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
   * 检查登录状态
   */
  async checkLogin() {
    const api = require('./utils/api.js');
    
    try {
      // 先获取openid
      await this.getOpenIdForApi();
      if (!this.globalData.openid) {
        console.error('获取openid失败');
        wx.showToast({
          title: '登录失败，请重试',
          icon: 'none'
        });
        return;
      }

      // 调用API登录
      const res = await api.login({ openid: this.globalData.openid });

      console.log('login返回:', res);

      if (res && res.success) {
        this.globalData.openid = res.openid;
        this.globalData.isLogin = true;
        console.log('✓ 登录成功, openid:', res.openid);
        
        // 加载用户数据
        await this.loadUserData();
      } else {
        console.error('登录失败:', res);
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
  async loadUserData() {
    const api = require('./utils/api.js');
    try {
      const res = await api.getUserStats({ openid: this.globalData.openid });

      console.log('getUserStats返回:', res);

      if (res && res.success) {
        // 更新全局数据
        this.globalData.userInfo = {
          ...res.userInfo,
          dailyCigarettes: res.dailyCigarettes,
          cigarettePrice: res.cigarettePrice,
          cigarettesPerPack: res.cigarettesPerPack
        };
        this.globalData.quitDate = res.quitDate;
        this.globalData.quitDays = res.quitDays;
        this.globalData.currentStreak = res.continuousCheckin;
        this.globalData.totalCheckin = res.totalCheckin;
        this.globalData.hasCheckedToday = res.hasCheckedToday;
        this.globalData.makeUpCount = res.makeUpCount;

        console.log('用户数据加载成功', {
          dailyCigarettes: this.globalData.userInfo.dailyCigarettes,
          cigarettePrice: this.globalData.userInfo.cigarettePrice
        });
      } else {
        console.error('加载用户数据失败:', res?.message || '未知错误');
      }
    } catch (err) {
      console.error('加载用户数据异常:', err);
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
   * API模式下获取openid
   */
  async getOpenIdForApi() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: async (res) => {
          if (res.code) {
            console.log('wx.login成功，code:', res.code);
            try {
              // 调用后端接口换取openid
              const { getApiUrl } = require('./config/api.config.js');
              const url = getApiUrl('/auth/wxlogin');
              
              const result = await new Promise((resolve, reject) => {
                wx.request({
                  url,
                  method: 'POST',
                  data: { code: res.code },
                  header: { 'content-type': 'application/json' },
                  success: (res) => {
                    if (res.statusCode === 200 && res.data.success) {
                      resolve(res.data);
                    } else {
                      reject(res.data || { message: '登录失败' });
                    }
                  },
                  fail: reject
                });
              });

              if (result.openid) {
                this.globalData.openid = result.openid;
                console.log('✓ 获取openid成功:', result.openid);
                resolve(result.openid);
              } else {
                console.error('后端未返回openid');
                reject(new Error('未获取到openid'));
              }
            } catch (err) {
              console.error('换取openid失败:', err);
              reject(err);
            }
          } else {
            console.error('wx.login失败，未获取到code');
            reject(new Error('未获取到code'));
          }
        },
        fail: (err) => {
          console.error('wx.login调用失败:', err);
          reject(err);
        }
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
});
