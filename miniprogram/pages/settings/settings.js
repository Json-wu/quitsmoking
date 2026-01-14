// pages/settings/settings.js
const app = getApp();
const userService = require('../../services/user.js');
const { formatDate } = require('../../utils/date.js');
const { getStorageSync, setStorageSync, clearStorage, getStorageInfo } = require('../../utils/storage.js');

Page({
  data: {
    quitDate: '',
    dailyCigarettes: 20,
    cigarettePrice: 15,
    checkinReminder: true,
    reminderTime: '09:00',
    showInRanking: true,
    publicData: true,
    cacheSize: '0KB',
    version: '1.0.0',
    showDatePicker: false,
    tempQuitDate: '',
    today: ''
  },

  onLoad(options) {
    this.loadSettings();
    this.calculateCacheSize();
    
    const today = formatDate(new Date(), 'YYYY-MM-DD');
    this.setData({ today });
  },

  /**
   * 加载设置
   */
  loadSettings() {
    const globalData = app.globalData;
    const userSettings = getStorageSync('userSettings') || {};

    this.setData({
      quitDate: globalData.quitDate ? formatDate(new Date(globalData.quitDate), 'YYYY-MM-DD') : '未设置',
      dailyCigarettes: userSettings.dailyCigarettes || 20,
      cigarettePrice: userSettings.cigarettePrice || 15,
      checkinReminder: userSettings.checkinReminder !== false,
      reminderTime: userSettings.reminderTime || '09:00',
      showInRanking: userSettings.showInRanking !== false,
      publicData: userSettings.publicData !== false
    });
  },

  /**
   * 计算缓存大小
   */
  async calculateCacheSize() {
    try {
      const info = await getStorageInfo();
      const sizeKB = (info.currentSize || 0);
      const sizeMB = (sizeKB / 1024).toFixed(2);
      
      this.setData({
        cacheSize: sizeKB > 1024 ? `${sizeMB}MB` : `${sizeKB}KB`
      });
    } catch (err) {
      console.error('获取缓存大小失败:', err);
    }
  },

  /**
   * 戒烟日期设置
   */
  handleQuitDateSetting() {
    this.setData({
      showDatePicker: true,
      tempQuitDate: this.data.quitDate === '未设置' 
        ? formatDate(new Date(), 'YYYY-MM-DD') 
        : this.data.quitDate
    });
  },

  /**
   * 日期选择
   */
  onQuitDateChange(e) {
    this.setData({
      tempQuitDate: e.detail.value
    });
  },

  /**
   * 确认戒烟日期
   */
  async confirmQuitDate() {
    try {
      wx.showLoading({ title: '设置中...' });

      const result = await userService.setQuitDate(this.data.tempQuitDate);

      if (result.success) {
        app.globalData.quitDate = this.data.tempQuitDate;
        this.setData({
          quitDate: this.data.tempQuitDate,
          showDatePicker: false
        });

        wx.showToast({
          title: '设置成功',
          icon: 'success'
        });
      }
    } catch (err) {
      console.error('设置失败:', err);
      wx.showToast({
        title: '设置失败',
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
    this.setData({
      showDatePicker: false
    });
  },

  /**
   * 每日吸烟量输入
   */
  onDailyCigarettesInput(e) {
    this.setData({
      dailyCigarettes: e.detail.value
    });
  },

  /**
   * 香烟价格输入
   */
  onCigarettePriceInput(e) {
    this.setData({
      cigarettePrice: e.detail.value
    });
  },

  /**
   * 签到提醒开关
   */
  onCheckinReminderChange(e) {
    this.setData({
      checkinReminder: e.detail.value
    });
  },

  /**
   * 提醒时间选择
   */
  onReminderTimeChange(e) {
    this.setData({
      reminderTime: e.detail.value
    });
  },

  /**
   * 排行榜显示开关
   */
  onShowInRankingChange(e) {
    this.setData({
      showInRanking: e.detail.value
    });
  },

  /**
   * 公开数据开关
   */
  onPublicDataChange(e) {
    this.setData({
      publicData: e.detail.value
    });
  },

  /**
   * 清除缓存
   */
  handleClearCache() {
    wx.showModal({
      title: '提示',
      content: '确定要清除缓存吗？',
      success: (res) => {
        if (res.confirm) {
          try {
            clearStorage();
            this.setData({
              cacheSize: '0KB'
            });
            wx.showToast({
              title: '清除成功',
              icon: 'success'
            });
          } catch (err) {
            console.error('清除缓存失败:', err);
            wx.showToast({
              title: '清除失败',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  /**
   * 检查更新
   */
  handleCheckUpdate() {
    const updateManager = wx.getUpdateManager();

    updateManager.onCheckForUpdate((res) => {
      if (res.hasUpdate) {
        wx.showModal({
          title: '更新提示',
          content: '新版本已经准备好，是否重启应用？',
          success: (res) => {
            if (res.confirm) {
              updateManager.applyUpdate();
            }
          }
        });
      } else {
        wx.showToast({
          title: '已是最新版本',
          icon: 'success'
        });
      }
    });

    updateManager.onUpdateFailed(() => {
      wx.showToast({
        title: '更新失败',
        icon: 'none'
      });
    });
  },

  /**
   * 关于我们
   */
  handleAbout() {
    wx.showModal({
      title: '关于我们',
      content: '我要戒烟小程序\n版本：1.0.0\n\n帮助您科学戒烟，重获健康生活！',
      showCancel: false
    });
  },

  /**
   * 保存设置
   */
  async handleSave() {
    try {
      wx.showLoading({ title: '保存中...' });

      const settings = {
        dailyCigarettes: parseInt(this.data.dailyCigarettes) || 20,
        cigarettePrice: parseFloat(this.data.cigarettePrice) || 15,
        checkinReminder: this.data.checkinReminder,
        reminderTime: this.data.reminderTime,
        showInRanking: this.data.showInRanking,
        publicData: this.data.publicData
      };

      // 保存到本地
      setStorageSync('userSettings', settings);

      // 保存到云端
      const result = await userService.updateUserSettings(settings);

      if (result.success) {
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        });
      }
    } catch (err) {
      console.error('保存失败:', err);
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  /**
   * 阻止冒泡
   */
  stopPropagation() {
    // 阻止事件冒泡
  }
});
