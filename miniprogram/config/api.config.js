// API配置文件
// 可以在这里切换使用云函数或后台API

const config = {
  // 后台API配置
  api: {
    // 开发环境
    dev: {
      baseUrl: 'http://localhost:3000/api',
      timeout: 10000
    },
    // 生产环境
    prod: {
      baseUrl: 'https://quitsmoking.dcct.top/api',
      timeout: 10000
    }
  },
  
  // 当前环境
  env: 'prod' // 可选值: 'dev' | 'prod'
};

// 获取当前API配置
function getApiConfig() {
  return config.api[config.env];
}

// 获取完整的API URL
function getApiUrl(endpoint) {
  const apiConfig = getApiConfig();
  return `${apiConfig.baseUrl}${endpoint}`;
}

module.exports = {
  config,
  getApiConfig,
  getApiUrl
};
