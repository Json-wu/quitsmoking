function formatDateYYYYMMDD(d) {
  return d.toISOString().slice(0, 10);
}

function monthKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

module.exports = {
  formatDateYYYYMMDD,
  monthKey,
  startOfDay
};
