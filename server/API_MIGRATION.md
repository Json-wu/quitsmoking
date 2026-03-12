# 云函数迁移到后台API指南

## 📋 概述

本项目支持两种调用方式：
1. **云函数模式** - 使用微信云开发
2. **后台API模式** - 使用独立部署的Node.js服务器

## 🔧 配置切换

### 1. 修改配置文件

编辑 `/miniprogram/config/api.config.js`：

```javascript
const config = {
  // 切换模式: 'cloud' 使用云函数, 'api' 使用后台API
  mode: 'api', // 改为 'api'
  
  // 配置后台API地址
  api: {
    dev: {
      baseUrl: 'http://localhost:3000/api',
      timeout: 10000
    },
    prod: {
      baseUrl: 'https://your-domain.com/api', // 修改为你的域名
      timeout: 10000
    }
  },
  
  env: 'prod' // 生产环境改为 'prod'
};
```

## 🚀 后台服务器部署

### 1. 安装依赖

```bash
cd server
npm install
```

### 2. 配置环境变量

创建 `.env` 文件：

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/quitsmoking
NODE_ENV=production
```

### 3. 启动MongoDB

```bash
# 使用Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# 或使用本地MongoDB
mongod --dbpath /path/to/data
```

### 4. 启动服务器

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

## 📡 API端点列表

### 用户相关
- `POST /api/login` - 用户登录
- `POST /api/getUserStats` - 获取用户统计
- `POST /api/setQuitDate` - 设置戒烟日期
- `POST /api/updateSmokingData` - 更新吸烟数据

### 签到相关
- `POST /api/checkIn` - 签到
- `POST /api/makeUpCheckIn` - 补签
- `POST /api/getCheckinRecords` - 获取签到记录
- `POST /api/getTodayCheckinCount` - 获取今日签到人数

### 文章相关
- `POST /api/getArticles` - 获取文章列表
- `POST /api/getArticleDetail` - 获取文章详情
- `POST /api/collectArticle` - 收藏文章
- `POST /api/uncollectArticle` - 取消收藏
- `POST /api/likeArticle` - 点赞文章
- `POST /api/unlikeArticle` - 取消点赞
- `POST /api/getCollections` - 获取收藏列表

### 勋章相关
- `POST /api/getBadges` - 获取勋章列表

### 电子烟相关
- `POST /api/recordPuff` - 记录吸烟次数
- `POST /api/recordShare` - 记录送烟次数
- `POST /api/getCigaretteStats` - 获取电子烟统计

### 证书相关
- `POST /api/generateCertificate` - 生成证书

## 🔄 小程序代码迁移

### 原代码（云函数）

```javascript
const res = await wx.cloud.callFunction({
  name: 'login'
});
```

### 新代码（统一API）

```javascript
const api = require('../../utils/api.js');
const res = await api.login();
```

## 📝 请求格式

所有POST请求需要在body中包含 `openid`：

```javascript
{
  "openid": "user_openid_here",
  // 其他参数...
}
```

## 🔐 认证说明

当前版本使用简单的openid认证。生产环境建议：

1. 实现JWT token认证
2. 添加请求签名验证
3. 配置HTTPS
4. 添加请求频率限制

## 📊 数据库结构

### Collections

- `users` - 用户信息
- `checkins` - 签到记录
- `badges` - 勋章
- `articles` - 文章
- `collections` - 收藏
- `likes` - 点赞
- `cigarettes` - 电子烟记录
- `shares` - 送烟记录
- `certificates` - 证书记录

## 🐛 调试

### 查看API日志

服务器会输出详细的请求日志：

```
POST /api/login 200 45ms
POST /api/getUserStats 200 123ms
```

### 测试API

使用curl测试：

```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"openid":"test_openid"}'
```

## 🔄 回滚到云函数

如需回滚，只需修改配置：

```javascript
const config = {
  mode: 'cloud', // 改回 'cloud'
  // ...
};
```

## 📦 生产环境部署建议

### 使用PM2

```bash
npm install -g pm2
pm2 start src/index.js --name quitsmoking-api
pm2 save
pm2 startup
```

### 使用Nginx反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 使用Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## ⚠️ 注意事项

1. **openid获取**：后台API模式下，需要在小程序端获取openid后传递给API
2. **数据迁移**：从云数据库迁移数据到MongoDB
3. **文件存储**：云存储的文件需要迁移到OSS或本地存储
4. **定时任务**：云函数的定时触发器需要改为cron job

## 📞 技术支持

如有问题，请查看：
- 服务器日志：`/server/logs`
- 小程序控制台
- MongoDB日志
