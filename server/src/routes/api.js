// API路由
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const checkinController = require('../controllers/checkinController');
const cigaretteController = require('../controllers/cigaretteController');

// 用户相关
router.post('/login', userController.login);
router.post('/getUserStats', userController.getUserStats);
router.post('/setQuitDate', userController.setQuitDate);
router.post('/updateSmokingData', userController.updateSmokingData);

// 签到相关
router.post('/checkIn', checkinController.checkIn);
router.post('/makeUpCheckIn', checkinController.makeUpCheckIn);
router.post('/getCheckinRecords', checkinController.getCheckinRecords);
router.post('/getTodayCheckinCount', checkinController.getTodayCheckinCount);

// 电子烟相关
router.post('/recordPuff', cigaretteController.recordPuff);
router.post('/recordShare', cigaretteController.recordShare);
router.post('/getCigaretteStats', cigaretteController.getCigaretteStats);

// 数据库初始化
router.post('/initDB', userController.initDB);

module.exports = router;
