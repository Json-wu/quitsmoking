# 文章点赞和收藏功能说明

## 功能概述

实现了文章的点赞、取消点赞、收藏、取消收藏功能，用户可以对喜欢的文章进行互动操作。

## 云函数

### 1. likeArticle - 点赞文章

**功能**：为文章添加点赞

**参数**：
```javascript
{
  articleId: "文章ID"
}
```

**返回**：
```javascript
{
  success: true/false,
  message: "点赞成功" / "已经点赞过了"
}
```

**逻辑**：
1. 检查用户是否已经点赞过该文章
2. 如果已点赞，返回提示信息
3. 如果未点赞，添加点赞记录到 `likes` 集合
4. 更新文章的 `likeCount` 字段（+1）

**文件位置**：`/cloudfunctions/likeArticle/index.js`

---

### 2. unlikeArticle - 取消点赞

**功能**：取消对文章的点赞

**参数**：
```javascript
{
  articleId: "文章ID"
}
```

**返回**：
```javascript
{
  success: true/false,
  message: "取消点赞成功" / "还未点赞"
}
```

**逻辑**：
1. 查找用户的点赞记录
2. 如果未找到，返回提示信息
3. 如果找到，删除点赞记录
4. 更新文章的 `likeCount` 字段（-1）

**文件位置**：`/cloudfunctions/unlikeArticle/index.js`

---

### 3. collectArticle - 收藏文章

**功能**：收藏文章

**参数**：
```javascript
{
  articleId: "文章ID"
}
```

**返回**：
```javascript
{
  success: true/false,
  message: "收藏成功" / "已经收藏过了"
}
```

**逻辑**：
1. 检查用户是否已经收藏过该文章
2. 如果已收藏，返回提示信息
3. 获取文章信息（标题等）
4. 添加收藏记录到 `collections` 集合，包含文章标题
5. 更新文章的 `collectCount` 字段（+1）

**文件位置**：`/cloudfunctions/collectArticle/index.js`

---

### 4. uncollectArticle - 取消收藏

**功能**：取消收藏文章

**参数**：
```javascript
{
  articleId: "文章ID"
}
```

**返回**：
```javascript
{
  success: true/false,
  message: "取消收藏成功" / "还未收藏"
}
```

**逻辑**：
1. 查找用户的收藏记录
2. 如果未找到，返回提示信息
3. 如果找到，删除收藏记录
4. 更新文章的 `collectCount` 字段（-1）

**文件位置**：`/cloudfunctions/uncollectArticle/index.js`

---

## 数据库结构

### likes 集合（点赞记录）

```javascript
{
  _id: "记录ID",
  _openid: "用户openid",
  articleId: "文章ID",
  createTime: Date  // 点赞时间
}
```

**索引建议**：
- `_openid` + `articleId` 复合索引（用于快速查询用户是否点赞）

---

### collections 集合（收藏记录）

```javascript
{
  _id: "记录ID",
  _openid: "用户openid",
  articleId: "文章ID",
  articleTitle: "文章标题",  // 冗余字段，便于收藏列表展示
  createTime: Date  // 收藏时间
}
```

**索引建议**：
- `_openid` + `articleId` 复合索引（用于快速查询用户是否收藏）
- `_openid` + `createTime` 复合索引（用于收藏列表按时间排序）

---

## 前端实现

### 文章服务（article.js）

```javascript
// 点赞文章
async likeArticle(articleId) {
  const result = await callFunction('likeArticle', { articleId });
  return result;
}

// 取消点赞
async unlikeArticle(articleId) {
  const result = await callFunction('unlikeArticle', { articleId });
  return result;
}

// 收藏文章
async collectArticle(articleId) {
  const result = await callFunction('collectArticle', { articleId });
  return result;
}

// 取消收藏
async uncollectArticle(articleId) {
  const result = await callFunction('uncollectArticle', { articleId });
  return result;
}
```

---

### 文章列表页面（methods.js）

**点赞/取消点赞逻辑**：

```javascript
async handleLike(e) {
  const { id } = e.currentTarget.dataset;
  
  // 找到当前文章
  const article = this.data.articles.find(item => item._id === id);
  if (!article) return;

  try {
    let result;
    
    // 根据当前状态调用不同的接口
    if (article.isLiked) {
      result = await articleService.unlikeArticle(id);
    } else {
      result = await articleService.likeArticle(id);
    }
    
    if (result.success) {
      // 更新文章列表中的点赞状态
      const articles = this.data.articles.map(item => {
        if (item._id === id) {
          return {
            ...item,
            isLiked: !item.isLiked,
            likeCount: item.isLiked ? item.likeCount - 1 : item.likeCount + 1
          };
        }
        return item;
      });

      this.setData({ articles });
      wx.showToast({ title: result.message, icon: 'success' });
    }
  } catch (err) {
    console.error('点赞操作失败:', err);
  }
}
```

---

### WXML 模板

```xml
<view class="meta-item" catchtap="handleLike" data-id="{{ item._id }}">
  <text class="icon">{{ item.isLiked ? '❤️' : '🤍' }}</text>
  <text class="count">{{ item.likeCount }}</text>
</view>
```

**图标说明**：
- 未点赞：🤍（白心）
- 已点赞：❤️（红心）

---

## 部署步骤

### 1. 上传云函数

