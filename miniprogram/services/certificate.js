// services/certificate.js - 证书服务

const { callFunction } = require('../utils/request.js');
const { saveImageToPhotosAlbum } = require('../utils/util.js');

class CertificateService {
  /**
   * 生成证书
   * @param {Number} days - 戒烟天数
   * @returns {Promise} 证书数据
   */
  async generateCertificate(days) {
    try {
      const level = this.getCertificateLevel(days);
      const result = await callFunction('generateCertificate', { days, level });
      return result;
    } catch (err) {
      console.error('生成证书失败:', err);
      throw err;
    }
  }

  /**
   * 获取证书等级
   * @param {Number} days - 戒烟天数
   * @returns {String} 证书等级
   */
  getCertificateLevel(days) {
    if (days >= 365) return 'master';
    if (days >= 180) return 'expert';
    if (days >= 90) return 'advanced';
    if (days >= 30) return 'intermediate';
    if (days >= 7) return 'beginner';
    return null;
  }

  /**
   * 获取证书配置
   * @param {String} level - 证书等级
   * @returns {Object} 证书配置
   */
  getCertificateConfig(level) {
    const configs = {
      beginner: {
        name: '初级证书',
        color: '#4A90E2',
        icon: '🌱',
        bgGradient: ['#4A90E2', '#357ABD']
      },
      intermediate: {
        name: '中级证书',
        color: '#50C878',
        icon: '🌳',
        bgGradient: ['#50C878', '#3FA563']
      },
      advanced: {
        name: '高级证书',
        color: '#9B59B6',
        icon: '🛡️',
        bgGradient: ['#9B59B6', '#8E44AD']
      },
      expert: {
        name: '专家证书',
        color: '#F39C12',
        icon: '🏆',
        bgGradient: ['#F39C12', '#E67E22']
      },
      master: {
        name: '大师证书',
        color: 'linear-gradient',
        icon: '👑',
        bgGradient: ['#FF6B6B', '#FFD93D', '#6BCF7F', '#4ECDC4', '#9B59B6']
      }
    };
    return configs[level] || configs.beginner;
  }

  /**
   * 保存证书到相册
   * @param {String} tempFilePath - 临时文件路径
   * @returns {Promise} 保存结果
   */
  async saveCertificateToAlbum(tempFilePath) {
    try {
      await saveImageToPhotosAlbum(tempFilePath);
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      });
    } catch (err) {
      if (err.errMsg && err.errMsg.includes('auth deny')) {
        // 引导用户授权
        const res = await wx.showModal({
          title: '提示',
          content: '需要您授权保存相册'
        });
        if (res.confirm) {
          wx.openSetting();
        }
      }
      throw err;
    }
  }

  /**
   * 分享证书
   * @param {Number} days - 戒烟天数
   * @param {String} level - 证书等级
   * @returns {Object} 分享配置
   */
  shareCertificate(days, level) {
    return {
      title: `我已成功戒烟${days}天！`,
      path: '/pages/index/index',
      imageUrl: '/assets/images/share-certificate.png'
    };
  }

  /**
   * 获取证书列表
   * @returns {Promise} 证书列表
   */
  async getCertificateList() {
    try {
      const result = await callFunction('getCertificateList');
      return result;
    } catch (err) {
      console.error('获取证书列表失败:', err);
      throw err;
    }
  }
}

module.exports = new CertificateService();
