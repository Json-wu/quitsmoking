// pages/cigarette/cigarette.js
const cigaretteService = require('../../services/cigarette.js');
const { createSmokeParticles, updateParticles, drawParticles } = require('../../utils/animation.js');
const { getCanvasNode } = require('../../utils/canvas.js');

Page({
  data: {
    isLit: false,           // 是否已点火
    burnProgress: 0,        // 当前燃烧进度 (0-100)
    totalBurnedLength: 0,   // 已抖掉的总长度（像素）
    maxPuffs: 6,            // 整支烟总共最多吸几口
    totalPuffs: 0,          // 总共已吸几口（不重置）
    currentPuffs: 0,        // 当前段已吸几口（抖灰后重置）
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
   * 绘制电子烟（横向）
   */
  drawCigarette() {
    const ctx = this.ctx;
    const width = this.canvasWidth;
    const height = this.canvasHeight;

    // 清空画布
    ctx.clearRect(0, 0, width, height);

    // 香烟参数
    const cigaretteLength = 280;  // 香烟总长度
    const cigaretteWidth = 24;    // 香烟粗度
    const filterLength = 40;      // 过滤嘴长度
    const burnableLength = cigaretteLength - filterLength;  // 可燃烧长度

    // 计算剩余可燃烧长度
    const remainingBurnableLength = burnableLength - this.data.totalBurnedLength;

    // 计算当前燃烧长度（基于当前段的燃烧进度）
    const currentBurnedLength = (this.data.burnProgress / 100) * remainingBurnableLength;

    // 计算烟身实际起点（考虑已抖掉的部分）
    const actualStartX = (width - cigaretteLength) / 2 + this.data.totalBurnedLength;
    const startY = height / 2 - cigaretteWidth / 2;

    // 绘制未燃烧的烟身（白色）
    if (currentBurnedLength < remainingBurnableLength) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(
        actualStartX + currentBurnedLength,
        startY,
        remainingBurnableLength - currentBurnedLength,
        cigaretteWidth
      );
    }

    // 绘制过滤嘴（橙黄色）
    const filterStartX = (width - cigaretteLength) / 2 + burnableLength;
    ctx.fillStyle = '#FFB84D';
    ctx.fillRect(
      filterStartX,
      startY,
      filterLength,
      cigaretteWidth
    );

    // 绘制过滤嘴纹理
    ctx.strokeStyle = '#E69500';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const x = filterStartX + (i * 8);
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, startY + cigaretteWidth);
      ctx.stroke();
    }

    // 绘制已燃烧的烟灰（灰色）
    if (currentBurnedLength > 0) {
      ctx.fillStyle = '#A9A9A9';
      ctx.fillRect(
        actualStartX,
        startY,
        currentBurnedLength,
        cigaretteWidth
      );
    }

    // 绘制燃烧点（红色发光效果）
    if (this.data.isLit && currentBurnedLength < remainingBurnableLength) {
      const burnX = actualStartX + currentBurnedLength;
      const burnY = startY + cigaretteWidth / 2;

      // 发光效果
      const gradient = ctx.createRadialGradient(
        burnX, burnY, 0,
        burnX, burnY, 20
      );
      gradient.addColorStop(0, '#FF4500');
      gradient.addColorStop(0.5, '#FF6347');
      gradient.addColorStop(1, 'rgba(255, 69, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(burnX, burnY, 20, 0, Math.PI * 2);
      ctx.fill();

      // 燃烧点核心
      ctx.fillStyle = '#FF0000';
      ctx.beginPath();
      ctx.arc(burnX, burnY, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    // 绘制烟雾粒子
    if (this.data.particles.length > 0) {
      const smokeX = actualStartX + currentBurnedLength;
      const smokeY = startY + cigaretteWidth / 2;
      drawParticles(ctx, this.data.particles, smokeX, smokeY);
    }
  },

  /**
   * 点火
   */
  handleLight() {
    if (this.data.isLit) {
      return;
    }

    this.setData({ isLit: true });
    this.drawCigarette();

    // 播放音效
    this.playSound('light');

    // 记录到服务器
    console.log('记录到服务器', '点火');
    cigaretteService.recordNewCigarette();
  },

  /**
   * 吸一口
   */
  async handlePuff() {
    if (!this.data.isLit) {
      return;
    }

    // 计算剩余可燃烧长度
    const cigaretteLength = 280;
    const filterLength = 40;
    const burnableLength = cigaretteLength - filterLength;
    const remainingBurnableLength = burnableLength - this.data.totalBurnedLength;

    // 检查是否已经吸满整支烟的6口
    if (this.data.totalPuffs >= this.data.maxPuffs) {
      return;
    }

    // 检查是否还有可燃烧的烟身
    if (remainingBurnableLength <= 0) {
      return;
    }

    // 增加总吸烟次数和当前段吸烟次数
    const newTotalPuffs = this.data.totalPuffs + 1;
    const newCurrentPuffs = this.data.currentPuffs + 1;

    // 计算当前段的燃烧进度（基于剩余可吸次数）
    const remainingPuffs = this.data.maxPuffs - (this.data.totalPuffs - this.data.currentPuffs);
    const newProgress = Math.min(100, (newCurrentPuffs / remainingPuffs) * 100);

    this.setData({
      totalPuffs: newTotalPuffs,
      currentPuffs: newCurrentPuffs,
      burnProgress: newProgress
    });

    // 创建烟雾粒子
    const particles = createSmokeParticles(30);
    this.setData({ particles });

    // 开始动画
    this.animateSmoke();

    // 重绘香烟
    this.drawCigarette();

    // 播放音效
    this.playSound('puff');

    // 更新统计
    this.setData({
      puffCount: this.data.puffCount + 1
    });

    // 记录到服务器
    try {
      console.log('记录到服务器', '吸一口');
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
      return;
    }

    // 检查是否有烟灰可抖
    if (this.data.burnProgress === 0) {
      return;
    }

    // 抖掉烟灰，累加已燃烧长度，重置当前燃烧进度
    const cigaretteLength = 280;
    const filterLength = 40;
    const burnableLength = cigaretteLength - filterLength;
    const currentBurnedPixels = (this.data.burnProgress / 100) * burnableLength;

    this.setData({
      totalBurnedLength: this.data.totalBurnedLength + currentBurnedPixels,  // 累加已抖掉的长度
      burnProgress: 0,      // 重置当前燃烧进度为0
      currentPuffs: 0       // 重置当前段吸烟次数
      // totalPuffs 不重置，继续累计
      // isLit 保持为 true，继续保持点火状态
    });

    // 重绘香烟
    this.drawCigarette();

    // 播放音效
    this.playSound('shake');

    // 更新统计
    this.setData({
      shakeCount: this.data.shakeCount + 1
    });

    // 记录到服务器
    try {
      console.log('记录到服务器', '抖灰');
      await cigaretteService.recordShake();
    } catch (err) {
      console.error('记录失败:', err);
    }
  },

  /**
   * 再来一根
   */
  async handleNew() {
    // 重置所有状态
    this.setData({
      isLit: false,
      burnProgress: 0,
      totalBurnedLength: 0,  // 重置已抖掉的总长度
      totalPuffs: 0,         // 重置总吸烟次数
      currentPuffs: 0,       // 重置当前段吸烟次数
      particles: []
    });

    // 重绘全新的香烟
    this.drawCigarette();

    // 更新统计
    this.setData({
      newCount: this.data.newCount + 1
    });

    // 记录到服务器
    try {
      console.log('记录到服务器', '再来一根');
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
