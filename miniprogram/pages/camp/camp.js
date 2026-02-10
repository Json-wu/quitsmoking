Page({
  data: {
    wechatId: 'Riches_wu',
    gameList: [
      { appId: 'wx8d5601c84fff877d', name: '腾讯围棋', icon: '/assets/images/go.jpeg' },
      { appId: 'wx2f60a7b40f3828a9', name: '大惯蛋', icon: '/assets/images/gd.jpeg' },
      { appId: 'wx2f7fda52d8d031ee', name: '腾讯桌球', icon: '/assets/images/zq.jpeg' },
      { appId: 'wx507ad8f5f787f04c', name: '碳碳岛', icon: '/assets/images/ttd.jpeg' },
      { appId: 'wxd0e404d795ea6f80', name: '欢乐斗地主', icon: '/assets/images/ddz.jpeg' },
      { appId: 'wx375c80123d32f83f', name: '欢乐麻将', icon: '/assets/images/mj.jpeg' },
      { appId: 'wx4a0a73ec028e47d7', name: '王者荣耀', icon: '/assets/images/wz.jpeg'  },
      { appId: 'wx17e1394849aa4de2', name: '和平精英', icon: '/assets/images/hpjy.jpeg' },
      { appId: 'wxd99f16d79f518160', name: '英雄联盟', icon: '/assets/images/lol.jpeg' },
      { appId: 'wx9b673034f246b424', name: '乱世王者', icon: '/assets/images/lswz.jpeg' }
    ]
  },

  // 复制微信号
  handleCopyWechat() {
    wx.setClipboardData({
      data: this.data.wechatId,
      success: () => {
        wx.showToast({
          title: '复制成功',
          icon: 'success',
          duration: 2000
        });
      },
      fail: () => {
        wx.showToast({
          title: '复制失败',
          icon: 'none'
        });
      }
    });
  }
});
