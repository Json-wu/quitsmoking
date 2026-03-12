class CertificateService {
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
}

module.exports = new CertificateService();