在微信开发者工具中，分别上传以下云函数：

```bash
# 右键每个云函数文件夹，选择"上传并部署：云端安装依赖"
cloudfunctions/likeArticle/
cloudfunctions/unlikeArticle/
cloudfunctions/collectArticle/
cloudfunctions/uncollectArticle/
```

### 2. 创建数据库集合

在云开发控制台中创建以下集合：

- `likes` - 点赞记录表
- `collections` - 收藏记录表

**注意**：这两个集合会在用户首次点赞/收藏时自动创建，也可以手动提前创建。

### 3. 配置数据库索引（可选，提升性能）

**likes 集合**：
```javascript
{
  "_openid": 1,
  "articleId": 1
}
```

**collections 集合**：
```javascript
{
  "_openid": 1,
  "articleId": 1
}
```

---

## 使用流程

### 用户点赞流程

1. 用户点击文章卡片上的点赞图标
2. 前端判断当前点赞状态
3. 如果未点赞，调用 `likeArticle` 云函数
4. 云函数添加点赞记录，更新文章点赞数
5. 前端更新UI，显示红心和新的点赞数

### 用户取消点赞流程

1. 用户再次点击已点赞的文章图标
2. 前端判断当前是已点赞状态
3. 调用 `unlikeArticle` 云函数
4. 云函数删除点赞记录，更新文章点赞数
5. 前端更新UI，显示白心和新的点赞数

### 收藏流程（类似）

收藏和取消收藏的流程与点赞类似，只是操作的集合和字段不同。

---

## 数据一致性保证

### 1. 防重复操作

云函数在执行前会先检查记录是否存在：
- 点赞前检查是否已点赞
- 收藏前检查是否已收藏
- 取消操作前检查记录是否存在

### 2. 原子性更新

使用数据库的 `_.inc()` 方法进行原子性计数更新：

```javascript
// 点赞数 +1
likeCount: _.inc(1)

// 点赞数 -1
likeCount: _.inc(-1)
```

这确保了即使多个用户同时操作，计数也不会出错。

### 3. 错误处理

所有云函数都包含完整的错误处理：
- try-catch 捕获异常
- 返回统一的错误格式
- 前端显示友好的错误提示

---

## 性能优化

### 1. 批量查询优化

在文章列表页面，使用批量查询获取用户的点赞和收藏状态：

```javascript
// 一次性查询所有文章的点赞状态
const likesResult = await db.collection('likes').where({
  _openid: wxContext.OPENID,
  articleId: _.in(articleIds)  // 批量查询
}).get();
```

### 2. 前端状态管理

前端维护文章的点赞/收藏状态，避免频繁请求：
- 操作成功后立即更新本地状态
- 刷新页面时重新获取最新状态

### 3. 乐观更新

前端采用乐观更新策略：
- 用户点击后立即更新UI
- 后台异步调用云函数
- 如果失败，回滚UI状态

---

## 注意事项

1. **权限控制**：所有操作都基于 `_openid`，确保用户只能操作自己的记录
2. **数据校验**：云函数会验证 `articleId` 是否有效
3. **并发处理**：使用数据库的原子操作避免并发问题
4. **错误提示**：为用户提供清晰的操作反馈
5. **性能考虑**：合理使用索引，优化查询性能

---

## 扩展功能

### 未来可以添加的功能

1. **点赞动画**：添加点赞时的动画效果
2. **点赞列表**：查看谁点赞了文章
3. **收藏分类**：支持收藏夹分类管理
4. **收藏笔记**：收藏时添加个人笔记
5. **分享统计**：记录文章分享次数
6. **热度排序**：根据点赞数、收藏数排序文章
7. **推荐算法**：基于用户点赞/收藏推荐相似文章

---

## 故障排查

### 问题1：点赞后数字没有变化

**可能原因**：
- 云函数未正确更新文章的 `likeCount`
- 前端未正确更新状态

**解决方法**：
1. 检查云函数日志
2. 确认数据库中的 `likeCount` 是否更新
3. 检查前端状态更新逻辑

### 问题2：重复点赞

**可能原因**：
- 云函数的重复检查逻辑失效
- 数据库查询条件不正确

**解决方法**：
1. 检查 `where` 条件是否正确
2. 确认 `_openid` 和 `articleId` 都存在
3. 添加数据库唯一索引

### 问题3：点赞数不准确

**可能原因**：
- 使用了非原子操作
- 并发操作导致数据不一致

**解决方法**：
1. 确保使用 `_.inc()` 进行计数更新
2. 不要使用先读后写的方式更新计数

---

## 文件结构

```
miniprogram/
├── pages/
│   └── methods/
│       ├── methods.js       # 文章列表页面逻辑
│       ├── methods.wxml     # 文章列表页面结构
│       └── methods.wxss     # 文章列表页面样式
└── services/
    └── article.js           # 文章服务

cloudfunctions/
├── likeArticle/             # 点赞云函数
│   ├── index.js
│   ├── config.json
│   └── package.json
├── unlikeArticle/           # 取消点赞云函数
│   ├── index.js
│   ├── config.json
│   └── package.json
├── collectArticle/          # 收藏云函数
│   ├── index.js
│   ├── config.json
│   └── package.json
└── uncollectArticle/        # 取消收藏云函数
    ├── index.js
    ├── config.json
    └── package.json
```
