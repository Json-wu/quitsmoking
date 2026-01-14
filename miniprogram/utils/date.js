// utils/date.js - 日期处理工具函数

/**
 * 计算两个日期之间的天数
 * @param {String|Date} startDate - 开始日期
 * @param {String|Date} endDate - 结束日期
 * @returns {Number} 天数差
 */
const getDaysBetween = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = end.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

/**
 * 格式化日期
 * @param {String|Date} date - 日期
 * @param {String} format - 格式化模板
 * @returns {String} 格式化后的日期字符串
 */
const formatDate = (date, format = 'YYYY-MM-DD') => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  const second = String(d.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hour)
    .replace('mm', minute)
    .replace('ss', second);
};

/**
 * 获取今天的日期字符串
 * @param {String} format - 格式化模板
 * @returns {String} 今天日期
 */
const getTodayString = (format = 'YYYY-MM-DD') => {
  return formatDate(new Date(), format);
};

/**
 * 检查是否是今天
 * @param {String|Date} date - 日期
 * @returns {Boolean} 是否是今天
 */
const isToday = (date) => {
  return formatDate(date, 'YYYY-MM-DD') === getTodayString();
};

/**
 * 获取昨天的日期
 * @param {String} format - 格式化模板
 * @returns {String} 昨天日期
 */
const getYesterdayString = (format = 'YYYY-MM-DD') => {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return formatDate(yesterday, format);
};

/**
 * 获取月份的天数
 * @param {Number} year - 年份
 * @param {Number} month - 月份(1-12)
 * @returns {Number} 天数
 */
const getDaysInMonth = (year, month) => {
  return new Date(year, month, 0).getDate();
};

/**
 * 获取月份的第一天是星期几
 * @param {Number} year - 年份
 * @param {Number} month - 月份(1-12)
 * @returns {Number} 星期几(0-6)
 */
const getFirstDayOfMonth = (year, month) => {
  return new Date(year, month - 1, 1).getDay();
};

/**
 * 生成日历数据
 * @param {Number} year - 年份
 * @param {Number} month - 月份(1-12)
 * @returns {Array} 日历数据数组
 */
const generateCalendar = (year, month) => {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const calendar = [];

  // 补充上月的日期
  for (let i = 0; i < firstDay; i++) {
    calendar.push({
      date: 0,
      isCurrentMonth: false
    });
  }

  // 当月的日期
  for (let i = 1; i <= daysInMonth; i++) {
    calendar.push({
      date: i,
      dateString: `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
      isCurrentMonth: true,
      isToday: isToday(`${year}-${month}-${i}`)
    });
  }

  // 补充下月的日期
  const remainingDays = 42 - calendar.length; // 6行7列
  for (let i = 1; i <= remainingDays; i++) {
    calendar.push({
      date: i,
      isCurrentMonth: false
    });
  }

  return calendar;
};

/**
 * 获取星期几的中文
 * @param {Number} day - 星期几(0-6)
 * @returns {String} 中文星期
 */
const getWeekDayText = (day) => {
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  return `星期${weekDays[day]}`;
};

/**
 * 计算年龄
 * @param {String|Date} birthday - 生日
 * @returns {Number} 年龄
 */
const calculateAge = (birthday) => {
  const birth = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * 获取时间段文字
 * @returns {String} 时间段(早上/中午/下午/晚上)
 */
const getTimeOfDay = () => {
  const hour = new Date().getHours();
  if (hour < 6) return '凌晨';
  if (hour < 9) return '早上';
  if (hour < 12) return '上午';
  if (hour < 14) return '中午';
  if (hour < 18) return '下午';
  if (hour < 22) return '晚上';
  return '深夜';
};

/**
 * 格式化相对时间
 * @param {String|Date} date - 日期
 * @returns {String} 相对时间(刚刚/5分钟前/昨天/2天前等)
 */
const formatRelativeTime = (date) => {
  const now = new Date();
  const target = new Date(date);
  const diff = now.getTime() - target.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days === 1) return '昨天';
  if (days < 7) return `${days}天前`;
  
  return formatDate(date, 'YYYY-MM-DD');
};

/**
 * 判断是否是闰年
 * @param {Number} year - 年份
 * @returns {Boolean} 是否是闰年
 */
const isLeapYear = (year) => {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
};

/**
 * 获取日期范围
 * @param {String|Date} startDate - 开始日期
 * @param {String|Date} endDate - 结束日期
 * @returns {Array} 日期数组
 */
const getDateRange = (startDate, endDate) => {
  const dates = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  while (start <= end) {
    dates.push(formatDate(start, 'YYYY-MM-DD'));
    start.setDate(start.getDate() + 1);
  }
  
  return dates;
};

module.exports = {
  getDaysBetween,
  formatDate,
  getTodayString,
  isToday,
  getYesterdayString,
  getDaysInMonth,
  getFirstDayOfMonth,
  generateCalendar,
  getWeekDayText,
  calculateAge,
  getTimeOfDay,
  formatRelativeTime,
  isLeapYear,
  getDateRange
};
