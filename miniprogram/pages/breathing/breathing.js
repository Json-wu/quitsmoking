// pages/breathing/breathing.js
const { getCanvasNode, canvasToTempFilePath } = require('../../utils/canvas.js');

Page({
  data: {
    currentStep: 1,
    stepText: '第一步：深呼吸4次',
    buttonText: '下一步',
    isBreathing: true,
    countdown: 0,
    countdownTimer: null,
    shareImageUrl: '',
    steps: [
      { text: '第一步：深呼吸4次', breathCount: 4, holdTime: 0 },
      { text: '第二步：闭气5秒钟', breathCount: 0, holdTime: 5 },
      { text: '第三步：深呼吸6次', breathCount: 6, holdTime: 0 },
      { text: '第四步：闭气10秒钟', breathCount: 0, holdTime: 10 },
      { text: '第五步：深呼吸8次', breathCount: 8, holdTime: 0 },
      { text: '第六步：闭气15秒钟', breathCount: 0, holdTime: 15 }
    ]
  },

  async onLoad(options) {
    this.startBreathing();
    await this.generateShareImage();
  },

  onUnload() {
    this.stopBreathing();
    this.clearCountdown();
  },

  /**
   * 开始呼吸动画或倒计时
   */
  startBreathing() {
    const step = this.data.steps[this.data.currentStep - 1];
    if (step.breathCount > 0) {
      // 深呼吸步骤
      this.setData({
        isBreathing: true,
        countdown: 0
      });
    } else {
      // 闭气步骤，开始倒计时
      this.setData({
        isBreathing: false,
        countdown: step.holdTime
      });
      this.startCountdown();
    }
  },

  /**
   * 停止呼吸动画
   */
  stopBreathing() {
    this.setData({
      isBreathing: false
    });
  },

  /**
   * 开始倒计时
   */
  startCountdown() {
    this.clearCountdown();
    
    this.data.countdownTimer = setInterval(() => {
      const newCountdown = this.data.countdown - 1;
      if (newCountdown <= 0) {
        this.setData({
          countdown: 0
        });
        this.clearCountdown();
      } else {
        this.setData({
          countdown: newCountdown
        });
      }
    }, 1000);
  },

  /**
   * 清除倒计时定时器
   */
  clearCountdown() {
    if (this.data.countdownTimer) {
      clearInterval(this.data.countdownTimer);
      this.data.countdownTimer = null;
    }
  },

  /**
   * 处理下一步按钮点击
   */
  handleNext() {
    // 如果倒计时未结束，不允许点击
    if (this.data.countdown > 0) {
      return;
    }
    if (this.data.currentStep >= 6) {
      // 第六步之后，显示结束提示
      if (this.data.stepText === '本次练习已结束') {
        // 重新练习，恢复到初始状态
        this.clearCountdown();
        this.resetTraining();
      } else {
        // 显示结束提示
        this.clearCountdown();
        this.setData({
          stepText: '本次练习已结束',
          buttonText: '重新练习',
          isBreathing: false,
          countdown: 0
        });
      }
    } else {
      // 进入下一步
      this.clearCountdown();
      const nextStep = this.data.currentStep + 1;
      const step = this.data.steps[nextStep - 1];
      
      this.setData({
        currentStep: nextStep,
        stepText: step.text
      });
      
      // 根据步骤类型启动呼吸或倒计时
      this.startBreathing();
    }
  },

  /**
   * 重置训练到初始状态
   */
  resetTraining() {
    this.setData({
      currentStep: 1,
      stepText: '第一步：深呼吸4次',
      buttonText: '下一步',
      isBreathing: true
    });
  },

  /**
   * 跳转到电子烟页面
   */
  goToCigarette() {
    // 跳转到电子烟详情页（非tabBar页面），可以显示返回按钮
    wx.navigateTo({
      url: '/pages/cigarette-detail/cigarette-detail'
    });
  },

  /**
   * 生成分享图片（5:4比例）
   */
  async generateShareImage() {
    try {
      const { canvas, ctx, width, height } = await getCanvasNode('#share-canvas', this);
      
      // 设置背景色
      ctx.fillStyle = '#f0f8ff';
      ctx.fillRect(0, 0, width, height);
      
      // 加载肺部图片
      const lungImage = canvas.createImage();
      await new Promise((resolve, reject) => {
        lungImage.onload = resolve;
        lungImage.onerror = reject;
        lungImage.src = '/assets/images/fb.png';
      });
      
      // 计算图片居中位置（保持宽高比）
      const imgWidth = width * 0.6;
      const imgHeight = imgWidth * (lungImage.height / lungImage.width);
      const imgX = (width - imgWidth) / 2;
      const imgY = (height - imgHeight) / 2;
      
      // 绘制肺部图片
      ctx.drawImage(lungImage, imgX, imgY, imgWidth, imgHeight);
      
      // 添加标题
      // ctx.fillStyle = '#333';
      // ctx.font = 'bold 24px sans-serif';
      // ctx.textAlign = 'center';
      // ctx.fillText('呼吸训练', width / 2, 40);
      
      // 添加副标题
      ctx.fillStyle = '#666';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('每日坚持，健康呼吸', width / 2, height - 30);
      
      // 转换为临时文件
      const tempFilePath = await canvasToTempFilePath(canvas, {
        x: 0,
        y: 0,
        width,
        height,
        destWidth: 500,
        destHeight: 400,
        fileType: 'png',
        quality: 1
      });
      
      this.setData({ shareImageUrl: tempFilePath });
      console.log('分享图片生成成功:', tempFilePath);
    } catch (err) {
      console.error('生成分享图片失败:', err);
    }
  },

  /**
   * 分享给微信好友
   */
  onShareAppMessage() {
    return {
      title: '今日的呼吸训练做了吗？',
      path: '/pages/breathing/breathing',
      imageUrl: this.data.shareImageUrl || '/assets/images/fb.png'
    };
  }
});
