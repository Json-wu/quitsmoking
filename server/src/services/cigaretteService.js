const Cigarette = require('../models/Cigarette');
const { formatDateYYYYMMDD } = require('../utils/date');
const { httpError } = require('../utils/errors');

function normalizeType(type) {
  if (!type) return 'puff';
  const t = String(type).toLowerCase();
  if (t === 'puff' || t === 'shake' || t === 'light' || t === 'new') return t;
  return null;
}

async function record(openid, type, dateStr) {
  const t = normalizeType(type);
  if (!t) throw httpError(400, 'type must be one of puff/shake/light/new');

  const date = dateStr || formatDateYYYYMMDD(new Date());

  const inc = {};
  if (t === 'puff') inc.puffCount = 1;
  if (t === 'shake') inc.shakeCount = 1;
  if (t === 'light') inc.lightCount = 1;
  if (t === 'new') inc.newCount = 1;

  const updated = await Cigarette.findOneAndUpdate(
    { openid, date },
    { $inc: inc, $setOnInsert: { openid, date } },
    { upsert: true, new: true }
  );

  return updated;
}

async function getStats(openid) {
  const todayStr = formatDateYYYYMMDD(new Date());
  const today = (await Cigarette.findOne({ openid, date: todayStr })) || null;
  const all = await Cigarette.find({ openid });

  const total = all.reduce(
    (acc, r) => {
      acc.puffCount += r.puffCount || 0;
      acc.shakeCount += r.shakeCount || 0;
      acc.lightCount += (r.lightCount != null ? r.lightCount : (r.newCount || 0));
      return acc;
    },
    { puffCount: 0, shakeCount: 0, lightCount: 0 }
  );

  const todayLight = today ? (today.lightCount != null ? today.lightCount : (today.newCount || 0)) : 0;

  return {
    today: {
      puffCount: today ? (today.puffCount || 0) : 0,
      shakeCount: today ? (today.shakeCount || 0) : 0,
      lightCount: todayLight
    },
    total
  };
}

module.exports = {
  record,
  getStats
};
