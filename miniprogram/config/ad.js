// config/ad.js - 广告配置

module.exports = {
  // 激励视频广告单元ID
  rewardedVideoAdUnitId: 'adunit-xxxxxxxxxxxxxxxx',

  // Banner广告单元ID
  bannerAdUnitId: 'adunit-yyyyyyyyyyyyyyyy',

  // 插屏广告单元ID
  interstitialAdUnitId: 'adunit-zzzzzzzzzzzzzzzz',

  // 广告展示配置
  display: {
    // 首页Banner广告
    homeBanner: {
      enabled: true,
      position: 'bottom'
    },

    // 文章列表Banner广告
    methodsBanner: {
      enabled: true,
      position: 'bottom'
    },

    // 个人中心Banner广告
    profileBanner: {
      enabled: true,
      position: 'bottom'
    },

    // 补签激励视频
    makeUpRewardedVideo: {
      enabled: true,
      required: true  // 是否必须观看
    },

    // 证书生成激励视频
    certificateRewardedVideo: {
      enabled: true,
      required: false  // 可选观看
    },

    // 启动插屏广告
    launchInterstitial: {
      enabled: false,
      minInterval: 86400000  // 最小间隔(24小时)
    }
  },

  // 广告奖励配置
  rewards: {
    // 补签奖励
    makeUp: {
      type: 'makeUpCount',
      value: 1
    },

    // 证书特殊边框奖励
    certificateBorder: {
      type: 'specialBorder',
      value: 'premium'
    },

    // 每日奖励
    daily: {
      type: 'points',
      value: 10
    }
  },

  // 广告频率控制
  frequency: {
    // Banner广告刷新间隔(秒)
    bannerRefreshInterval: 30,

    // 激励视频最小间隔(秒)
    rewardedVideoMinInterval: 60,

    // 插屏广告最小间隔(秒)
    interstitialMinInterval: 300
  },

  // 广告加载超时时间(ms)
  loadTimeout: 5000,

  // 是否在开发环境显示广告
  showInDev: false
};
