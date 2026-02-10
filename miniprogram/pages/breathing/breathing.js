// pages/breathing/breathing.js
Page({
  data: {
    currentStep: 1,
    stepText: '第一步：深呼吸4次',
    buttonText: '下一步',
    isBreathing: true,
    countdown: 0,
    countdownTimer: null,
    steps: [
      { text: '第一步：深呼吸4次', breathCount: 4, holdTime: 0 },
      { text: '第二步：闭气5秒钟', breathCount: 0, holdTime: 5 },
      { text: '第三步：深呼吸6次', breathCount: 6, holdTime: 0 },
      { text: '第四步：闭气10秒钟', breathCount: 0, holdTime: 10 },
      { text: '第五步：深呼吸8次', breathCount: 8, holdTime: 0 },
      { text: '第六步：闭气15秒钟', breathCount: 0, holdTime: 15 }
    ]
  },

  onLoad(options) {
    this.startBreathing();
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
  }
});
