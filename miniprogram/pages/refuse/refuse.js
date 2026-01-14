// pages/refuse/refuse.js
const app = getApp();
const { getStorageSync, setStorageSync } = require('../../utils/storage.js');

Page({
  data: {
    refuseText: '戒烟中',
    subtitleText: '请勿劝烟！',
    isLandscape: false,
    showCustomModal: false,
    customText: ''
  },

  onLoad(options) {
    // 加载自定义文字
    const customRefuseText = getStorageSync('customRefuseText');
    if (customRefuseText) {
      this.setData({
        refuseText: customRefuseText
      });
    }

    // 设置屏幕方向
    this.setScreenOrientation();
    
    // 监听屏幕方向变化
    wx.onDeviceMotionChange(this.handleOrientationChange);
  },

  onUnload() {
    // 移除监听
    wx.offDeviceMotionChange(this.handleOrientationChange);
    
    // 恢复竖屏
    wx.setScreenBrightness({
      value: 0.5
    });
  },

  onShow() {
    // 设置屏幕常亮
    wx.setKeepScreenOn({
      keepScreenOn: true
    });

    // 提高屏幕亮度
    wx.setScreenBrightness({
      value: 1
    });
  },

  onHide() {
    // 取消屏幕常亮
    wx.setKeepScreenOn({
      keepScreenOn: false
    });
  },

  /**
   * 设置屏幕方向
   */
  setScreenOrientation() {
    try {
      // 获取系统信息
      const systemInfo = wx.getSystemInfoSync();
      const isLandscape = systemInfo.screenWidth > systemInfo.screenHeight;
      
      this.setData({ isLandscape });

      // 尝试设置横屏
      if (wx.setPageOrientation) {
        wx.setPageOrientation({
          orientation: 'landscape'
        });
      }
    } catch (err) {
      console.error('设置屏幕方向失败:', err);
    }
  },

  /**
   * 处理屏幕方向变化
   */
  handleOrientationChange(res) {
    const { alpha, beta, gamma } = res;
    const isLandscape = Math.abs(gamma) > 45;
    
    if (this.data.isLandscape !== isLandscape) {
      this.setData({ isLandscape });
    }
  },

  /**
   * 点击屏幕显示自定义弹窗
   */
  handleTap() {
    this.setData({
      showCustomModal: true,
      customText: this.data.refuseText
    });
  },

  /**
   * 输入文字
   */
  onTextInput(e) {
    this.setData({
      customText: e.detail.value
    });
  },

  /**
   * 确认自定义文字
   */
  confirmCustomText() {
    const { customText } = this.data;
    
    if (!customText.trim()) {
      wx.showToast({
        title: '请输入文字',
        icon: 'none'
      });
      return;
    }

    // 保存自定义文字
    setStorageSync('customRefuseText', customText);

    this.setData({
      refuseText: customText,
      showCustomModal: false
    });

    wx.showToast({
      title: '设置成功',
      icon: 'success'
    });
  },

  /**
   * 关闭自定义弹窗
   */
  closeCustomModal() {
    this.setData({
      showCustomModal: false
    });
  },

  /**
   * 阻止冒泡
   */
  stopPropagation() {
    // 阻止事件冒泡
  },

  /**
   * 关闭页面
   */
  handleClose() {
    wx.navigateBack();
  }
});
