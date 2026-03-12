# 阿里云镜像仓库部署指南

## 部署流程概览

```
Mac Mini 本地 → 构建镜像 → 推送阿里云 → 服务器拉取 → 启动运行
```

## 一、准备工作

### 1. 阿里云容器镜像服务配置

1. 登录阿里云控制台：https://cr.console.aliyun.com/
2. 创建命名空间（如：`quitsmoking`）
3. 创建镜像仓库（如：`quitsmoking-server`）
4. 获取登录信息：
   - 仓库地址：`registry.cn-hangzhou.aliyuncs.com`（根据你的区域）
   - 用户名：阿里云账号全名
   - 密码：设置独立的镜像仓库密码

### 2. 本地环境检查

```bash
# 检查 Docker 是否安装
docker --version

# 检查 Docker Compose 是否安装
docker-compose --version
```

## 二、Mac Mini 本地构建镜像

### 步骤 1：准备代码

```bash
# 进入项目目录
cd /Users/yangxiaoxue/Documents/workspace/git/quitsmoking

# 确保代码是最新的
git pull

# 检查 Dockerfile 和 docker-compose.yml
ls -la server/Dockerfile
ls -la docker-compose.yml
```

### 步骤 2：构建镜像

```bash
# 构建镜像（替换为你的阿里云镜像仓库地址）
docker build -t registry.cn-hangzhou.aliyuncs.com/你的命名空间/quitsmoking-server:latest ./server

# 或者指定版本号
docker build -t registry.cn-hangzhou.aliyuncs.com/你的命名空间/quitsmoking-server:v1.0.0 ./server

# 查看构建的镜像
docker images | grep quitsmoking
```

### 步骤 3：测试镜像（可选）

```bash
# 本地测试镜像
docker run -d \
  --name test-server \
  -p 3000:3000 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/quitsmoking \
  -e JWT_SECRET=quitsmoking123456 \
  registry.cn-hangzhou.aliyuncs.com/你的命名空间/quitsmoking-server:latest

# 测试 API
curl http://localhost:3000/api/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"openid":"test"}'

# 停止并删除测试容器
docker stop test-server
docker rm test-server
```

## 三、推送镜像到阿里云

### 步骤 1：登录阿里云镜像仓库

```bash
# 登录阿里云镜像仓库（替换为你的区域）
docker login --username=你的阿里云账号 registry.cn-hangzhou.aliyuncs.com

# 输入密码（镜像仓库密码）
```

### 步骤 2：推送镜像

```bash
# 推送最新版本
docker push registry.cn-hangzhou.aliyuncs.com/你的命名空间/quitsmoking-server:latest

# 推送指定版本
docker push registry.cn-hangzhou.aliyuncs.com/你的命名空间/quitsmoking-server:v1.0.0

# 查看推送进度
# 推送完成后，可以在阿里云控制台查看镜像
```

## 四、服务器端部署

### 步骤 1：服务器环境准备

```bash
# SSH 登录服务器
ssh root@你的服务器IP

# 安装 Docker（如果未安装）
curl -fsSL https://get.docker.com | bash -s docker

# 启动 Docker 服务
systemctl start docker
systemctl enable docker

# 安装 Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version
```

### 步骤 2：创建项目目录

```bash
# 创建项目目录
mkdir -p /opt/quitsmoking
cd /opt/quitsmoking

# 创建必要的子目录
mkdir -p logs
```

### 步骤 3：创建 docker-compose.yml

在服务器上创建 `/opt/quitsmoking/docker-compose.yml`：

```yaml
version: '3.8'

services:
  # MongoDB 数据库
  mongodb:
    image: mongo:6.0
    container_name: quitsmoking-mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_DATABASE: quitsmoking
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    networks:
      - quitsmoking-network

  # Node.js 后端服务
  server:
    image: registry.cn-hangzhou.aliyuncs.com/你的命名空间/quitsmoking-server:latest
    container_name: quitsmoking-server
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongodb:27017/quitsmoking
      - JWT_SECRET=quitsmoking123456
      - WECHAT_APPID=你的小程序AppID
      - WECHAT_SECRET=你的小程序Secret
    depends_on:
      - mongodb
    networks:
      - quitsmoking-network
    volumes:
      - ./logs:/app/logs

networks:
  quitsmoking-network:
    driver: bridge

volumes:
  mongodb_data:
    driver: local
```

### 步骤 4：登录阿里云镜像仓库

```bash
# 在服务器上登录阿里云镜像仓库
docker login --username=你的阿里云账号 registry.cn-hangzhou.aliyuncs.com

# 输入密码
```

### 步骤 5：拉取并启动服务

```bash
# 拉取最新镜像
docker-compose pull

# 启动服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f server
```

### 步骤 6：配置 Nginx 反向代理（可选）

创建 `/etc/nginx/sites-available/quitsmoking`：

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

启用配置：

```bash
# 创建软链接
ln -s /etc/nginx/sites-available/quitsmoking /etc/nginx/sites-enabled/

# 测试配置
nginx -t

# 重启 Nginx
systemctl restart nginx
```

## 五、更新部署流程

### 在 Mac Mini 本地

