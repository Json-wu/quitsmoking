// API调用封装层
// 统一使用后台API

const { getApiUrl, getApiConfig } = require('../config/api.config.js');

/**
 * 统一的API调用方法
 * @param {string} endpoint - API端点
 * @param {object} data - 请求数据
 * @returns {Promise} 返回结果
 */
function callApi(endpoint, data = {}) {
  const url = getApiUrl(`/${endpoint}`);
  const apiConfig = getApiConfig();

  return new Promise((resolve, reject) => {
    wx.request({
      url,
      method: 'POST',
      data,
      header: {
        'content-type': 'application/json',
        'Authorization': wx.getStorageSync('token') || ''
      },
      timeout: apiConfig.timeout,
      success: (res) => {
        console.log(`API ${endpoint} 调用成功:`, res);
        if (res.statusCode === 200) {
          if (res.data && res.data.success !== false) {
            resolve(res.data);
          } else {
            reject(res.data || { success: false, message: '调用失败' });
          }
        } else {
          reject({ success: false, message: `HTTP ${res.statusCode}` });
        }
      },
      fail: (err) => {
        console.error(`API ${endpoint} 调用失败:`, err);
        reject(err);
      }
    });
  });
}

/**
 * GET请求
 */
function get(endpoint, params = {}) {
  const url = getApiUrl(`/${endpoint}`);
  const apiConfig = getApiConfig();
  const queryString = Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
  
  const fullUrl = queryString ? `${url}?${queryString}` : url;

  return new Promise((resolve, reject) => {
    wx.request({
      url: fullUrl,
      method: 'GET',
      header: {
        'content-type': 'application/json',
        'Authorization': wx.getStorageSync('token') || ''
      },
      timeout: apiConfig.timeout,
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data);
        } else {
          reject({ success: false, message: `HTTP ${res.statusCode}` });
        }
      },
      fail: reject
    });
  });
}

module.exports = {
  callApi,
  get,
  // 导出具体的API方法
  login: (data) => callApi('login', data),
  checkIn: (data) => callApi('checkIn', data),
  getUserStats: (data) => callApi('getUserStats', data),
  setQuitDate: (data) => callApi('setQuitDate', data),
  updateSmokingData: (data) => callApi('updateSmokingData', data),
  getTodayCheckinCount: (data) => callApi('getTodayCheckinCount', data),
  getCheckinRecords: (data) => callApi('getCheckinRecords', data),
  makeUpCheckIn: (data) => callApi('makeUpCheckIn', data),
  recordPuff: (data) => callApi('recordPuff', data),
  recordShare: (data) => callApi('recordShare', data),
  getCigaretteStats: (data) => callApi('getCigaretteStats', data),
  initDB: (data) => callApi('initDB', data)
};
