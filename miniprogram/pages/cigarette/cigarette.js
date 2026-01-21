// pages/cigarette/cigarette.js
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
    newCount: 0,            // 再来一根次数
    lastPuffTime: 0         // 上次吸烟时间戳
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

    // 绘制未燃烧的烟身（白色）
    if (currentBurnedLength < remainingBurnableLength) {
      ctx.fillStyle = '#FFFFFF';
      // 如果已点火，从火源位置开始绘制白色烟身
      if (this.data.isLit) {
        // 火源宽度6px，烟灰根据burnProgress计算但最少显示一点
        const ashLength = Math.max(currentBurnedLength, 3); // 至少3px烟灰
        const fireWidth = 6;
        ctx.fillRect(
          actualStartX + ashLength + fireWidth,
          startY,
          remainingBurnableLength - ashLength - fireWidth,
          cigaretteWidth
        );
      } else {
        // 未点火时，整根香烟都是白色
        ctx.fillRect(
          actualStartX,
          startY,
          remainingBurnableLength,
          cigaretteWidth
        );
      }
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
      
      // 添加颗粒感纹理
      for (let i = 0; i < ashLength; i += 2) {
        for (let j = 0; j < cigaretteWidth; j += 2) {
          if (Math.random() > 0.5) {
            const gray = Math.floor(Math.random() * 50 + 120); // 120-170的灰度
            ctx.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
            ctx.fillRect(actualStartX + i, startY + j, 2, 2);
          }
        }
      }
      
      // 绘制不规则边框效果
      ctx.strokeStyle = '#808080'; // 深灰色边框
      ctx.lineWidth = 1;
      
      // 顶部不规则边缘
      ctx.beginPath();
      ctx.moveTo(actualStartX, startY);
      for (let i = 0; i < ashLength; i += 3) {
        const offset = Math.random() * 2 - 1; // -1到1的随机偏移
        ctx.lineTo(actualStartX + i, startY + offset);
      }
      ctx.lineTo(actualStartX + ashLength, startY);
      ctx.stroke();
      
      // 底部不规则边缘
      ctx.beginPath();
      ctx.moveTo(actualStartX, startY + cigaretteWidth);
      for (let i = 0; i < ashLength; i += 3) {
        const offset = Math.random() * 2 - 1; // -1到1的随机偏移
        ctx.lineTo(actualStartX + i, startY + cigaretteWidth + offset);
      }
      ctx.lineTo(actualStartX + ashLength, startY + cigaretteWidth);
      ctx.stroke();
      
      // 右侧边缘（燃烧端）不规则效果
      ctx.beginPath();
      ctx.moveTo(actualStartX + ashLength, startY);
      for (let j = 0; j < cigaretteWidth; j += 2) {
        const offset = Math.random() * 3 - 1.5; // -1.5到1.5的随机偏移
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
      ctx.fillStyle = '#8B0000'; // 深红色
      ctx.fillRect(
        burnX,
        startY,
        6,
        cigaretteWidth
      );
      
      // 添加亮红色中心线（4px宽）
      ctx.fillStyle = '#FF0000'; // 鲜红色
      ctx.fillRect(
        burnX + 1,
        startY,
        4,
        cigaretteWidth
      );
    }
  },

  /**
   * 点火
   */
  handleLight() {
    if (this.data.isLit) {
      return;
    }

    // 点火后立即显示火源，设置2%的燃烧进度
    this.setData({ 
      isLit: true,
      burnProgress: 2  // 设置2%的燃烧进度，测试效果
    });
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
    
    // 防抖：1秒内只能吸一次
    const now = Date.now();
    if (now - this.data.lastPuffTime < 1000) {
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
      burnProgress: newProgress,
      lastPuffTime: now  // 更新上次吸烟时间
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

    // 抖掉烟灰：将当前段已燃烧部分累加到totalBurnedLength，重置burnProgress
    // 这样烟灰掉落，未燃烧部分保持不变
    const cigaretteLength = 350;
    const filterLength = 60;
    const burnableLength = cigaretteLength - filterLength;
    const remainingBurnableLength = burnableLength - this.data.totalBurnedLength;
    const currentBurnedLength = (this.data.burnProgress / 100) * remainingBurnableLength;

    this.setData({
      totalBurnedLength: this.data.totalBurnedLength + currentBurnedLength,  // 累加已燃烧长度
      burnProgress: 2,      // 重置为2%保持火源显示
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
   * 播放音效
   */
  playSound(type) {
    const audioContext = wx.createInnerAudioContext();
    audioContext.src = `/assets/audios/${type}.mp3`;
    audioContext.play();
  }
});
