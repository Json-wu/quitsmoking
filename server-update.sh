#!/bin/bash

# 服务器端更新脚本
# 在服务器上执行此脚本来更新服务

set -e

echo "========================================="
echo "  戒烟小程序后端 - 服务更新"
echo "========================================="
echo ""

# 检查是否在项目目录
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ 错误: 请在项目目录执行此脚本"
    exit 1
fi

# 步骤1: 拉取最新镜像
echo "📥 [1/3] 拉取最新镜像..."
docker-compose pull

if [ $? -ne 0 ]; then
    echo "❌ 镜像拉取失败"
    exit 1
fi

echo "✅ 镜像拉取成功"
echo ""

# 步骤2: 重启服务
echo "🔄 [2/3] 重启服务..."
docker-compose up -d

if [ $? -ne 0 ]; then
    echo "❌ 服务启动失败"
    exit 1
fi

echo "✅ 服务启动成功"
echo ""

# 步骤3: 查看服务状态
echo "📊 [3/3] 服务状态:"
docker-compose ps
echo ""

# 完成
echo "========================================="
echo "🎉 更新完成！"
echo "========================================="
echo ""
echo "📝 查看日志:"
echo "   docker-compose logs -f server"
echo ""
echo "📊 查看服务状态:"
echo "   docker-compose ps"
echo ""
echo "🔍 测试 API:"
echo "   curl http://localhost:3000/api/login -X POST -H 'Content-Type: application/json' -d '{\"openid\":\"test\"}'"
echo ""
