class CertificateService {
  /**
   * 分享证书
   * @param {Number} days - 戒烟天数
   * @param {String} level - 证书等级
   * @returns {Object} 分享配置
   */
  shareCertificate(days, level) {
    return {
      title: `分享我的荣誉证书！`,
      path: '/pages/index/index',
      imageUrl: '/assets/images/share-certificate.png'
    };
  }
}

module.exports = new CertificateService();
