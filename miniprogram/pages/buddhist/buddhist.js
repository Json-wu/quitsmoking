const app = getApp();

Page({
  data: {
    isPlaying: false,
    showLink: false,
    musicUrl: 'https://foyinwang.com/attachment/music/202403/30/vwJeqHTg2fiMLkECjBdu.mp3',
    hasLoaded: false // 标记音频是否已加载
  },

  onLoad(options) {
    // 获取全局音频管理器
    this.audioManager = wx.getBackgroundAudioManager();
    
    // 监听音频播放状态
    this.audioManager.onPlay(() => {
      this.setData({ isPlaying: true });
    });
    
    this.audioManager.onPause(() => {
      this.setData({ isPlaying: false });
    });
    
    this.audioManager.onStop(() => {
      this.setData({ 
        isPlaying: false,
        hasLoaded: false 
      });
    });
    
    this.audioManager.onEnded(() => {
      this.setData({ 
        isPlaying: false,
        hasLoaded: false 
      });
    });

    this.audioManager.onError((err) => {
      console.error('音频播放错误：', err);
      this.setData({ 
        isPlaying: false,
        hasLoaded: false 
      });
      wx.showToast({
        title: '播放失败',
        icon: 'none'
      });
    });
  },

  onUnload() {
    // 页面卸载时不停止音乐，让它在后台继续播放
  },

  // 播放/暂停
  handlePlayPause() {
    if (this.data.isPlaying) {
      // 暂停
      this.audioManager.pause();
    } else {
      // 判断是否已加载过音频
      if (this.data.hasLoaded && this.audioManager.paused !== undefined) {
        // 已加载过，直接播放
        this.audioManager.play();
      } else {
        // 首次播放或已停止，需要设置音频源
        this.audioManager.title = '佛性戒烟音乐';
        this.audioManager.epname = '戒烟助手';
        this.audioManager.singer = '佛音网';
        this.audioManager.coverImgUrl = '';
        this.audioManager.src = this.data.musicUrl;
        this.setData({ hasLoaded: true });
      }
    }
  },

  // 显示/隐藏链接地址
  handleShowLink() {
    this.setData({
      showLink: !this.data.showLink
    });
  },

  // 复制链接地址
  handleCopyLink() {
    wx.setClipboardData({
      data: this.data.musicUrl,
      success: () => {
        wx.showToast({
          title: '链接已复制',
          icon: 'success'
        });
      },
      fail: () => {
        wx.showToast({
          title: '复制失败',
          icon: 'none'
        });
      }
    });
  },

  // 分享
  onShareAppMessage() {
    return {
      title: '一起来戒烟 - 佛性戒烟',
      path: '/pages/buddhist/buddhist',
      imageUrl: ''
    };
  },

  onShareTimeline() {
    return {
      title: '一起来戒烟 - 佛性戒烟',
      query: '',
      imageUrl: ''
    };
  }
});
