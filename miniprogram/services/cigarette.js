// services/cigarette.js - 电子烟服务

const api = require('../utils/api.js');

class CigaretteService {
  /**
   * 记录吸烟行为
   * @param {String} type - 行为类型: puff/shake/new/light
   * @param {Number} count - 次数
   * @returns {Promise} 记录结果
   */
  async recordPuff(type, count = 1) {
    try {
      const app = getApp();
      const result = await api.recordPuff({ openid: app.globalData.openid, type, count });
      return result;
    } catch (err) {
      console.error('记录吸烟行为失败:', err);
      throw err;
    }
  }

  /**
   * 记录吸一口
   * @returns {Promise} 记录结果
   */
  async recordPuffAction() {
    return this.recordPuff('puff', 1);
  }

  /**
   * 记录抖灰
   * @returns {Promise} 记录结果
   */
  async recordShake() {
    return this.recordPuff('shake', 1);
  }

  /**
   * 记录再来一根
   * @returns {Promise} 记录结果
   */
  async recordNewCigarette() {
    return this.recordPuff('new', 1);
  }

  /**
   * 记录点火（抽了几根）
   * @returns {Promise} 记录结果
   */
  async recordLight() {
    return this.recordPuff('light', 1);
  }

  /**
   * 获取今日统计
   * @returns {Promise} 统计数据
   */
  async getTodayStats() {
    try {
      const app = getApp();
      const result = await api.getCigaretteStats({ openid: app.globalData.openid });
      return result;
    } catch (err) {
      console.error('获取统计数据失败:', err);
      throw err;
    }
  }

  /**
   * 分享电子烟
   * @returns {Object} 分享配置
   */
  shareCigarette() {
    this.recordShare();
    return {
      title: '给你送了一根电子烟，快来试试吧！',
      path: '/pages/cigarette/cigarette',
      imageUrl: '/assets/images/share-cigarette.jpeg'
    };
  }

  /**
   * 记录分享
   * @returns {Promise} 记录结果
   */
  async recordShare() {
    try {
      console.log('记录分享');
      const app = getApp();
      const result = await api.recordShare({
        openid: app.globalData.openid,
        shareType: 'cigarette'
      });
      console.log('记录分享结果:', result);
      return result;
    } catch (err) {
      console.error('记录分享失败:', err);
      throw err;
    }
  }
}

module.exports = new CigaretteService();
