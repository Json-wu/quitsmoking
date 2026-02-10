const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const { connectMongo } = require('./mongo');
const { requireAuth } = require('./middleware/requireAuth');

const {
  authRoutes,
  userRoutes,
  checkinRoutes,
  badgeRoutes,
  cigaretteRoutes
} = require('./routes');

async function main() {
  await connectMongo();

  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan('dev'));

  app.get('/health', (req, res) => {
    res.json({ ok: true });
  });

  app.use('/auth', authRoutes);

  app.use('/api', requireAuth);
  app.use('/api/user', userRoutes);
  app.use('/api/checkin', checkinRoutes);
  app.use('/api/badges', badgeRoutes);
  app.use('/api/cigarette', cigaretteRoutes);

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
