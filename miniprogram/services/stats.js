// services/stats.js - 统计服务

const { callFunction } = require('../utils/request.js');

class StatsService {
  /**
   * 获取健康收益统计
   * @param {Number} days - 戒烟天数
   * @param {Object} userInfo - 用户信息
   * @returns {Object} 健康收益数据
   */
  calculateHealthStats(days, userInfo = {}) {
    const dailyCigarettes = userInfo.dailyCigarettes || 20;
    const cigarettePrice = userInfo.cigarettePrice || 15;
    const cigarettesPerPack = userInfo.cigarettesPerPack || 20;

    // 计算节省香烟数
    const savedCigarettes = days * dailyCigarettes;
    
    // 计算节省金额
    const savedMoney = ((savedCigarettes / cigarettesPerPack) * cigarettePrice).toFixed(2);
    
    // 计算健康指数 (365天达到100%)
    const healthIndex = Math.min(100, Math.floor(days / 3.65));

    // 计算减少尼古丁摄入量 (假设每支烟1.2mg尼古丁)
    const nicotineReduced = (savedCigarettes * 1.2).toFixed(2);

    // 计算预计延长寿命 (假设每支烟减少11分钟寿命)
    const lifeExtended = Math.floor((savedCigarettes * 11) / 60 / 24); // 转换为天数

    return {
      savedCigarettes,
      savedMoney,
      healthIndex,
      nicotineReduced,
      lifeExtended
    };
  }

  /**
   * 获取用户完整统计数据
   * @returns {Promise} 统计数据
   */
  async getUserCompleteStats() {
    try {
      const result = await callFunction('getUserCompleteStats');
      return result;
    } catch (err) {
      console.error('获取统计数据失败:', err);
      throw err;
    }
  }

  /**
   * 获取排行榜数据
   * @param {String} type - 排行榜类型: days/checkin
   * @param {Number} limit - 数量限制
   * @returns {Promise} 排行榜数据
   */
  async getRankingList(type = 'days', limit = 100) {
    try {
      const result = await callFunction('getRankingList', { type, limit });
      return result;
    } catch (err) {
      console.error('获取排行榜失败:', err);
      throw err;
    }
  }

  /**
   * 获取趋势数据
   * @param {String} type - 数据类型: checkin/cigarette
   * @param {Number} days - 天数
   * @returns {Promise} 趋势数据
   */
  async getTrendData(type, days = 30) {
    try {
      const result = await callFunction('getTrendData', { type, days });
      return result;
    } catch (err) {
      console.error('获取趋势数据失败:', err);
      throw err;
    }
  }

  /**
   * 记录用户行为
   * @param {String} action - 行为类型
   * @param {Object} data - 行为数据
   * @returns {Promise} 记录结果
   */
  async recordUserAction(action, data = {}) {
    try {
      const result = await callFunction('recordUserAction', {
        action,
        data,
        timestamp: Date.now()
      });
      return result;
    } catch (err) {
      console.error('记录用户行为失败:', err);
      throw err;
    }
  }
}

module.exports = new StatsService();
