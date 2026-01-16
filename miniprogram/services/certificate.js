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
    if (days > 365) return 'grandmaster';  // 宗师
    if (days >= 365) return 'master';       // 大师
    if (days >= 180) return 'expert';       // 专家
    if (days >= 90) return 'advanced';      // 高级
    if (days >= 30) return 'intermediate';  // 中级
    if (days >= 7) return 'beginner';       // 初级
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
        color: '#D2691E',
        icon: '🌱',
        bgGradient: ['#D2691E', '#A0522D'],
        borderImage: 'cloud://cloud1-5g9hlytr7a58a6f7.636c-cloud1-5g9hlytr7a58a6f7-1395770922/border-beginner.jpg'
      },
      intermediate: {
        name: '中级证书',
        color: '#CD5C5C',
        icon: '🌳',
        bgGradient: ['#CD5C5C', '#B22222'],
        borderImage: 'cloud://cloud1-5g9hlytr7a58a6f7.636c-cloud1-5g9hlytr7a58a6f7-1395770922/border-intermediate.jpg'
      },
      advanced: {
        name: '高级证书',
        color: '#8B4513',
        icon: '🛡️',
        bgGradient: ['#8B4513', '#654321'],
        borderImage: 'cloud://cloud1-5g9hlytr7a58a6f7.636c-cloud1-5g9hlytr7a58a6f7-1395770922/border-advanced.jpg'
      },
      expert: {
        name: '专家证书',
        color: '#DC143C',
        icon: '🏆',
        bgGradient: ['#DC143C', '#B22222'],
        borderImage: 'cloud://cloud1-5g9hlytr7a58a6f7.636c-cloud1-5g9hlytr7a58a6f7-1395770922/border-expert.jpg'
      },
      master: {
        name: '大师证书',
        color: '#C41E3A',
        icon: '👑',
        bgGradient: ['#C41E3A', '#8B0000'],
        borderImage: 'cloud://cloud1-5g9hlytr7a58a6f7.636c-cloud1-5g9hlytr7a58a6f7-1395770922/border-master.jpg'
      },
      grandmaster: {
        name: '宗师证书',
        color: '#8B0000',
        icon: '⭐',
        bgGradient: ['#8B0000', '#660000'],
        borderImage: 'cloud://cloud1-5g9hlytr7a58a6f7.636c-cloud1-5g9hlytr7a58a6f7-1395770922/border-grandmaster.jpg'
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
