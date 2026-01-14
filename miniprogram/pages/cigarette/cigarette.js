// pages/cigarette/cigarette.js
const cigaretteService = require('../../services/cigarette.js');
const { createSmokeParticles, updateParticles, drawParticles } = require('../../utils/animation.js');
const { getCanvasNode } = require('../../utils/canvas.js');

Page({
  data: {
    isLit: false,           // 是否已点火
    particles: [],          // 烟雾粒子
    puffCount: 0,           // 吸烟次数
    shakeCount: 0,          // 抖灰次数
    newCount: 0,            // 再来一根次数
    animationId: null       // 动画ID
  },

  onLoad(options) {
    this.initCanvas();
    this.initAccelerometer();
    this.loadTodayStats();
  },

  onUnload() {
    // 停止加速度监听
    wx.stopAccelerometer();
    
    // 停止动画
    if (this.data.animationId) {
      cancelAnimationFrame(this.data.animationId);
    }
  },

  onShareAppMessage() {
    return cigaretteService.shareCigarette();
  },

  /**
   * 初始化Canvas
   */
  async initCanvas() {
    try {
      const { canvas, ctx, width, height } = await getCanvasNode('#cigarette-canvas', this);
      this.canvas = canvas;
      this.ctx = ctx;
      this.canvasWidth = width;
      this.canvasHeight = height;
      
      // 绘制电子烟
      this.drawCigarette();
    } catch (err) {
      console.error('Canvas初始化失败:', err);
    }
  },

  /**
   * 初始化加速度传感器
   */
  initAccelerometer() {
    let lastShakeTime = 0;
    
    wx.startAccelerometer({
      interval: 'game'
    });

    wx.onAccelerometerChange((res) => {
      const { x, y, z } = res;
      const acceleration = Math.sqrt(x * x + y * y + z * z);
      
      // 检测摇动
      if (acceleration > 2.5) {
        const now = Date.now();
        if (now - lastShakeTime > 1000) {
          lastShakeTime = now;
          
          if (!this.data.isLit) {
            this.handleLight();
          } else {
            this.handleShake();
          }
        }
      }
    });
  },

  /**
   * 加载今日统计
   */
  async loadTodayStats() {
    try {
      const result = await cigaretteService.getTodayStats();
      if (result.success) {
        this.setData({
          puffCount: result.puffCount || 0,
          shakeCount: result.shakeCount || 0,
          newCount: result.newCount || 0
        });
      }
    } catch (err) {
      console.error('加载统计数据失败:', err);
    }
  },

  /**
   * 绘制电子烟
   */
  drawCigarette() {
    const ctx = this.ctx;
    const width = this.canvasWidth;
    const height = this.canvasHeight;

    // 清空画布
    ctx.clearRect(0, 0, width, height);

    // 绘制烟身
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(width / 2 - 10, height / 2, 20, 200);

    // 绘制烟嘴
    ctx.fillStyle = '#FFE4B5';
    ctx.fillRect(width / 2 - 10, height / 2 + 200, 20, 30);

    // 绘制烟头
    if (this.data.isLit) {
      const gradient = ctx.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, 15
      );
      gradient.addColorStop(0, '#FF4500');
      gradient.addColorStop(0.5, '#FF6347');
      gradient.addColorStop(1, '#FF8C00');
      ctx.fillStyle = gradient;
    } else {
      ctx.fillStyle = '#808080';
    }
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 12, 0, Math.PI * 2);
    ctx.fill();

    // 绘制烟雾粒子
    if (this.data.particles.length > 0) {
      drawParticles(ctx, this.data.particles, width / 2, height / 2);
    }
  },

  /**
   * 点火
   */
  handleLight() {
    if (this.data.isLit) {
      wx.showToast({
        title: '已经点火了',
        icon: 'none'
      });
      return;
    }

    this.setData({ isLit: true });
    this.drawCigarette();
    
    wx.showToast({
      title: '点火成功',
      icon: 'success'
    });

    // 播放音效
    this.playSound('light');
  },

  /**
   * 吸一口
   */
  async handlePuff() {
    if (!this.data.isLit) {
      wx.showToast({
        title: '请先点火',
        icon: 'none'
      });
      return;
    }

    // 创建烟雾粒子
    const particles = createSmokeParticles(30);
    this.setData({ particles });

    // 开始动画
    this.animateSmoke();

    // 播放音效
    this.playSound('puff');

    // 更新统计
    this.setData({
      puffCount: this.data.puffCount + 1
    });

    // 记录到服务器
    try {
      await cigaretteService.recordPuffAction();
    } catch (err) {
      console.error('记录失败:', err);
    }
  },

  /**
   * 抖灰
   */
  async handleShake() {
    if (!this.data.isLit) {
      wx.showToast({
        title: '请先点火',
        icon: 'none'
      });
      return;
    }

    wx.showToast({
      title: '抖灰成功',
      icon: 'success'
    });

    // 播放音效
    this.playSound('shake');

    // 更新统计
    this.setData({
      shakeCount: this.data.shakeCount + 1
    });

    // 记录到服务器
    try {
      await cigaretteService.recordShake();
    } catch (err) {
      console.error('记录失败:', err);
    }
  },

  /**
   * 再来一根
   */
  async handleNew() {
    this.setData({
      isLit: false,
      particles: []
    });

    this.drawCigarette();

    wx.showToast({
      title: '换了一根新烟',
      icon: 'success'
    });

    // 更新统计
    this.setData({
      newCount: this.data.newCount + 1
    });

    // 记录到服务器
    try {
      await cigaretteService.recordNewCigarette();
    } catch (err) {
      console.error('记录失败:', err);
    }
  },

  /**
   * 烟雾动画
   */
  animateSmoke() {
    const animate = () => {
      // 更新粒子
      const particles = updateParticles(this.data.particles);
      this.setData({ particles });

      // 重绘
      this.drawCigarette();

      // 继续动画
      if (particles.length > 0) {
        const animationId = requestAnimationFrame(animate);
        this.setData({ animationId });
      }
    };

    animate();
  },

  /**
   * 播放音效
   */
  playSound(type) {
    const audioContext = wx.createInnerAudioContext();
    audioContext.src = `/assets/audios/${type}.mp3`;
    audioContext.play();
  }
});
