// utils/util.js - 通用工具函数

/**
 * 格式化时间
 * @param {Date} date - 日期对象
 * @param {String} format - 格式化模板
 * @returns {String} 格式化后的时间字符串
 */
const formatTime = (date, format = 'YYYY-MM-DD HH:mm:ss') => {
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
};

/**
 * 防抖函数
 * @param {Function} fn - 需要防抖的函数
 * @param {Number} delay - 延迟时间(ms)
 * @returns {Function} 防抖后的函数
 */
const debounce = (fn, delay = 300) => {
  let timer = null;
  return function(...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
};

/**
 * 节流函数
 * @param {Function} fn - 需要节流的函数
 * @param {Number} delay - 延迟时间(ms)
 * @returns {Function} 节流后的函数
 */
const throttle = (fn, delay = 300) => {
  let timer = null;
  return function(...args) {
    if (timer) return;
    timer = setTimeout(() => {
      fn.apply(this, args);
      timer = null;
    }, delay);
  };
};

/**
 * 深拷贝
 * @param {*} obj - 需要拷贝的对象
 * @returns {*} 拷贝后的对象
 */
const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  
  const cloneObj = {};
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloneObj[key] = deepClone(obj[key]);
    }
  }
  return cloneObj;
};

/**
 * 生成唯一ID
 * @returns {String} 唯一ID
 */
const generateId = () => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * 数字格式化(千分位)
 * @param {Number} num - 数字
 * @returns {String} 格式化后的字符串
 */
const formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * 获取图片信息
 * @param {String} src - 图片路径
 * @returns {Promise} 图片信息
 */
const getImageInfo = (src) => {
  return new Promise((resolve, reject) => {
    wx.getImageInfo({
      src,
      success: resolve,
      fail: reject
    });
  });
};

/**
 * 保存图片到相册
 * @param {String} filePath - 图片临时路径
 * @returns {Promise} 保存结果
 */
const saveImageToPhotosAlbum = (filePath) => {
  return new Promise((resolve, reject) => {
    wx.saveImageToPhotosAlbum({
      filePath,
      success: resolve,
      fail: reject
    });
  });
};

/**
 * 显示Toast
 * @param {String} title - 提示文字
 * @param {String} icon - 图标类型
 * @param {Number} duration - 持续时间
 */
const showToast = (title, icon = 'none', duration = 2000) => {
  wx.showToast({
    title,
    icon,
    duration
  });
};

/**
 * 显示Loading
 * @param {String} title - 提示文字
 */
const showLoading = (title = '加载中...') => {
  wx.showLoading({
    title,
    mask: true
  });
};

/**
 * 隐藏Loading
 */
const hideLoading = () => {
  wx.hideLoading();
};

/**
 * 显示Modal
 * @param {Object} options - 配置选项
 * @returns {Promise} 用户操作结果
 */
const showModal = (options) => {
  return new Promise((resolve, reject) => {
    wx.showModal({
      ...options,
      success: (res) => {
        if (res.confirm) {
          resolve(true);
        } else if (res.cancel) {
          resolve(false);
        }
      },
      fail: reject
    });
  });
};

/**
 * 设置剪贴板内容
 * @param {String} data - 内容
 * @returns {Promise} 设置结果
 */
const setClipboardData = (data) => {
  return new Promise((resolve, reject) => {
    wx.setClipboardData({
      data,
      success: resolve,
      fail: reject
    });
  });
};

/**
 * 获取系统信息
 * @returns {Object} 系统信息
 */
const getSystemInfo = () => {
  return wx.getSystemInfoSync();
};

/**
 * 页面跳转
 * @param {String} url - 页面路径
 * @param {String} type - 跳转类型: navigateTo/redirectTo/switchTab/reLaunch
 */
const navigateTo = (url, type = 'navigateTo') => {
  wx[type]({ url });
};

module.exports = {
  formatTime,
  debounce,
  throttle,
  deepClone,
  generateId,
  formatNumber,
  getImageInfo,
  saveImageToPhotosAlbum,
  showToast,
  showLoading,
  hideLoading,
  showModal,
  setClipboardData,
  getSystemInfo,
  navigateTo
};
