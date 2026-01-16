// cloudfunctions/initDB/index.js
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

// 数据库集合配置
const collections = [
  {
    name: 'users',
    description: '用户表'
  },
  {
    name: 'checkins',
    description: '签到表'
  },
  {
    name: 'cigarettes',
    description: '电子烟记录表'
  },
  {
    name: 'certificates',
    description: '证书记录表'
  },
  {
    name: 'articles',
    description: '文章表'
  },
  {
    name: 'collections',
    description: '用户收藏表'
  },
  {
    name: 'likes',
    description: '用户点赞表'
  },
  {
    name: 'badges',
    description: '勋章记录表'
  },
  {
    name: 'shares',
    description: '分享记录表'
  }
];

/**
 * 数据库初始化云函数
 * 自动创建所有必需的数据库集合
 */
exports.main = async (event, context) => {
  const results = {
    created: [],
    existing: [],
    failed: []
  };

  console.log('开始初始化数据库集合...');

  for (const collection of collections) {
    try {
      // 尝试查询集合，如果不存在会抛出错误
      await db.collection(collection.name).limit(1).get();
      results.existing.push(collection.name);
      console.log(`- 集合已存在: ${collection.name} (${collection.description})`);
    } catch (err) {
      // 集合不存在，尝试创建
      if (err.errCode === -1 || err.errMsg.includes('collection not exist')) {
        try {
          await db.createCollection(collection.name);
          results.created.push(collection.name);
          console.log(`✓ 创建集合成功: ${collection.name} (${collection.description})`);
        } catch (createErr) {
          results.failed.push({
            name: collection.name,
            error: createErr.errMsg || createErr.message
          });
          console.error(`✗ 创建集合失败: ${collection.name}`, createErr);
        }
      } else {
        results.failed.push({
          name: collection.name,
          error: err.errMsg || err.message
        });
        console.error(`✗ 检查集合失败: ${collection.name}`, err);
      }
    }
  }

  const summary = {
    total: collections.length,
    created: results.created.length,
    existing: results.existing.length,
    failed: results.failed.length
  };

  console.log('数据库初始化完成:', summary);

  return {
    success: results.failed.length === 0,
    summary,
    results
  };
};
