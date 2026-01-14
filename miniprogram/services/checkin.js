// services/checkin.js - 签到服务

const { callFunction } = require('../utils/request.js');

class CheckinService {
  /**
   * 每日签到
   * @returns {Promise} 签到结果
   */
  async checkIn() {
    try {
      const result = await callFunction('checkIn');
      return result;
    } catch (err) {
      console.error('签到失败:', err);
      throw err;
    }
  }

  /**
   * 补签
   * @param {String} date - 补签日期
   * @returns {Promise} 补签结果
   */
  async makeUpCheckIn(date) {
    try {
      // 先播放激励视频广告
      await this.showRewardedVideoAd();
      
      const result = await callFunction('makeUpCheckIn', { date });
      return result;
    } catch (err) {
      console.error('补签失败:', err);
      throw err;
    }
  }

  /**
   * 获取签到记录
   * @param {Number} year - 年份
   * @param {Number} month - 月份
   * @returns {Promise} 签到记录列表
   */
  async getCheckinRecords(year, month) {
    try {
      const result = await callFunction('getCheckinRecords', { year, month });
      return result;
    } catch (err) {
      console.error('获取签到记录失败:', err);
      throw err;
    }
  }

  /**
   * 检查今日是否已签到
   * @returns {Promise} 签到状态
   */
  async checkTodayCheckin() {
    try {
      const result = await callFunction('checkTodayCheckin');
      return result;
    } catch (err) {
      console.error('检查签到状态失败:', err);
      throw err;
    }
  }

  /**
   * 获取签到统计
   * @returns {Promise} 签到统计数据
   */
  async getCheckinStats() {
    try {
      const result = await callFunction('getCheckinStats');
      return result;
    } catch (err) {
      console.error('获取签到统计失败:', err);
      throw err;
    }
  }

  /**
   * 播放激励视频广告
   * @returns {Promise} 广告播放结果
   */
  showRewardedVideoAd() {
    return new Promise((resolve, reject) => {
      const app = getApp();
      const ad = app.rewardedVideoAd;
      
      if (!ad) {
        reject(new Error('广告组件未初始化'));
        return;
      }

      ad.onClose((res) => {
        if (res && res.isEnded) {
          resolve();
        } else {
          reject(new Error('广告未播放完成'));
        }
      });

      ad.show().catch(() => {
        ad.load().then(() => ad.show()).catch(reject);
      });
    });
  }
}

module.exports = new CheckinService();
