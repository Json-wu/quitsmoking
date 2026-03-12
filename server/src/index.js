const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();
const mongoose = require('mongoose');

const { connectMongo } = require('./mongo');
const { requireAuth } = require('./middleware/requireAuth');

const {
  authRoutes,
  userRoutes,
  checkinRoutes,
  cigaretteRoutes
} = require('./routes');

const apiRoutes = require('./routes/api');

async function main() {
  await connectMongo();

  const app = express();

  const PORT = process.env.PORT || 3000;

  // 连接MongoDB
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quitsmoking';
  mongoose.connect(MONGODB_URI)
    .then(() => console.log('MongoDB连接成功'))
    .catch(err => console.error('MongoDB连接失败:', err));

  // 中间件
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan('dev'));

  app.get('/api/health', (req, res) => {
    res.json({ ok: true });
  });

  // 认证路由（无需JWT）
  app.use('/api/auth', authRoutes);

  // 挂载RESTful风格的API路由（需要JWT认证）
  app.use('/api/user', requireAuth, userRoutes);
  app.use('/api/cigarette', requireAuth, cigaretteRoutes);

  // 挂载统一API路由（用于云函数迁移的兼容接口，无需JWT）
  // 注意：这个要放在最后，因为它会匹配所有 /api/* 路径
  app.use('/api', apiRoutes);

  app.use((err, req, res, next) => {
    const status = err.statusCode || 500;
    res.status(status).json({
      success: false,
      message: err.message || 'Server error'
    });
  });

  const port = Number(process.env.PORT || 3000);
  app.listen(port, () => {
    console.log(`API server listening on http://localhost:${port}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
