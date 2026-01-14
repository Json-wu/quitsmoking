// services/user.js - 用户服务

const { callFunction } = require('../utils/request.js');

class UserService {
  /**
   * 获取用户信息
   * @returns {Promise} 用户信息
   */
  async getUserInfo() {
    try {
      const result = await callFunction('getUserStats');
      return result;
    } catch (err) {
      console.error('获取用户信息失败:', err);
      throw err;
    }
  }

  /**
   * 更新用户信息
   * @param {Object} data - 用户数据
   * @returns {Promise} 更新结果
   */
  async updateUserInfo(data) {
    try {
      const result = await callFunction('updateUserInfo', data);
      return result;
    } catch (err) {
      console.error('更新用户信息失败:', err);
      throw err;
    }
  }

  /**
   * 设置戒烟日期
   * @param {String} quitDate - 戒烟日期
   * @returns {Promise} 设置结果
   */
  async setQuitDate(quitDate) {
    try {
      const result = await callFunction('setQuitDate', { quitDate });
      return result;
    } catch (err) {
      console.error('设置戒烟日期失败:', err);
      throw err;
    }
  }

  /**
   * 获取用户统计数据
   * @returns {Promise} 统计数据
   */
  async getUserStats() {
    try {
      const result = await callFunction('getUserStats');
      return result;
    } catch (err) {
      console.error('获取统计数据失败:', err);
      throw err;
    }
  }

  /**
   * 更新用户设置
   * @param {Object} settings - 设置数据
   * @returns {Promise} 更新结果
   */
  async updateSettings(settings) {
    try {
      const result = await callFunction('updateUserInfo', { settings });
      return result;
    } catch (err) {
      console.error('更新设置失败:', err);
      throw err;
    }
  }

  /**
   * 获取用户勋章列表
   * @returns {Promise} 勋章列表
   */
  async getBadges() {
    try {
      const result = await callFunction('getBadges');
      return result;
    } catch (err) {
      console.error('获取勋章列表失败:', err);
      throw err;
    }
  }
}

module.exports = new UserService();
