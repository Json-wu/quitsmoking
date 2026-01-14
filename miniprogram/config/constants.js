// config/constants.js - 常量定义

// 存储键名
const STORAGE_KEYS = {
  USER_INFO: 'userInfo',
  QUIT_DATE: 'quitDate',
  SETTINGS: 'settings',
  CHECKIN_CACHE: 'checkinCache',
  ARTICLE_CACHE: 'articleCache',
  TOKEN: 'token'
};

// 证书等级
const CERTIFICATE_LEVELS = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
  EXPERT: 'expert',
  MASTER: 'master'
};

// 勋章类型
const BADGE_TYPES = {
  WEEK_HERO: 'week_hero',
  MONTH_WARRIOR: 'month_warrior',
  BIMONTH_HERO: 'bimonth_hero',
  QUARTER_CHAMPION: 'quarter_champion',
  HALFYEAR_LEGEND: 'halfyear_legend',
  YEAR_KING: 'year_king'
};

// 文章分类
const ARTICLE_CATEGORIES = {
  ALL: 'all',
  SCIENTIFIC: 'scientific',
  PSYCHOLOGICAL: 'psychological',
  LIFESTYLE: 'lifestyle',
  SKILLS: 'skills'
};

// 文章状态
const ARTICLE_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived'
};

// 电子烟行为类型
const CIGARETTE_ACTIONS = {
  PUFF: 'puff',           // 吸一口
  SHAKE: 'shake',         // 抖灰
  NEW: 'new',             // 再来一根
  LIGHT: 'light',         // 点火
  SHARE: 'share'          // 送烟
};

// 分享类型
const SHARE_TYPES = {
  CERTIFICATE: 'certificate',
  CIGARETTE: 'cigarette',
  ARTICLE: 'article',
  HOME: 'home'
};

// 用户行为类型
const USER_ACTIONS = {
  PAGE_VIEW: 'page_view',
  BUTTON_CLICK: 'button_click',
  SHARE: 'share',
  COLLECT: 'collect',
  LIKE: 'like'
};

// 时间格式
const DATE_FORMATS = {
  DATE: 'YYYY-MM-DD',
  TIME: 'HH:mm:ss',
  DATETIME: 'YYYY-MM-DD HH:mm:ss',
  MONTH: 'YYYY-MM',
  YEAR: 'YYYY'
};

// 错误码
const ERROR_CODES = {
  SUCCESS: 0,
  UNKNOWN_ERROR: -1,
  NETWORK_ERROR: 1001,
  AUTH_ERROR: 1002,
  PARAM_ERROR: 1003,
  DATA_NOT_FOUND: 1004,
  PERMISSION_DENIED: 1005,
  ALREADY_EXISTS: 1006,
  LIMIT_EXCEEDED: 1007
};

// 错误消息
const ERROR_MESSAGES = {
  [ERROR_CODES.UNKNOWN_ERROR]: '未知错误',
  [ERROR_CODES.NETWORK_ERROR]: '网络连接失败',
  [ERROR_CODES.AUTH_ERROR]: '用户未登录',
  [ERROR_CODES.PARAM_ERROR]: '参数错误',
  [ERROR_CODES.DATA_NOT_FOUND]: '数据不存在',
  [ERROR_CODES.PERMISSION_DENIED]: '权限不足',
  [ERROR_CODES.ALREADY_EXISTS]: '数据已存在',
  [ERROR_CODES.LIMIT_EXCEEDED]: '超出限制'
};

// 正则表达式
const REGEX = {
  EMAIL: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/,
  PHONE: /^1[3-9]\d{9}$/,
  DATE: /^\d{4}-\d{2}-\d{2}$/,
  URL: /^https?:\/\/.+/
};

// 颜色主题
const COLORS = {
  PRIMARY: '#89B7FF',
  PRIMARY_LIGHT: '#A5C7FF',
  PRIMARY_DARK: '#6DA3FF',
  SUCCESS: '#50C878',
  WARNING: '#FFB84D',
  DANGER: '#FF4757',
  INFO: '#4A90E2',
  TEXT_PRIMARY: '#333333',
  TEXT_SECONDARY: '#666666',
  TEXT_TERTIARY: '#999999',
  BG_COLOR: '#F5F5F5',
  BG_WHITE: '#FFFFFF'
};

// 动画时长
const ANIMATION_DURATION = {
  FAST: 200,
  BASE: 300,
  SLOW: 500
};

// 页面路径
const PAGE_PATHS = {
  INDEX: '/pages/index/index',
  CIGARETTE: '/pages/cigarette/cigarette',
  CERTIFICATE: '/pages/certificate/certificate',
  REFUSE: '/pages/refuse/refuse',
  METHODS: '/pages/methods/methods',
  ARTICLE: '/pages/article/article',
  PROFILE: '/pages/profile/profile',
  CALENDAR: '/pages/calendar/calendar',
  SETTINGS: '/pages/settings/settings'
};

module.exports = {
  STORAGE_KEYS,
  CERTIFICATE_LEVELS,
  BADGE_TYPES,
  ARTICLE_CATEGORIES,
  ARTICLE_STATUS,
  CIGARETTE_ACTIONS,
  SHARE_TYPES,
  USER_ACTIONS,
  DATE_FORMATS,
  ERROR_CODES,
  ERROR_MESSAGES,
  REGEX,
  COLORS,
  ANIMATION_DURATION,
  PAGE_PATHS
};
