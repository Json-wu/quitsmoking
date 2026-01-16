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
    selectedDate: '',
    quitDate: ''  // 戒烟开始日期
  },

  onLoad(options) {
    const today = new Date();
    this.setData({
      currentYear: today.getFullYear(),
      currentMonth: today.getMonth() + 1,
      quitDate: app.globalData.quitDate || ''  // 获取戒烟日期
    });

    // 第1步：立即生成基础日历
    this.generateBaseCalendar();
    
    // 第2步和第3步：加载数据并标记
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

      console.log('签到记录:', result);
      if (result.success) {
        this.setData({
          checkinRecords: result.records || [],
          continuousDays: app.globalData.currentStreak || 0,
          totalCheckin: app.globalData.totalCheckin || 0,
          makeUpCount: result.makeUpCount || 0
        });

        // 第2步：标记签到日期
        this.markCheckinDays();
        
        // 第3步：延迟标记戒烟日期（让签到标记先显示）
        setTimeout(() => {
          this.markQuitDays();
        }, 100);
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
   * 第1步：生成基础日历（立即执行）
   */
  generateBaseCalendar() {
    const { currentYear, currentMonth } = this.data;
    
    // 生成基础日历结构
    const calendar = generateCalendar(currentYear, currentMonth);
    
    this.setData({
      calendarDays: calendar
    });
  },

  /**
   * 第2步：标记签到日期（异步）
   */
  markCheckinDays() {
    const { calendarDays, checkinRecords } = this.data;
    
    // 标记签到日期
    const updatedDays = calendarDays.map(day => {
      if (!day.isCurrentMonth) return day;

      const record = checkinRecords.find(r => r.date === day.dateString);
      
      return {
        ...day,
        isChecked: !!record,
        isMakeUp: record?.isMakeUp || false
      };
    });

    // 计算本月签到天数
    const monthCheckin = updatedDays.filter(d => d.isCurrentMonth && d.isChecked).length;

    this.setData({
      calendarDays: updatedDays,
      monthCheckin
    });
  },

  /**
   * 第3步：标记戒烟日期（异步）
   */
  markQuitDays() {
    const { calendarDays, quitDate } = this.data;
    
    if (!quitDate) return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 标记戒烟日期
    const updatedDays = calendarDays.map(day => {
      if (!day.isCurrentMonth || !day.dateString) return day;
      
      const quitDateObj = new Date(quitDate);
      const currentDateObj = new Date(day.dateString);
      quitDateObj.setHours(0, 0, 0, 0);
      currentDateObj.setHours(0, 0, 0, 0);
      
      // 判断是否在戒烟日期范围内：戒烟开始日期 <= 当前日期 <= 今天
      const isAfterQuitDate = currentDateObj >= quitDateObj;
      const isBeforeToday = currentDateObj <= today;
      
      return {
        ...day,
        isQuitDay: isAfterQuitDate && isBeforeToday
      };
    });

    this.setData({
      calendarDays: updatedDays
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

    // 重新生成基础日历
    this.generateBaseCalendar();
    
    // 加载数据并标记
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

    // 重新生成基础日历
    this.generateBaseCalendar();
    
    // 加载数据并标记
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