```bash
# 1. 更新代码
git pull

# 2. 构建新版本镜像
docker build -t registry.cn-hangzhou.aliyuncs.com/你的命名空间/quitsmoking-server:v1.0.1 ./server

# 3. 同时打上 latest 标签
docker tag registry.cn-hangzhou.aliyuncs.com/你的命名空间/quitsmoking-server:v1.0.1 \
           registry.cn-hangzhou.aliyuncs.com/你的命名空间/quitsmoking-server:latest

# 4. 推送镜像
docker push registry.cn-hangzhou.aliyuncs.com/你的命名空间/quitsmoking-server:v1.0.1
docker push registry.cn-hangzhou.aliyuncs.com/你的命名空间/quitsmoking-server:latest
```

### 在服务器上

```bash
# 1. 进入项目目录
cd /opt/quitsmoking

# 2. 拉取最新镜像
docker-compose pull

# 3. 重启服务
docker-compose up -d

# 4. 查看日志确认更新成功
docker-compose logs -f server
```

## 六、常用运维命令

### 查看服务状态

```bash
# 查看所有容器
docker-compose ps

# 查看资源使用
docker stats

# 查看日志
docker-compose logs -f
docker-compose logs -f server
docker-compose logs -f mongodb
```

### 备份数据库

```bash
# 导出数据
docker-compose exec mongodb mongodump --db quitsmoking --out /data/backup

# 复制到宿主机
docker cp quitsmoking-mongodb:/data/backup ./backup-$(date +%Y%m%d)

# 压缩备份
tar -czf backup-$(date +%Y%m%d).tar.gz backup-$(date +%Y%m%d)
```

### 恢复数据库

```bash
# 解压备份
tar -xzf backup-20260311.tar.gz

# 复制到容器
docker cp backup-20260311 quitsmoking-mongodb:/data/backup

# 恢复数据
docker-compose exec mongodb mongorestore --db quitsmoking /data/backup/quitsmoking
```

### 清理旧镜像

```bash
# 查看所有镜像
docker images

# 删除旧版本镜像
docker rmi registry.cn-hangzhou.aliyuncs.com/你的命名空间/quitsmoking-server:v1.0.0

# 清理未使用的镜像
docker image prune -a
```

## 七、故障排查

### 服务无法启动

```bash
# 查看详细日志
docker-compose logs server

# 检查端口占用
netstat -tlnp | grep 3000

# 重启服务
docker-compose restart server
```

### 镜像拉取失败

```bash
# 检查登录状态
docker login --username=你的阿里云账号 registry.cn-hangzhou.aliyuncs.com

# 手动拉取镜像
docker pull registry.cn-hangzhou.aliyuncs.com/你的命名空间/quitsmoking-server:latest

# 检查网络连接
ping registry.cn-hangzhou.aliyuncs.com
```

### MongoDB 连接失败

```bash
# 检查 MongoDB 容器状态
docker-compose ps mongodb

# 查看 MongoDB 日志
docker-compose logs mongodb

# 进入容器测试连接
docker-compose exec server sh
ping mongodb
```

## 八、安全建议

1. **修改默认密钥**：更改 `JWT_SECRET` 为强随机字符串
2. **配置防火墙**：只开放必要端口（80, 443）
3. **启用 HTTPS**：使用 Let's Encrypt 免费证书
4. **定期备份**：设置自动备份脚本
5. **监控日志**：配置日志监控和告警
6. **限制访问**：配置 IP 白名单或使用 VPN

## 九、自动化部署脚本

### 本地构建推送脚本 `deploy.sh`

```bash
#!/bin/bash

# 配置变量
REGISTRY="registry.cn-hangzhou.aliyuncs.com"
NAMESPACE="你的命名空间"
IMAGE_NAME="quitsmoking-server"
VERSION=${1:-latest}

# 构建镜像
echo "构建镜像..."
docker build -t ${REGISTRY}/${NAMESPACE}/${IMAGE_NAME}:${VERSION} ./server

# 打标签
if [ "$VERSION" != "latest" ]; then
    docker tag ${REGISTRY}/${NAMESPACE}/${IMAGE_NAME}:${VERSION} \
               ${REGISTRY}/${NAMESPACE}/${IMAGE_NAME}:latest
fi

# 推送镜像
echo "推送镜像..."
docker push ${REGISTRY}/${NAMESPACE}/${IMAGE_NAME}:${VERSION}

if [ "$VERSION" != "latest" ]; then
    docker push ${REGISTRY}/${NAMESPACE}/${IMAGE_NAME}:latest
fi

echo "部署完成！"
echo "在服务器上执行以下命令更新："
echo "cd /opt/quitsmoking && docker-compose pull && docker-compose up -d"
```

使用方法：

```bash
# 赋予执行权限
chmod +x deploy.sh

# 部署最新版本
./deploy.sh

# 部署指定版本
./deploy.sh v1.0.1
```

### 服务器更新脚本 `update.sh`

```bash
#!/bin/bash

cd /opt/quitsmoking

echo "拉取最新镜像..."
docker-compose pull

echo "重启服务..."
docker-compose up -d

echo "查看服务状态..."
docker-compose ps

echo "更新完成！"
```

## 十、监控和日志

### 配置日志轮转

创建 `/etc/logrotate.d/quitsmoking`：

```
/opt/quitsmoking/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 root root
}
```

### 简单监控脚本

```bash
#!/bin/bash

# 检查服务是否运行
if ! docker-compose ps | grep -q "Up"; then
    echo "服务异常，尝试重启..."
    docker-compose restart
    # 发送告警通知（可接入钉钉、企业微信等）
fi
```

添加到 crontab：

```bash
# 每5分钟检查一次
*/5 * * * * /opt/quitsmoking/monitor.sh
```
