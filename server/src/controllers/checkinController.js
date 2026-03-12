// 签到控制器
const Checkin = require('../models/Checkin');

/**
 * 签到
 */
exports.checkIn = async (req, res) => {
  try {
    const { openid } = req.body;

    if (!openid) {
      return res.json({ success: false, message: '缺少openid' });
    }

    const today = new Date().toISOString().slice(0, 10);

    // 检查今天是否已签到
    const todayCheckin = await Checkin.findOne({ openid, date: today });
    if (todayCheckin) {
      return res.json({
        success: false,
        message: '今天已经签到过了'
      });
    }

    // 获取昨天的签到记录
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const yesterdayCheckin = await Checkin.findOne({ openid, date: yesterday });

    // 计算连续签到天数
    let continuousDays = 1;
    let totalDays = 1;

    if (yesterdayCheckin) {
      continuousDays = yesterdayCheckin.continuousDays + 1;
      totalDays = yesterdayCheckin.totalDays + 1;
    } else {
      // 获取总签到天数
      totalDays = await Checkin.countDocuments({ openid }) + 1;
    }

    // 添加签到记录
    await Checkin.create({
      openid,
      date: today,
      timestamp: Date.now(),
      isMakeUp: false,
      continuousDays,
      totalDays
    });
    
    // 如果用户第一次签到，更新用户信息里的quitDate
    if (totalDays === 1) {
      const User = require('../models/User');
      await User.updateOne({ openid }, { quitDate: today });
    }

    res.json({
      success: true,
      message: '签到成功',
      continuousDays,
      totalDays
    });
  } catch (err) {
    console.error('签到失败:', err);
    res.json({
      success: false,
      error: err.message
    });
  }
};

/**
 * 补签
 */
exports.makeUpCheckIn = async (req, res) => {
  try {
    const { openid, date } = req.body;

    if (!openid || !date) {
      return res.json({ success: false, message: '缺少必要参数' });
    }

    // 检查是否为本月日期
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const targetDate = new Date(date);
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth() + 1;

    if (targetYear !== currentYear || targetMonth !== currentMonth) {
      return res.json({
        success: false,
        message: '只可补签本月'
      });
    }

    // 检查该日期是否已经签到
    const existingCheckin = await Checkin.findOne({ openid, date });
    if (existingCheckin) {
      return res.json({
        success: false,
        message: '该日期已签到'
      });
    }

    const User = require('../models/User');
    const user = await User.findOne({ openid });
    
    if (!user) {
      return res.json({ success: false, message: '用户不存在' });
    }

    // 检查补签次数
    if (user.makeUpCount <= 0) {
      return res.json({
        success: false,
        message: '补签次数已用完'
      });
    }

    // 1. 如果补签日期早于用户的戒烟日期，更新戒烟日期
    if (!user.quitDate || date < user.quitDate) {
      user.quitDate = date;
      await user.save();
    }

    // 2. 创建补签记录（先创建，后面重新计算天数）
    await Checkin.create({
      openid,
      date,
      timestamp: Date.now(),
      isMakeUp: true,
      continuousDays: 0,  // 临时值，后面重新计算
      totalDays: 0        // 临时值，后面重新计算
    });

    // 3. 重新计算所有签到记录的连续天数和总天数
    await recalculateCheckinStats(openid);

    // 4. 扣除补签次数
    user.makeUpCount -= 1;
    await user.save();

    // 5. 获取最新的统计数据
    const latestCheckin = await Checkin.findOne({ openid }).sort({ date: -1 });
    const continuousDays = latestCheckin ? latestCheckin.continuousDays : 1;
    const totalDays = latestCheckin ? latestCheckin.totalDays : 1;

    res.json({
      success: true,
      message: '补签成功',
      continuousDays,
      totalDays,
      makeUpCount: user.makeUpCount
    });
  } catch (err) {
    console.error('补签失败:', err);
    res.json({
      success: false,
      error: err.message
    });
  }
};

/**
 * 重新计算所有签到记录的连续天数和总天数
 */
async function recalculateCheckinStats(openid) {
  // 获取所有签到记录，按日期升序排列
  const allCheckins = await Checkin.find({ openid }).sort({ date: 1 });
  
  if (allCheckins.length === 0) return;

  let totalDays = 0;
  let continuousDays = 0;
  let lastDate = null;

  for (const checkin of allCheckins) {
    totalDays++;
    
    if (lastDate) {
      // 计算日期差
      const currentDate = new Date(checkin.date);
      const prevDate = new Date(lastDate);
      const diffTime = currentDate - prevDate;
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      
      // 如果是连续的（相差1天），连续天数+1，否则重置为1
      if (diffDays === 1) {
        continuousDays++;
      } else {
        continuousDays = 1;
      }
    } else {
      continuousDays = 1;
    }

    // 更新当前签到记录
    await Checkin.updateOne(
      { _id: checkin._id },
      { 
        continuousDays,
        totalDays
      }
    );

    lastDate = checkin.date;
  }
}

/**
 * 获取签到记录
 */
exports.getCheckinRecords = async (req, res) => {
  try {
    const { openid, year, month } = req.body;

    if (!openid || !year || !month) {
      return res.json({ success: false, message: '缺少必要参数' });
    }

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

    const records = await Checkin.find({
      openid,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    // 获取用户的补签次数
    const User = require('../models/User');
    const user = await User.findOne({ openid });
    
    // 确保每月重置补签次数
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    let makeUpCount = user?.makeUpCount;
    
    if (user && user.lastMakeUpResetMonth !== currentMonthKey) {
      user.makeUpCount = 3;
      user.lastMakeUpResetMonth = currentMonthKey;
      await user.save();
      makeUpCount = 3;
    }

    res.json({
      success: true,
      records,
      makeUpCount
    });
  } catch (err) {
    console.error('获取签到记录失败:', err);
    res.json({
      success: false,
      error: err.message
    });
  }
};

/**
 * 获取今日签到人数
 */
exports.getTodayCheckinCount = async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const count = await Checkin.countDocuments({ date: today });

    res.json({
      success: true,
      count
    });
  } catch (err) {
    console.error('获取今日签到人数失败:', err);
    res.json({
      success: false,
      error: err.message
    });
  }
};

