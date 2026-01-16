// utils/dbInit.js - 数据库初始化检查工具

/**
 * 数据库集合配置
 */
const DB_COLLECTIONS = [
  {
    name: 'users',
    description: '用户表',
    required: true
  },
  {
    name: 'checkins',
    description: '签到表',
    required: true
  },
  {
    name: 'cigarettes',
    description: '电子烟记录表',
    required: true
  },
  {
    name: 'certificates',
    description: '证书记录表',
    required: true
  },
  {
    name: 'articles',
    description: '文章表',
    required: true
  },
  {
    name: 'collections',
    description: '用户收藏表',
    required: false
  },
  {
    name: 'likes',
    description: '用户点赞表',
    required: false
  },
  {
    name: 'badges',
    description: '勋章记录表',
    required: false
  },
  {
    name: 'shares',
    description: '分享记录表',
    required: false
  }
];

/**
 * 检查数据库集合是否存在
 * @returns {Promise<Object>} 检查结果
 */
const checkCollections = async () => {
  const db = wx.cloud.database();
  const results = {
    success: true,
    missing: [],
    existing: [],
    errors: []
  };

  for (const collection of DB_COLLECTIONS) {
    try {
      // 尝试查询集合（限制1条记录）
      await db.collection(collection.name).limit(1).get();
      results.existing.push(collection);
      console.log(`✓ 集合 ${collection.name} (${collection.description}) 存在`);
    } catch (err) {
      if (err.errCode === -1 || err.errMsg.includes('collection not exist')) {
        // 集合不存在
        results.missing.push(collection);
        if (collection.required) {
          results.success = false;
        }
        console.warn(`✗ 集合 ${collection.name} (${collection.description}) 不存在`);
      } else {
        // 其他错误
        results.errors.push({
          collection,
          error: err
        });
        console.error(`! 检查集合 ${collection.name} 时出错:`, err);
      }
    }
  }

  return results;
};

/**
 * 显示数据库检查结果
 * @param {Object} results - 检查结果
 */
const showCheckResults = (results) => {
  if (results.success) {
    console.log('✓ 数据库检查通过，所有必需集合都已创建');
    return true;
  }

  const missingRequired = results.missing.filter(c => c.required);
  
  if (missingRequired.length > 0) {
    const missingNames = missingRequired.map(c => `${c.name}(${c.description})`).join('、');
    
    wx.showModal({
      title: '数据库未初始化',
      content: `缺少必需的数据库集合：${missingNames}。\n\n请在云开发控制台创建这些集合后再使用。`,
      showCancel: false,
      confirmText: '我知道了'
    });

    console.error('缺少必需的数据库集合:', missingRequired);
    return false;
  }

  return true;
};

/**
 * 生成数据库初始化脚本
 * @returns {String} 初始化脚本
 */
const generateInitScript = () => {
  const script = `
/**
 * 云数据库初始化脚本
 * 请在云开发控制台的"云函数"中创建一个名为 initDB 的云函数
 * 将此代码复制到云函数的 index.js 中，然后上传部署
 * 在云开发控制台的"云函数"页面，右键点击 initDB 函数，选择"云端测试"运行
 */

const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

// 数据库集合配置
const collections = ${JSON.stringify(DB_COLLECTIONS, null, 2)};

exports.main = async (event, context) => {
  const results = {
    created: [],
    existing: [],
    failed: []
  };

  for (const collection of collections) {
    try {
      // 尝试创建集合（如果已存在会报错）
      await db.createCollection(collection.name);
      results.created.push(collection.name);
      console.log(\`✓ 创建集合: \${collection.name} (\${collection.description})\`);
    } catch (err) {
      if (err.errCode === -1 && err.errMsg.includes('already exists')) {
        results.existing.push(collection.name);
        console.log(\`- 集合已存在: \${collection.name}\`);
      } else {
        results.failed.push({
          name: collection.name,
          error: err.errMsg
        });
        console.error(\`✗ 创建集合失败: \${collection.name}\`, err);
      }
    }
  }

  return {
    success: results.failed.length === 0,
    results
  };
};
`;

  return script;
};

/**
 * 初始化数据库检查
 * @param {Boolean} showModal - 是否显示检查结果弹窗
 * @returns {Promise<Boolean>} 检查是否通过
 */
const initDBCheck = async (showModal = true) => {
  try {
    console.log('开始检查数据库集合...');
    const results = await checkCollections();
    
    if (showModal) {
      return showCheckResults(results);
    }
    
    return results.success;
  } catch (err) {
    console.error('数据库检查失败:', err);
    return false;
  }
};

module.exports = {
  DB_COLLECTIONS,
  checkCollections,
  showCheckResults,
  generateInitScript,
  initDBCheck
};
