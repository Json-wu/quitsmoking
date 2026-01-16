# 证书边框图片使用说明

## 方案说明

为了让证书更美观，建议使用图片边框代替代码绘制的边框。

## 推荐的边框图片来源

### 1. 免费素材网站

**Unsplash**（免费商用）
- 网址：https://unsplash.com/
- 搜索关键词：
  - "certificate border"
  - "chinese border"
  - "vintage frame"
  - "gold frame"
  - "red border"

**Pixabay**（免费商用）
- 网址：https://pixabay.com/
- 搜索关键词：
  - "证书边框"
  - "中国风边框"
  - "古典边框"

**Pexels**（免费商用）
- 网址：https://www.pexels.com/
- 搜索关键词：
  - "frame border"
  - "certificate frame"

### 2. 中国风素材网站

**千图网**
- 网址：https://www.58pic.com/
- 搜索：证书边框、荣誉证书边框

**千库网**
- 网址：https://588ku.com/
- 搜索：证书边框PNG、中国风边框

**觅元素**
- 网址：http://www.51yuansu.com/
- 搜索：证书边框、奖状边框

## 使用步骤

### 方式一：使用本地图片（推荐）

1. **下载边框图片**
   - 从上述网站下载5张不同风格的边框图片
   - 建议尺寸：800x600 或更大
   - 格式：PNG（支持透明背景）

2. **放置图片到项目**
   ```
   /miniprogram/assets/images/certificate/
   ├── border-beginner.png    # 初级证书边框
   ├── border-intermediate.png # 中级证书边框
   ├── border-advanced.png     # 高级证书边框
   ├── border-expert.png       # 专家证书边框
   └── border-master.png       # 大师证书边框
   ```

3. **更新配置**
   在 `certificate.js` 中修改配置：
   ```javascript
   getCertificateConfig(level) {
     const configs = {
       beginner: {
         name: '初级证书',
         color: '#D2691E',
         borderImage: '/assets/images/certificate/border-beginner.png'
       },
       // ... 其他等级
     };
   }
   ```

### 方式二：使用网络图片

如果使用网络图片，需要：

1. **配置域名白名单**
   在 `project.config.json` 中添加：
   ```json
   {
     "setting": {
       "urlCheck": true
     },
     "networkTimeout": {
       "downloadFile": 60000
     }
   }
   ```

2. **在小程序后台配置**
   - 登录微信小程序后台
   - 开发 → 开发管理 → 开发设置 → 服务器域名
   - 添加 downloadFile 合法域名

## 推荐的边框样式

### 初级证书（7天）
- 风格：简约、清新
- 颜色：浅金色、米色
- 装饰：简单线条

### 中级证书（30天）
- 风格：稳重、典雅
- 颜色：红色、棕色
- 装饰：花纹装饰

### 高级证书（90天）
- 风格：华丽、精致
- 颜色：深红、金色
- 装饰：复杂花纹

### 专家证书（180天）
- 风格：庄重、大气
- 颜色：深红、金边
- 装饰：龙凤图案

### 大师证书（365天）
- 风格：尊贵、辉煌
- 颜色：中国红、金色
- 装饰：祥云、印章

## 图片要求

1. **尺寸**：建议 800x600 或 1000x750
2. **格式**：PNG（支持透明背景）
3. **大小**：控制在 200KB 以内
4. **分辨率**：72-150 DPI
5. **中心留白**：确保中间有足够空间显示文字

## 当前实现

代码已经支持图片边框，包含：
- ✅ 图片加载功能
- ✅ 加载失败降级方案（使用简单边框）
- ✅ 不同等级配置不同边框
- ✅ 异步加载处理

## 下一步

1. 选择并下载合适的边框图片
2. 放置到项目的 `/miniprogram/assets/images/certificate/` 目录
3. 更新 `certificate.js` 中的 `borderImage` 路径
4. 测试生成效果

## 注意事项

- 使用本地图片比网络图片更稳定
- 图片不宜过大，影响加载速度
- 确保图片中心区域留白，不遮挡文字
- 测试不同等级的证书效果
