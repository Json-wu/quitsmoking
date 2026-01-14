// services/cigarette.js - 电子烟服务

const { callFunction } = require('../utils/request.js');

class CigaretteService {
  /**
   * 记录吸烟行为
   * @param {String} type - 行为类型: puff/shake/new
   * @param {Number} count - 次数
   * @returns {Promise} 记录结果
   */
  async recordPuff(type, count = 1) {
    try {
      const result = await callFunction('recordPuff', { type, count });
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
   * 获取今日统计
   * @returns {Promise} 统计数据
   */
  async getTodayStats() {
    try {
      const result = await callFunction('getCigaretteStats');
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
    return {
      title: '给你送了一根电子烟，快来试试吧！',
      path: '/pages/cigarette/cigarette',
      imageUrl: '/assets/images/share-cigarette.png'
    };
  }

  /**
   * 记录分享
   * @returns {Promise} 记录结果
   */
  async recordShare() {
    try {
      const result = await callFunction('recordShare', {
        shareType: 'cigarette'
      });
      return result;
    } catch (err) {
      console.error('记录分享失败:', err);
      throw err;
    }
  }
}

module.exports = new CigaretteService();
