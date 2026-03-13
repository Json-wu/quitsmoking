// pages/cigarette-detail/cigarette-detail.js
const cigaretteService = require('../../services/cigarette.js');
const { getCanvasNode } = require('../../utils/canvas.js');

Page({
  data: {
    isLit: false,           // 是否已点火
    burnProgress: 0,        // 当前燃烧进度 (0-100)
    totalBurnedLength: 0,   // 已抖掉的总长度（像素）
    maxPuffs: 10,           // 整支烟总共最多吸几口
    totalPuffs: 0,          // 总共已吸几口（不重置）
    currentPuffs: 0,        // 当前段已吸几口（抖灰后重置）
    puffCount: 0,           // 吸烟次数
    shakeCount: 0,          // 抖灰次数
    lightCount: 0          // 今日点火次数（抽了几根）
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

    if (this.audioContexts) {
      Object.keys(this.audioContexts).forEach((key) => {
        try {
          this.audioContexts[key].destroy();
        } catch (e) {
        }
      });
    }
  },

  onShareAppMessage() {
    return cigaretteService.shareCigarette();
  },

  /**
   * 分享到朋友圈
   */
  onShareTimeline() {
    return {
      title: '送你一支电子烟，帮你戒烟解压！',
      path: '/pages/cigarette/cigarette',
      imageUrl: '/assets/images/share-cigarette.jpeg'
    };
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
        const todayStats = result.stats || {};
        this.setData({
          puffCount: todayStats.puffCount || 0,
          shakeCount: todayStats.shakeCount || 0,
          lightCount: todayStats.lightCount || 0
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
    const cigaretteLength = 350;  // 香烟总长度（增加长度）
    const cigaretteWidth = 32;    // 香烟粗度（增加粗度）
    const filterLength = 60;      // 过滤嘴长度（增加长度）
    const burnableLength = cigaretteLength - filterLength;  // 可燃烧长度

    // 计算剩余可燃烧长度
    const remainingBurnableLength = burnableLength - this.data.totalBurnedLength;

    // 计算当前燃烧长度（基于当前段的燃烧进度）
    const currentBurnedLength = (this.data.burnProgress / 100) * remainingBurnableLength;

    // 计算烟身实际起点（考虑已抖掉的部分）
    const actualStartX = (width - cigaretteLength) / 2 + this.data.totalBurnedLength;
    const startY = height / 2 - cigaretteWidth / 2;

    // 先绘制过滤嘴（橙黄色）
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
    for (let i = 0; i < 8; i++) {
      const x = filterStartX + (i * 7);
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, startY + cigaretteWidth);
      ctx.stroke();
    }

    // 绘制已燃烧的烟灰（颗粒感效果 + 不规则边框）
    if (this.data.isLit) {
      // 烟灰长度：至少3px，最多根据burnProgress计算
      const ashLength = Math.max(currentBurnedLength, 3);
      console.log('绘制烟灰 - burnProgress:', this.data.burnProgress, 'currentBurnedLength:', currentBurnedLength, 'ashLength:', ashLength);
      
      // 基础烟灰颜色
      ctx.fillStyle = '#A9A9A9';
      ctx.fillRect(
        actualStartX,
        startY,
        ashLength,
        cigaretteWidth
      );
      
      // 添加烟灰颗粒纹理 - 参考首页方法
      for (let i = 0; i < ashLength; i += 2) {
        for (let j = 0; j < cigaretteWidth; j += 2) {
          if (Math.random() > 0.5) {
            const gray = Math.floor(Math.random() * 50 + 120); // 120-170的灰度
            ctx.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
            ctx.fillRect(actualStartX + i, startY + j, 2, 2);
          }
        }
      }
      
      // 右侧边缘不规则毛躁效果（燃烧端）
      ctx.strokeStyle = '#808080';
      ctx.lineWidth = 1;
      
      // 顶部边缘
      ctx.beginPath();
      ctx.moveTo(actualStartX, startY);
      for (let i = 0; i < ashLength; i += 2) {
        const offset = Math.random() * 1.5 - 0.75;
        ctx.lineTo(actualStartX + i, startY + offset);
      }
      ctx.lineTo(actualStartX + ashLength, startY);
      ctx.stroke();
      
      // 底部边缘
      ctx.beginPath();
      ctx.moveTo(actualStartX, startY + cigaretteWidth);
      for (let i = 0; i < ashLength; i += 2) {
        const offset = Math.random() * 1.5 - 0.75;
        ctx.lineTo(actualStartX + i, startY + cigaretteWidth + offset);
      }
      ctx.lineTo(actualStartX + ashLength, startY + cigaretteWidth);
      ctx.stroke();
      
      // 右侧燃烧端边缘 - 更明显的毛躁感
      ctx.beginPath();
      ctx.moveTo(actualStartX + ashLength, startY);
      for (let j = 0; j <= cigaretteWidth; j += 1.5) {
        const offset = Math.random() * 2.5 - 1.25;
        ctx.lineTo(actualStartX + ashLength + offset, startY + j);
      }
      ctx.lineTo(actualStartX + ashLength, startY + cigaretteWidth);
      ctx.stroke();
    }

    // 绘制燃烧点（深红色竖条纹）
    if (this.data.isLit) {
      // 火源在烟灰右侧
      const ashLength = Math.max(currentBurnedLength, 3);
      const burnX = actualStartX + ashLength;
      
      // 绘制深红色竖条纹（6px宽）
      ctx.fillStyle = '#CC0000'; // 更亮的红色
      ctx.fillRect(
        burnX,
        startY,
        6,
        cigaretteWidth
      );
      
      // 添加亮红色中心线（4px宽）
      ctx.fillStyle = '#FF3333'; // 更亮的鲜红色
      ctx.fillRect(
        burnX + 1,
        startY,
        4,
        cigaretteWidth
      );
    }

    // 绘制未燃烧的烟身（白色）- 在烟灰和火源之后绘制
    ctx.fillStyle = '#FFFFFF';
    let whiteBodyStartX, whiteBodyLength;
    
    if (this.data.isLit) {
      // 如果已点火，从火源位置开始绘制白色烟身
      const ashLength = Math.max(currentBurnedLength, 3);
      const fireWidth = 6;
      whiteBodyStartX = actualStartX + ashLength + fireWidth;
      whiteBodyLength = remainingBurnableLength - ashLength - fireWidth;
      
      if (whiteBodyLength > 0) {
        ctx.fillRect(
          whiteBodyStartX,
          startY,
          whiteBodyLength,
          cigaretteWidth
        );
      }
    } else {
      // 未点火时，整根香烟都是白色
      whiteBodyStartX = actualStartX;
      whiteBodyLength = remainingBurnableLength;
      ctx.fillRect(
        whiteBodyStartX,
        startY,
        whiteBodyLength,
        cigaretteWidth
      );
    }
    
    // 绘制烟身纹理（竖条纹）
    if (whiteBodyLength > 0) {
      ctx.strokeStyle = '#E0E0E0';
      ctx.lineWidth = 0.5;
      const stripeSpacing = 4;
      const stripeCount = Math.floor(whiteBodyLength / stripeSpacing);
      
      for (let i = 0; i <= stripeCount; i++) {
        const x = whiteBodyStartX + (i * stripeSpacing);
        if (x <= whiteBodyStartX + whiteBodyLength) {
          ctx.beginPath();
          ctx.moveTo(x, startY);
          ctx.lineTo(x, startY + cigaretteWidth);
          ctx.stroke();
        }
      }
    }
    
    // 调试日志
    console.log('香烟绘制完成 - isLit:', this.data.isLit, 'burnProgress:', this.data.burnProgress, 'currentBurnedLength:', currentBurnedLength);
  },

  /**
   * 点火
   */
  handleLight() {
    if (this.data.isLit) {
      return;
    }

    // 点火后立即显示火源，设置5%的燃烧进度确保烟灰可见
    this.setData({ 
      isLit: true,
      burnProgress: 5  // 设置5%的燃烧进度，确保烟灰足够长
    }, () => {
      // 在setData回调中绘制，确保状态已更新
      this.drawCigarette();
      
      // 真机兼容：多次延迟重绘确保显示
      setTimeout(() => {
        this.drawCigarette();
      }, 50);
      
      setTimeout(() => {
        this.drawCigarette();
      }, 100);
      
      setTimeout(() => {
        this.drawCigarette();
      }, 200);
    });

    // 播放音效
    this.playSound('light');

    // 更新统计
    this.setData({
      lightCount: this.data.lightCount + 1
    });

    // 记录到服务器
    console.log('记录到服务器', '点火');
    cigaretteService.recordLight();
  },

  /**
   * 吸一口
   */
  async handlePuff() {
    if (!this.data.isLit) {
      return;
    }
    
    // 检查是否已经吸满整支烟的6口
    if (this.data.totalPuffs >= this.data.maxPuffs) {
      return;
    }
    
    // 播放音效
    this.playSound('puff');

    // 增加总吸烟次数和当前段吸烟次数
    const newTotalPuffs = this.data.totalPuffs + 1;
    const newCurrentPuffs = this.data.currentPuffs + 1;

    // 计算燃烧进度：基于总吸烟次数计算整体进度
    // 每口占据 98% / 6 ≈ 16.33%
    const progressPerPuff = 98 / this.data.maxPuffs;
    const totalProgress = 2 + (newTotalPuffs * progressPerPuff); // 基于总口数计算
    
    // 计算当前段的显示进度（抖灰后重置）
    const cigaretteLength = 350;
    const filterLength = 60;
    const burnableLength = cigaretteLength - filterLength;
    const totalBurnedFromProgress = (totalProgress / 100) * burnableLength; // 总燃烧长度
    const currentSegmentBurned = totalBurnedFromProgress - this.data.totalBurnedLength; // 当前段燃烧长度
    const remainingInSegment = burnableLength - this.data.totalBurnedLength; // 当前段剩余长度
    const newProgress = Math.min(100, (currentSegmentBurned / remainingInSegment) * 100); // 当前段进度

    // 更新数据，吸完6口后保持isLit=true，让三个按钮同时显示
    this.setData({
      totalPuffs: newTotalPuffs,
      currentPuffs: newCurrentPuffs,
      burnProgress: newProgress
    });

    // 重绘香烟
    this.drawCigarette();

   

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

    // 检查是否有烟灰可抖（burnProgress > 1 才能抖灰）
    if (this.data.burnProgress <= 1) {
      return;
    }

    // 震动反馈
    wx.vibrateShort({
      type: 'medium'
    });

    // 抖灰：掉落"已燃烧的部分"，但不回弹。
    // 依据总口数计算总燃烧长度，并保留最小烟灰像素，避免左侧完全空白。
    const cigaretteLength = 350;
    const filterLength = 60;
    const burnableLength = cigaretteLength - filterLength;

    const minAshPixels = 3;
    const progressPerPuff = 98 / this.data.maxPuffs;
    const totalProgress = Math.min(100, 2 + (this.data.totalPuffs * progressPerPuff));
    const totalBurnedFromProgress = (totalProgress / 100) * burnableLength;
    const newTotalBurnedLength = Math.max(0, totalBurnedFromProgress - minAshPixels);

    this.setData({
      totalBurnedLength: newTotalBurnedLength,
      burnProgress: 2,      // 抖灰后保留最小烟灰+火焰
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
      currentPuffs: 0        // 重置当前段吸烟次数
    });

    // 重绘全新的香烟
    this.drawCigarette();

    // 再来一根仅用于重置，不计入"抽了几根"（点火次数）统计
  },


  /**
   * 播放音效
   */
  playSound(type) {
    if (!this.audioContexts) {
      this.audioContexts = {};
    }
    if (!this.audioPlaying) {
      this.audioPlaying = {};
    }

    if (this.audioPlaying[type]) {
      return;
    }

    let audioContext = this.audioContexts[type];
    if (!audioContext) {
      audioContext = wx.createInnerAudioContext();
      audioContext.src = `/assets/audios/${type}.mp3`;
      audioContext.onEnded(() => {
        this.audioPlaying[type] = false;
      });
      audioContext.onStop(() => {
        this.audioPlaying[type] = false;
      });
      audioContext.onError(() => {
        this.audioPlaying[type] = false;
      });
      this.audioContexts[type] = audioContext;
    }

    this.audioPlaying[type] = true;
    try {
      audioContext.seek(0);
    } catch (e) {
    }
    audioContext.play();
  }
});
