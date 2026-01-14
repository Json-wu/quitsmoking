// cloudfunctions/generateCertificate/index.js
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { quitDays } = event;

  try {
    // 获取证书等级
    const level = getCertificateLevel(quitDays);

    // 检查是否已经生成过该等级证书
    const existResult = await db.collection('certificates').where({
      _openid: wxContext.OPENID,
      level: level
    }).get();

    if (existResult.data.length > 0) {
      return {
        success: true,
        message: '证书已存在',
        certificate: existResult.data[0]
      };
    }

    // 创建证书记录
    const certificate = {
      _openid: wxContext.OPENID,
      level: level,
      quitDays: quitDays,
      createTime: db.serverDate()
    };

    const addResult = await db.collection('certificates').add({
      data: certificate
    });

    certificate._id = addResult._id;

    return {
      success: true,
      message: '证书生成成功',
      certificate: certificate
    };
  } catch (err) {
    console.error('生成证书失败:', err);
    return {
      success: false,
      message: '生成失败，请重试'
    };
  }
};

/**
 * 获取证书等级
 */
function getCertificateLevel(days) {
  if (days >= 365) return 'master';
  if (days >= 180) return 'expert';
  if (days >= 90) return 'advanced';
  if (days >= 30) return 'intermediate';
  if (days >= 7) return 'beginner';
  return 'none';
}
