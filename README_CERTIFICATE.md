# 荣誉证书功能说明

## 功能概述

荣誉证书功能根据用户的戒烟天数，生成不同等级的专属证书。证书支持保存到相册和分享给好友。

## 证书等级

根据戒烟天数，证书分为5个等级，每个等级有独特的边框样式：

### 1. 初级证书 🌱
- **解锁条件**：戒烟满 7 天
- **边框样式**：简单单线边框
- **颜色主题**：蓝色 (#4A90E2)

### 2. 中级证书 🌳
- **解锁条件**：戒烟满 30 天
- **边框样式**：双线边框
- **颜色主题**：绿色 (#50C878)

### 3. 高级证书 🛡️
- **解锁条件**：戒烟满 90 天
- **边框样式**：装饰性边框，四角带圆点装饰
- **颜色主题**：紫色 (#9B59B6)

### 4. 专家证书 🏆
- **解锁条件**：戒烟满 180 天
- **边框样式**：华丽多层边框，带虚线装饰
- **颜色主题**：金色 (#F39C12)

### 5. 大师证书 👑
- **解锁条件**：戒烟满 365 天
- **边框样式**：彩虹渐变多层边框，五角星装饰
- **颜色主题**：彩虹渐变（红、黄、绿、蓝、紫）

## 功能特性

### 1. 证书生成
- 使用 Canvas 2D API 绘制证书
- 根据等级自动应用不同的边框样式
- 包含用户信息、戒烟天数、获得日期等
- 高清输出（2倍分辨率）

### 2. 保存到相册
- 一键保存证书图片到手机相册
- 自动请求相册权限
- 权限被拒后引导用户到设置页面

### 3. 分享功能
- 支持分享证书到微信好友/群聊
- 分享卡片显示证书图片
- 自定义分享标题和路径

## 边框样式实现

### 初级证书（Beginner）
```javascript
// 简单单线边框
ctx.strokeStyle = config.bgGradient[0];
ctx.lineWidth = 3;
drawRoundRect(ctx, 30, 50, width - 60, height - 100, 12);
ctx.stroke();
```

### 中级证书（Intermediate）
```javascript
// 双线边框
ctx.strokeStyle = config.bgGradient[0];
ctx.lineWidth = 3;
drawRoundRect(ctx, 30, 50, width - 60, height - 100, 12);
ctx.stroke();
ctx.lineWidth = 2;
drawRoundRect(ctx, 36, 56, width - 72, height - 112, 10);
ctx.stroke();
```

### 高级证书（Advanced）
```javascript
// 装饰性边框 + 四角圆点
ctx.strokeStyle = config.bgGradient[0];
ctx.lineWidth = 4;
drawRoundRect(ctx, 30, 50, width - 60, height - 100, 12);
ctx.stroke();

// 四角装饰
const corners = [[30, 50], [width - 30, 50], ...];
corners.forEach(([x, y]) => {
  ctx.beginPath();
  ctx.arc(x, y, 6, 0, Math.PI * 2);
  ctx.fill();
});
```

### 专家证书（Expert）
```javascript
// 多层边框 + 虚线装饰
// 外层边框
ctx.strokeStyle = config.bgGradient[0];
ctx.lineWidth = 5;
drawRoundRect(ctx, 28, 48, width - 56, height - 96, 14);
ctx.stroke();

// 内层边框
ctx.strokeStyle = config.bgGradient[1];
ctx.lineWidth = 2;
drawRoundRect(ctx, 38, 58, width - 76, height - 116, 10);
ctx.stroke();

// 虚线装饰
ctx.setLineDash([5, 5]);
drawRoundRect(ctx, 33, 53, width - 66, height - 106, 12);
ctx.stroke();
```

### 大师证书（Master）
```javascript
// 彩虹渐变多层边框
const colors = config.bgGradient; // 5种颜色
for (let i = 0; i < 5; i++) {
  ctx.strokeStyle = colors[i % colors.length];
  ctx.lineWidth = 3;
  const offset = 28 + i * 3;
  drawRoundRect(ctx, offset, 48 + i * 3, width - offset * 2, height - 96 - i * 6, 14 - i);
  ctx.stroke();
}

// 五角星装饰
const stars = [[width / 2, 40], [50, 80], ...];
stars.forEach(([x, y]) => {
  drawStar(ctx, x, y, 8, 5);
});
```

### 3. 保存到相册
```javascript
handleSave() {
  // 调用微信API保存图片
  await wx.saveImageToPhotosAlbum({
    filePath: this.data.tempFilePath
  });
}
```

### 4. 分享证书
```javascript
onShareAppMessage() {
  return {
    title: `我已成功戒烟${quitDays}天，获得${certificateLevel}！`,
    path: '/pages/index/index',
    imageUrl: this.data.tempFilePath
  };
}
```

## 数据库结构

### certificates 集合
```javascript
{
  _id: "证书ID",
  _openid: "用户openid",
  level: "证书等级(beginner/intermediate/advanced/expert/master)",
  quitDays: 戒烟天数,
  createTime: "创建时间"
}
```

## 云函数

### generateCertificate
- **功能**：生成证书记录
- **参数**：`{ quitDays: Number }`
- **返回**：`{ success: Boolean, certificate: Object }`
- **逻辑**：
  1. 根据戒烟天数计算证书等级
  2. 检查是否已生成该等级证书
  3. 创建证书记录到数据库

## 注意事项

1. **权限申请**：首次保存到相册需要用户授权
2. **性能优化**：Canvas绘制采用2倍分辨率，确保图片清晰
3. **防重复生成**：同一等级证书只记录一次
4. **分享限制**：必须先生成证书才能分享
5. **等级解锁**：页面显示所有等级，未达到的显示为"未解锁"

## 文件结构

```
miniprogram/
├── pages/
│   └── certificate/
│       ├── certificate.js       # 页面逻辑
│       ├── certificate.wxml     # 页面结构
│       ├── certificate.wxss     # 页面样式
│       └── certificate.json     # 页面配置
├── services/
│   └── certificate.js           # 证书服务
└── utils/
    └── canvas.js                # Canvas工具函数

cloudfunctions/
└── generateCertificate/
    ├── index.js                 # 云函数入口
    ├── config.json              # 云函数配置
    └── package.json             # 依赖配置
```

## 未来优化方向

1. ✨ 添加更多证书模板样式
2. 🎨 支持用户自定义证书背景
3. 📊 添加证书分享统计
4. 🏅 添加特殊成就证书（如连续签到、零复吸等）
5. 💾 支持证书历史记录查看
6. 🖼️ 支持证书预览放大查看
7. 🎁 证书解锁奖励（如积分、勋章等）

## 技术要点

- **Canvas 2D API**：使用新版Canvas API，性能更好
- **渐变绘制**：支持线性和径向渐变背景
- **圆角矩形**：自定义圆角矩形绘制函数
- **文字居中**：自动计算文字位置实现居中
- **图片导出**：高清图片导出，支持自定义分辨率
- **权限处理**：优雅处理相册权限授权流程
