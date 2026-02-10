const Checkin = require('../models/Checkin');
const { httpError } = require('../utils/errors');
const { startOfDay, formatDateYYYYMMDD } = require('../utils/date');

async function hasCheckin(openid, dateStr) {
  const existing = await Checkin.findOne({ openid, date: dateStr });
  return !!existing;
}

async function getLatestCheckin(openid) {
  return Checkin.findOne({ openid }).sort({ date: -1 });
}

async function recountTotalDays(openid) {
  return Checkin.countDocuments({ openid });
}

async function checkInToday(openid) {
  const todayStr = formatDateYYYYMMDD(new Date());
  if (await hasCheckin(openid, todayStr)) {
    throw httpError(400, '今天已经签到过了');
  }

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const yesterdayStr = formatDateYYYYMMDD(yesterday);
  const yesterdayCheckin = await Checkin.findOne({ openid, date: yesterdayStr });

  let continuousDays = 1;
  let totalDays;

  if (yesterdayCheckin) {
    continuousDays = (yesterdayCheckin.continuousDays || 0) + 1;
    totalDays = (yesterdayCheckin.totalDays || 0) + 1;
  } else {
    const total = await Checkin.countDocuments({ openid });
    totalDays = total + 1;
  }

  const now = Date.now();
  const created = await Checkin.create({
    openid,
    date: todayStr,
    timestamp: now,
    isMakeUp: false,
    continuousDays,
    totalDays
  });

  return {
    continuousDays,
    totalDays,
    record: created
  };
}

async function makeUpCheckIn(openid, dateStr) {
  if (!dateStr) {
    throw httpError(400, '请选择补签日期');
  }

  const targetDate = startOfDay(new Date(dateStr));
  if (Number.isNaN(targetDate.getTime())) {
    throw httpError(400, '补签日期格式不正确');
  }

  const today = startOfDay(new Date());
  if (targetDate >= today) {
    throw httpError(400, '不能补签今天或未来日期');
  }

  if (targetDate.getMonth() !== today.getMonth() || targetDate.getFullYear() !== today.getFullYear()) {
    throw httpError(400, '只能补签本月的日期');
  }

  const targetDateStr = formatDateYYYYMMDD(targetDate);

  if (await hasCheckin(openid, targetDateStr)) {
    throw httpError(400, '该日期已签到，无需补签');
  }

  const prevDate = new Date(targetDate);
  prevDate.setDate(prevDate.getDate() - 1);
  const prevDateStr = formatDateYYYYMMDD(prevDate);
  const prevCheckin = await Checkin.findOne({ openid, date: prevDateStr });

  let continuousDays = 1;
  if (prevCheckin) {
    continuousDays = (prevCheckin.continuousDays || 0) + 1;
  }

  const total = await Checkin.countDocuments({ openid });
  const totalDays = total + 1;

  await Checkin.create({
    openid,
    date: targetDateStr,
    timestamp: targetDate.getTime(),
    isMakeUp: true,
    continuousDays,
    totalDays
  });

  // 重算从补签日起的连续天数（仿云函数逻辑）
  const allFromTarget = await Checkin.find({
    openid,
    timestamp: { $gte: targetDate.getTime() }
  }).sort({ timestamp: 1 });

  let currentContinuous = continuousDays;
  let lastDate = targetDate;

  for (let i = 1; i < allFromTarget.length; i++) {
    const checkin = allFromTarget[i];
    const checkinDate = startOfDay(new Date(checkin.date));
    const dayDiff = Math.floor((checkinDate - lastDate) / (24 * 60 * 60 * 1000));

    if (dayDiff === 1) {
      currentContinuous += 1;
      await Checkin.updateOne({ _id: checkin._id }, { $set: { continuousDays: currentContinuous } });
      lastDate = checkinDate;
    } else {
      break;
    }
  }

  // 更新最新一条签到记录的 totalDays 为真实总数
  const latest = await getLatestCheckin(openid);
  if (latest) {
    const finalTotal = await recountTotalDays(openid);
    await Checkin.updateOne({ _id: latest._id }, { $set: { totalDays: finalTotal } });
  }

  return {
    totalDays,
    continuousDays: currentContinuous
  };
}

module.exports = {
  checkInToday,
  makeUpCheckIn,
  hasCheckin,
  getLatestCheckin,
  recountTotalDays
};
