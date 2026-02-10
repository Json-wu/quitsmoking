Component({
  properties: {
    // 标题
    title: {
      type: String,
      value: '休闲时刻'
    },
    // 游戏列表
    games: {
      type: Array,
      value: []
    },
    // 滚动速度（px/帧）
    scrollSpeed: {
      type: Number,
      value: 0.5
    },
    // 是否自动滚动
    autoScroll: {
      type: Boolean,
      value: true
    }
  },

  data: {
    scrollLeft: 0,
    touchStartX: 0,
    touchStartScrollLeft: 0,
    isManualScrolling: false
  },

  lifetimes: {
    attached() {
      if (this.properties.autoScroll) {
        this.startAutoScroll();
      }
    },

    detached() {
      this.stopAutoScroll();
    }
  },

  pageLifetimes: {
    show() {
      // 页面显示时恢复滚动
      if (this.properties.autoScroll && !this.scrollTimer) {
        this.startAutoScroll();
      }
    },
    
    hide() {
      // 页面隐藏时暂停滚动
      this.stopAutoScroll();
    }
  },

  methods: {
    // 停止自动滚动
    stopAutoScroll() {
      if (this.scrollTimer) {
        clearInterval(this.scrollTimer);
        this.scrollTimer = null;
      }
      if (this.resetTimer) {
        clearTimeout(this.resetTimer);
        this.resetTimer = null;
      }
    },

    // 自动滚动
    startAutoScroll() {
      // 先清理旧的定时器，防止多个定时器同时运行
      this.stopAutoScroll();
      
      const scrollInterval = 16; // 约60fps
      const itemWidth = 90; 
      const totalItems = this.properties.games.length;
      const resetPoint = itemWidth * totalItems;
      
      // 5分钟后重置（300000毫秒）
      const autoResetDuration = 300000;
      let startTime = Date.now();

      this.scrollTimer = setInterval(() => {
        // 如果正在手动滑动，跳过自动滚动
        if (this.data.isManualScrolling) {
          return;
        }

        let scrollLeft = this.data.scrollLeft + this.properties.scrollSpeed;
        
        // 滚动到一组游戏的末尾时，无缝重置到开头
        if (scrollLeft >= resetPoint) {
          scrollLeft = scrollLeft % resetPoint;
        }
        
        // 检查是否超过5分钟，如果是则平滑重置
        const elapsed = Date.now() - startTime;
        if (elapsed >= autoResetDuration) {
          // 重置计时器
          startTime = Date.now();
          // 平滑过渡到开头
          if (scrollLeft > resetPoint * 0.8) {
            scrollLeft = 0;
          }
        }
        
        this.setData({
          scrollLeft: scrollLeft
        });
      }, scrollInterval);
    },

    // 触摸开始
    handleTouchStart(e) {
      this.setData({
        touchStartX: e.touches[0].clientX,
        touchStartScrollLeft: this.data.scrollLeft,
        isManualScrolling: true
      });
    },

    // 触摸移动
    handleTouchMove(e) {
      const touchCurrentX = e.touches[0].clientX;
      const deltaX = this.data.touchStartX - touchCurrentX;
      let newScrollLeft = this.data.touchStartScrollLeft + deltaX;

      const itemWidth = 90;
      const totalItems = this.properties.games.length;
      const resetPoint = itemWidth * totalItems;

      // 限制滚动范围，允许循环
      if (newScrollLeft < 0) {
        newScrollLeft = resetPoint + newScrollLeft;
      } else if (newScrollLeft >= resetPoint) {
        newScrollLeft = newScrollLeft % resetPoint;
      }

      this.setData({
        scrollLeft: newScrollLeft
      });
    },

    // 触摸结束
    handleTouchEnd(e) {
      // 延迟恢复自动滚动，避免立即跳动
      setTimeout(() => {
        this.setData({
          isManualScrolling: false
        });
      }, 1000);
    },

    // 点击游戏
    handleGameTap(e) {
      const appId = e.currentTarget.dataset.appid;
      
      wx.navigateToMiniProgram({
        appId: appId,
        path: '',
        extraData: {},
        envVersion: 'release',
        success: () => {
          console.log('跳转小游戏成功');
        },
        fail: (err) => {
          console.error('跳转小游戏失败:', err);
          wx.showToast({
            title: '跳转失败',
            icon: 'none'
          });
        }
      });
    }
  }
});
