// pages/calendar/calendar.js
const app = getApp();
const checkinService = require('../../services/checkin.js');
const { generateCalendar, formatDate } = require('../../utils/date.js');

Page({
  data: {
    currentYear: 0,
    currentMonth: 0,
    weekDays: ['日', '一', '二', '三', '四', '五', '六'],
    calendarDays: [],
    checkinRecords: [],
    continuousDays: 0,
    monthCheckin: 0,
    totalCheckin: 0,
    makeUpCount: 3,
    showMakeUpModal: false,
    selectedDate: ''
  },

  onLoad(options) {
    const today = new Date();
    this.setData({
      currentYear: today.getFullYear(),
      currentMonth: today.getMonth() + 1
    });

    this.loadData();
  },

  onPullDownRefresh() {
    this.loadData().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 加载数据
   */
  async loadData() {
    try {
      wx.showLoading({ title: '加载中...' });

      // 获取签到记录
      const result = await checkinService.getCheckinRecords(
        this.data.currentYear,
        this.data.currentMonth
      );

      if (result.success) {
        this.setData({
          checkinRecords: result.records || [],
          continuousDays: result.continuousDays || 0,
          totalCheckin: result.totalCheckin || 0,
          makeUpCount: result.makeUpCount || 0
        });

        // 生成日历
        this.generateCalendarData();
      }
    } catch (err) {
      console.error('加载数据失败:', err);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  /**
   * 生成日历数据
   */
  generateCalendarData() {
    const { currentYear, currentMonth, checkinRecords } = this.data;
    
    // 生成日历
    const calendar = generateCalendar(currentYear, currentMonth);
    
    // 标记签到日期
    const calendarDays = calendar.map(day => {
      if (!day.isCurrentMonth) return day;

      const record = checkinRecords.find(r => r.date === day.dateString);
      return {
        ...day,
        isChecked: !!record,
        isMakeUp: record?.isMakeUp || false
      };
    });

    // 计算本月签到天数
    const monthCheckin = calendarDays.filter(d => d.isCurrentMonth && d.isChecked).length;

    this.setData({
      calendarDays,
      monthCheckin
    });
  },

  /**
   * 上一月
   */
  prevMonth() {
    let { currentYear, currentMonth } = this.data;
    
    currentMonth--;
    if (currentMonth < 1) {
      currentMonth = 12;
      currentYear--;
    }

    this.setData({
      currentYear,
      currentMonth
    });

    this.loadData();
  },

  /**
   * 下一月
   */
  nextMonth() {
    let { currentYear, currentMonth } = this.data;
    
    currentMonth++;
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear++;
    }

    // 不能查看未来月份
    const today = new Date();
    const targetDate = new Date(currentYear, currentMonth - 1);
    if (targetDate > today) {
      wx.showToast({
        title: '不能查看未来月份',
        icon: 'none'
      });
      return;
    }

    this.setData({
      currentYear,
      currentMonth
    });

    this.loadData();
  },

  /**
   * 点击日期
   */
  onDayClick(e) {
    const { date, checked } = e.currentTarget.dataset;
    
    if (!date || checked) return;

    // 检查是否是当月日期
    const selectedDate = new Date(date);
    const today = new Date();
    
    if (selectedDate > today) {
      wx.showToast({
        title: '不能补签未来日期',
        icon: 'none'
      });
      return;
    }

    // 检查是否是本月
    if (selectedDate.getMonth() + 1 !== this.data.currentMonth) {
      return;
    }

    // 显示补签确认弹窗
    this.setData({
      showMakeUpModal: true,
      selectedDate: date
    });
  },

  /**
   * 确认补签
   */
  async confirmMakeUp() {
    if (this.data.makeUpCount <= 0) {
      wx.showToast({
        title: '补签次数已用完',
        icon: 'none'
      });
      this.closeMakeUpModal();
      return;
    }

    try {
      wx.showLoading({ title: '补签中...' });

      const result = await checkinService.makeUpCheckIn(this.data.selectedDate);

      if (result.success) {
        wx.showToast({
          title: '补签成功',
          icon: 'success'
        });

        // 刷新数据
        await this.loadData();
      } else {
        wx.showToast({
          title: result.message || '补签失败',
          icon: 'none'
        });
      }
    } catch (err) {
      console.error('补签失败:', err);
      wx.showToast({
        title: err.message || '补签失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
      this.closeMakeUpModal();
    }
  },

  /**
   * 关闭补签弹窗
   */
  closeMakeUpModal() {
    this.setData({
      showMakeUpModal: false,
      selectedDate: ''
    });
  },

  /**
   * 阻止冒泡
   */
  stopPropagation() {
    // 阻止事件冒泡
  }
});
