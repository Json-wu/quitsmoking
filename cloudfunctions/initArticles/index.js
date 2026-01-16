// 文章初始化云函数 - 只执行一次
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  try {
    const now = new Date();
    
    // 检查是否已经初始化过
    const existingArticles = await db.collection('articles').count();
    if (existingArticles.total > 0) {
      return {
        success: false,
        message: '文章已经初始化过了，如需重新初始化请先清空集合',
        total: existingArticles.total
      };
    }
    
    // 读取文章数据
    const articlesData = require('./articles.json');
    
    // 为每篇文章添加时间戳
    const articles = articlesData.map(article => ({
      ...article,
      publishTime: now,
      createTime: now,
      updateTime: now
    }));
    
    // 批量插入文章（每次最多20条）
    const batchSize = 20;
    let insertedCount = 0;
    
    for (let i = 0; i < articles.length; i += batchSize) {
      const batch = articles.slice(i, i + batchSize);
      const promises = batch.map(article => 
        db.collection('articles').add({
          data: article
        })
      );
      
      await Promise.all(promises);
      insertedCount += batch.length;
      console.log(`已插入 ${insertedCount}/${articles.length} 篇文章`);
    }
    
    return {
      success: true,
      message: '文章初始化成功',
      total: insertedCount,
      categories: {
        scientific: articles.filter(a => a.category === 'scientific').length,
        psychology: articles.filter(a => a.category === 'psychology').length,
        lifestyle: articles.filter(a => a.category === 'lifestyle').length,
        coping: articles.filter(a => a.category === 'coping').length
      }
    };
    
  } catch (err) {
    console.error('初始化失败:', err);
    return {
      success: false,
      message: '初始化失败',
      error: err.message
    };
  }
};
