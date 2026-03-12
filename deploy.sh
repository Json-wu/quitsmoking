#!/bin/bash

# 阿里云镜像仓库部署脚本
# 使用方法: ./deploy.sh [版本号]
# 示例: ./deploy.sh v1.0.0 或 ./deploy.sh (默认使用latest)

set -e

# ==================== 配置区域 ====================
# 请根据你的实际情况修改以下配置

REGISTRY="crpi-g5p50ww96ven4gi1.cn-shanghai.personal.cr.aliyuncs.com"  # 阿里云镜像仓库地址（根据区域修改）
NAMESPACE="futurekeycom"                       # 阿里云命名空间
IMAGE_NAME="quitsmoking"               # 镜像名称
VERSION=${1:-latest}                          # 版本号，默认为latest

# ==================== 脚本开始 ====================

echo "========================================="
echo "  戒烟小程序后端 - Docker 镜像部署"
echo "========================================="
echo ""

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ 错误: Docker 未安装，请先安装 Docker"
    exit 1
fi

# 检查是否在项目根目录
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ 错误: 请在项目根目录执行此脚本"
    exit 1
fi

# 完整镜像名称
FULL_IMAGE_NAME="${REGISTRY}/${NAMESPACE}/${IMAGE_NAME}"

echo "📦 镜像信息:"
echo "   仓库地址: ${REGISTRY}"
echo "   命名空间: ${NAMESPACE}"
echo "   镜像名称: ${IMAGE_NAME}"
echo "   版本号:   ${VERSION}"
echo ""

# 步骤1: 构建多平台镜像
echo "🔨 [1/4] 构建多平台 Docker 镜像（AMD64 + ARM64）..."
echo "   提示: 这将构建适用于 Linux 服务器的 AMD64 架构镜像"
echo ""

# 创建并使用 buildx builder（如果不存在）
if ! docker buildx ls | grep -q multiarch; then
    echo "   创建 buildx builder..."
    docker buildx create --name multiarch --use
    docker buildx inspect --bootstrap
fi

# 构建多平台镜像并推送
docker buildx build \
    --platform linux/amd64,linux/arm64 \
    -t ${FULL_IMAGE_NAME}:${VERSION} \
    --push \
    ./server

if [ $? -ne 0 ]; then
    echo "❌ 镜像构建失败"
    exit 1
fi

echo "✅ 镜像构建并推送成功"
echo ""

# 步骤2: 构建并推送 latest 标签（如果需要）
if [ "$VERSION" != "latest" ]; then
    echo "🏷️  [2/2] 构建并推送 latest 标签..."
    docker buildx build \
        --platform linux/amd64,linux/arm64 \
        -t ${FULL_IMAGE_NAME}:latest \
        --push \
        ./server
    
    if [ $? -ne 0 ]; then
        echo "❌ latest 标签推送失败"
        exit 1
    fi
    echo "✅ latest 标签推送成功"
else
    echo "⏭️  [2/2] 跳过 latest 标签（已构建）"
fi
echo ""

# 完成
echo "========================================="
echo "🎉 部署完成！"
echo "========================================="
echo ""
echo "📋 镜像信息:"
echo "   ${FULL_IMAGE_NAME}:${VERSION}"
if [ "$VERSION" != "latest" ]; then
    echo "   ${FULL_IMAGE_NAME}:latest"
fi
echo ""
echo "🏗️  支持平台:"
echo "   - linux/amd64 (Linux 服务器)"
echo "   - linux/arm64 (Mac M1/M2)"
echo ""
echo "📝 下一步操作:"
echo "   1. SSH 登录到服务器"
echo "   2. 进入项目目录: cd /opt/quitsmoking"
echo "   3. 拉取最新镜像: docker-compose pull"
echo "   4. 重启服务: docker-compose up -d"
echo "   5. 查看日志: docker-compose logs -f server"
echo ""
echo "💡 快捷命令:"
echo "   ssh root@你的服务器IP 'cd /opt/quitsmoking && docker-compose pull && docker-compose up -d'"
echo ""
