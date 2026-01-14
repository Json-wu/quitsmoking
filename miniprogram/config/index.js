// config/index.js - 全局配置

module.exports = {
  // 云开发环境ID
  cloudEnvId: 'your-env-id',

  // 小程序信息
  appInfo: {
    name: '我要戒烟',
    version: '1.0.0',
    description: '帮助用户戒烟的个人工具小程序'
  },

  // 默认配置
  defaults: {
    dailyCigarettes: 20,        // 默认日吸烟量
    cigarettePrice: 15,         // 默认香烟价格
    cigarettesPerPack: 20,      // 默认每包香烟支数
    targetDays: 365,            // 默认目标天数
    makeUpCountPerMonth: 3      // 每月补签次数
  },

  // 分页配置
  pagination: {
    pageSize: 10,               // 默认每页数量
    maxPageSize: 50             // 最大每页数量
  },

  // 缓存配置
  cache: {
    userInfoExpire: 3600000,    // 用户信息缓存过期时间(1小时)
    articleExpire: 1800000,     // 文章缓存过期时间(30分钟)
    statsExpire: 300000         // 统计数据缓存过期时间(5分钟)
  },

  // 证书等级配置
  certificateLevels: [
    { days: 7, level: 'beginner', name: '初级证书' },
    { days: 30, level: 'intermediate', name: '中级证书' },
    { days: 90, level: 'advanced', name: '高级证书' },
    { days: 180, level: 'expert', name: '专家证书' },
    { days: 365, level: 'master', name: '大师证书' }
  ],

  // 勋章配置
  badges: [
    { days: 7, type: 'week_hero', name: '周度英雄', icon: '🏅' },
    { days: 30, type: 'month_warrior', name: '月度勇士', icon: '🥉' },
    { days: 60, type: 'bimonth_hero', name: '双月英雄', icon: '🥈' },
    { days: 90, type: 'quarter_champion', name: '季度冠军', icon: '🥇' },
    { days: 180, type: 'halfyear_legend', name: '半年传奇', icon: '🏆' },
    { days: 365, type: 'year_king', name: '年度王者', icon: '👑' }
  ],

  // 文章分类
  articleCategories: [
    { id: 'all', name: '全部' },
    { id: 'scientific', name: '科学戒烟' },
    { id: 'psychological', name: '心理调节' },
    { id: 'lifestyle', name: '生活习惯' },
    { id: 'skills', name: '应对技巧' }
  ],

  // 惊喜触发节点
  surpriseNodes: [5, 10, 15, 20, 25, 30, 60, 90, 180, 365],

  // 健康收益计算参数
  healthParams: {
    nicotinePerCigarette: 1.2,  // 每支烟尼古丁含量(mg)
    minutesLostPerCigarette: 11, // 每支烟减少寿命(分钟)
    daysToFullHealth: 365        // 达到100%健康指数的天数
  },

  // 分享配置
  share: {
    defaultTitle: '我要戒烟 - 健康生活从戒烟开始',
    defaultPath: '/pages/index/index',
    defaultImageUrl: '/assets/images/share-default.png'
  },

  // 联系方式
  contact: {
    email: 'support@quitsmoking.com',
    wechat: 'quitsmoking_support'
  }
};
