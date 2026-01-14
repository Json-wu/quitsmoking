// utils/storage.js - 本地存储封装

/**
 * 设置存储
 * @param {String} key - 键名
 * @param {*} value - 值
 * @returns {Promise} 存储结果
 */
const setStorage = (key, value) => {
  return new Promise((resolve, reject) => {
    wx.setStorage({
      key,
      data: value,
      success: resolve,
      fail: reject
    });
  });
};

/**
 * 获取存储
 * @param {String} key - 键名
 * @returns {Promise} 存储的值
 */
const getStorage = (key) => {
  return new Promise((resolve, reject) => {
    wx.getStorage({
      key,
      success: (res) => resolve(res.data),
      fail: reject
    });
  });
};

/**
 * 移除存储
 * @param {String} key - 键名
 * @returns {Promise} 移除结果
 */
const removeStorage = (key) => {
  return new Promise((resolve, reject) => {
    wx.removeStorage({
      key,
      success: resolve,
      fail: reject
    });
  });
};

/**
 * 清空存储
 * @returns {Promise} 清空结果
 */
const clearStorage = () => {
  return new Promise((resolve, reject) => {
    wx.clearStorage({
      success: resolve,
      fail: reject
    });
  });
};

/**
 * 同步设置存储
 * @param {String} key - 键名
 * @param {*} value - 值
 */
const setStorageSync = (key, value) => {
  try {
    wx.setStorageSync(key, value);
    return true;
  } catch (err) {
    console.error('设置存储失败:', err);
    return false;
  }
};

/**
 * 同步获取存储
 * @param {String} key - 键名
 * @returns {*} 存储的值
 */
const getStorageSync = (key) => {
  try {
    return wx.getStorageSync(key);
  } catch (err) {
    console.error('获取存储失败:', err);
    return null;
  }
};

/**
 * 同步移除存储
 * @param {String} key - 键名
 */
const removeStorageSync = (key) => {
  try {
    wx.removeStorageSync(key);
    return true;
  } catch (err) {
    console.error('移除存储失败:', err);
    return false;
  }
};

/**
 * 同步清空存储
 */
const clearStorageSync = () => {
  try {
    wx.clearStorageSync();
    return true;
  } catch (err) {
    console.error('清空存储失败:', err);
    return false;
  }
};

/**
 * 获取存储信息
 * @returns {Object} 存储信息
 */
const getStorageInfo = () => {
  return new Promise((resolve, reject) => {
    wx.getStorageInfo({
      success: resolve,
      fail: reject
    });
  });
};

/**
 * 同步获取存储信息
 * @returns {Object} 存储信息
 */
const getStorageInfoSync = () => {
  try {
    return wx.getStorageInfoSync();
  } catch (err) {
    console.error('获取存储信息失败:', err);
    return null;
  }
};

// 存储键名常量
const STORAGE_KEYS = {
  USER_INFO: 'userInfo',
  QUIT_DATE: 'quitDate',
  SETTINGS: 'settings',
  CHECKIN_CACHE: 'checkinCache',
  ARTICLE_CACHE: 'articleCache'
};

module.exports = {
  setStorage,
  getStorage,
  removeStorage,
  clearStorage,
  setStorageSync,
  getStorageSync,
  removeStorageSync,
  clearStorageSync,
  getStorageInfo,
  getStorageInfoSync,
  STORAGE_KEYS
};
