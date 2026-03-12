# Docker 部署指南

## 环境要求

- Docker 20.10+
- Docker Compose 2.0+

## 快速开始

### 1. 配置环境变量

复制环境变量模板并填写微信小程序配置：

```bash
cd server
cp .env.example .env
```

编辑 `.env` 文件，填写以下配置：

```env
# 微信小程序配置
WECHAT_APPID=你的小程序AppID
WECHAT_SECRET=你的小程序Secret

# JWT密钥（建议修改为随机字符串）
JWT_SECRET=quitsmoking123456

# MongoDB连接（Docker环境使用）
MONGODB_URI=mongodb://mongodb:27017/quitsmoking

# 服务端口
PORT=3000
```

### 2. 启动服务

在项目根目录执行：

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 只查看后端服务日志
docker-compose logs -f server
```

### 3. 验证部署

```bash
# 检查服务状态
docker-compose ps

# 测试API
curl http://localhost:3000/api/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"openid":"test"}'
```

## 服务说明

### MongoDB (端口 27017)
- 容器名：`quitsmoking-mongodb`
- 数据持久化：`mongodb_data` volume
- 数据库名：`quitsmoking`

### Node.js 后端 (端口 3000)
- 容器名：`quitsmoking-server`
- 日志目录：`./server/logs`
- 依赖服务：MongoDB

## 常用命令

### 启动服务
```bash
docker-compose up -d
```

### 停止服务
```bash
docker-compose down
```

### 重启服务
```bash
docker-compose restart
```

### 查看日志
```bash
# 所有服务
docker-compose logs -f

# 指定服务
docker-compose logs -f server
docker-compose logs -f mongodb
```

### 进入容器
```bash
# 进入后端容器
docker-compose exec server sh

# 进入MongoDB容器
docker-compose exec mongodb mongosh
```

### 重新构建
```bash
# 重新构建并启动
docker-compose up -d --build

# 只重新构建后端
docker-compose build server
```

### 清理数据
```bash
# 停止并删除容器、网络
docker-compose down

# 停止并删除容器、网络、数据卷（会清空数据库）
docker-compose down -v
```

## 生产环境部署

### 1. 使用 Nginx 反向代理

创建 `nginx.conf`：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /api-quitsmoking {
        proxy_pass http://localhost:3000/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 2. 配置 HTTPS

使用 Let's Encrypt 获取免费 SSL 证书：

```bash
# 安装 certbot
apt-get install certbot python3-certbot-nginx

# 获取证书
certbot --nginx -d your-domain.com
```

### 3. 修改小程序配置

更新 `miniprogram/config/api.config.js`：

```javascript
const config = {
  api: {
    prod: {
      baseUrl: 'https://your-domain.com/api-quitsmoking',
      timeout: 10000
    }
  },
  env: 'prod'
};
```

## 监控和维护

### 查看资源使用
```bash
docker stats
```

### 备份数据库
```bash
# 导出数据
docker-compose exec mongodb mongodump --db quitsmoking --out /data/backup

# 复制备份文件到宿主机
docker cp quitsmoking-mongodb:/data/backup ./backup
```

### 恢复数据库
```bash
# 复制备份文件到容器
docker cp ./backup quitsmoking-mongodb:/data/backup

# 恢复数据
docker-compose exec mongodb mongorestore --db quitsmoking /data/backup/quitsmoking
```

## 故障排查

### 服务无法启动
```bash
# 查看详细日志
docker-compose logs server

# 检查端口占用
lsof -i:3000
lsof -i:27017
```

### MongoDB 连接失败
```bash
# 检查 MongoDB 是否运行
docker-compose ps mongodb

# 查看 MongoDB 日志
docker-compose logs mongodb

# 测试连接
docker-compose exec server sh
# 在容器内执行
ping mongodb
```

### 重置所有数据
```bash
# 停止服务并删除所有数据
docker-compose down -v

# 重新启动
docker-compose up -d
```

## 性能优化

### 1. 限制容器资源

修改 `docker-compose.yml`：

```yaml
services:
  server:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          memory: 256M
```

### 2. MongoDB 优化

```yaml
services:
  mongodb:
    command: mongod --wiredTigerCacheSizeGB 0.5
```

## 安全建议

1. **修改默认密钥**：更改 `JWT_SECRET` 为强随机字符串
2. **MongoDB 认证**：生产环境建议启用 MongoDB 用户认证
3. **防火墙配置**：只开放必要端口（80, 443）
4. **定期备份**：设置自动备份脚本
5. **日志轮转**：配置日志文件大小限制

## 更新部署

```bash
# 1. 拉取最新代码
git pull

# 2. 重新构建并启动
docker-compose up -d --build

# 3. 验证服务
docker-compose ps
docker-compose logs -f server
```
