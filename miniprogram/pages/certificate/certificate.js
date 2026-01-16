// pages/certificate/certificate.js
const app = getApp();
const certificateService = require('../../services/certificate.js');
const { getCanvasNode, drawGradientBackground, drawRoundRect, drawCenterText, canvasToTempFilePath } = require('../../utils/canvas.js');
const { formatDate } = require('../../utils/date.js');

Page({
  data: {
    quitDays: 0,
    certificateLevel: '',
    certificateDate: '',
    generating: false,
    hasGenerated: false,
    tempFilePath: '',
    levels: [],
    loading: true
  },

  async onLoad(options) {
    this.initData();
    await this.initCanvas();
    // 自动生成证书
    await this.autoGenerateCertificate();
  },

  onShareAppMessage() {
    if (this.data.hasGenerated && this.data.tempFilePath) {
      return {
        title: `我已成功戒烟${this.data.quitDays}天，获得${this.data.certificateLevel}！`,
        path: '/pages/index/index',
        imageUrl: this.data.tempFilePath
      };
    }
    return certificateService.shareCertificate(this.data.quitDays, this.data.certificateLevel);
  },

  /**
   * 初始化数据
   */
  initData() {
    const globalData = app.globalData;
    const quitDays = globalData.quitDays || 0;
    const level = certificateService.getCertificateLevel(quitDays);
    const config = certificateService.getCertificateConfig(level);

    // 设置等级列表
    const levels = [
      { level: 'beginner', name: '初级证书', icon: '🌱', days: 7, unlocked: quitDays >= 7 },
      { level: 'intermediate', name: '中级证书', icon: '🌳', days: 30, unlocked: quitDays >= 30 },
      { level: 'advanced', name: '高级证书', icon: '🛡️', days: 90, unlocked: quitDays >= 90 },
      { level: 'expert', name: '专家证书', icon: '🏆', days: 180, unlocked: quitDays >= 180 },
      { level: 'master', name: '大师证书', icon: '👑', days: 365, unlocked: quitDays >= 365 },
      { level: 'grandmaster', name: '宗师证书', icon: '⭐', days: 366, unlocked: quitDays > 365 }
    ];

    this.setData({
      quitDays,
      certificateLevel: config.name,
      certificateDate: formatDate(new Date(), 'YYYY-MM-DD'),
      levels
    });
  },

  /**
   * 初始化Canvas
   */
  async initCanvas() {
    try {
      const { canvas, ctx, width, height } = await getCanvasNode('#certificate-canvas', this);
      this.canvas = canvas;
      this.ctx = ctx;
      this.canvasWidth = width;
      this.canvasHeight = height;
    } catch (err) {
      console.error('Canvas初始化失败:', err);
    }
  },

  /**
   * 自动生成证书
   */
  async autoGenerateCertificate() {
    if (this.data.quitDays < 7) {
      this.setData({ loading: false });
      wx.showToast({
        title: '戒烟满7天后可获得证书',
        icon: 'none'
      });
      return;
    }

    try {
      this.setData({ generating: true, loading: true });

      // 绘制证书
      await this.drawCertificate();

      // 转换为图片
      const tempFilePath = await canvasToTempFilePath(this.canvas, {
        x: 0,
        y: 0,
        width: this.canvasWidth,
        height: this.canvasHeight,
        destWidth: this.canvasWidth * 2,
        destHeight: this.canvasHeight * 2,
        fileType: 'png',
        quality: 1
      });

      this.setData({
        hasGenerated: true,
        tempFilePath,
        loading: false
      });

      // 调用云函数记录
      await certificateService.generateCertificate(this.data.quitDays);

    } catch (err) {
      console.error('生成证书失败:', err);
      this.setData({ loading: false });
      wx.showToast({
        title: '生成失败，请重试',
        icon: 'none'
      });
    } finally {
      this.setData({ generating: false });
    }
  },

  /**
   * 生成证书（保留用于手动重新生成）
   */
  async handleGenerate() {
    if (this.data.generating) return;

    try {
      this.setData({ generating: true });
      wx.showLoading({ title: '生成中...' });

      // 绘制证书
      await this.drawCertificate();

      // 转换为图片
      const tempFilePath = await canvasToTempFilePath(this.canvas, {
        x: 0,
        y: 0,
        width: this.canvasWidth,
        height: this.canvasHeight,
        destWidth: this.canvasWidth * 2,
        destHeight: this.canvasHeight * 2,
        fileType: 'png',
        quality: 1
      });

      this.setData({
        hasGenerated: true,
        tempFilePath
      });

      // 调用云函数记录
      await certificateService.generateCertificate(this.data.quitDays);

      wx.showToast({
        title: '生成成功',
        icon: 'success'
      });
    } catch (err) {
      console.error('生成证书失败:', err);
      wx.showToast({
        title: '生成失败',
        icon: 'none'
      });
    } finally {
      this.setData({ generating: false });
      wx.hideLoading();
    }
  },

  /**
   * 绘制证书
   */
  async drawCertificate() {
    const ctx = this.ctx;
    const width = this.canvasWidth;
    const height = this.canvasHeight;
    const { quitDays } = this.data;

    // 获取证书配置
    const level = certificateService.getCertificateLevel(quitDays);
    const config = certificateService.getCertificateConfig(level);

    // 清空画布
    ctx.clearRect(0, 0, width, height);

    // 绘制浅色背景（类似图片中的米色）
    ctx.fillStyle = '#F5EDE4';
    ctx.fillRect(0, 0, width, height);

    // 定义内容区域
    const padding = 40;
    const contentX = padding;
    const contentY = padding;
    const contentWidth = width - padding * 2;
    const contentHeight = height - padding * 2;

    // 绘制边框图片（如果有）
    if (config.borderImage) {
      await this.drawBorderImage(ctx, config.borderImage, width, height);
    } else {
      // 降级方案：绘制简单边框
      this.drawSimpleBorder(ctx, config, contentX, contentY, contentWidth, contentHeight);
    }

    // 绘制顶部横线装饰
    // ctx.save();
    // ctx.strokeStyle = config.color;
    // ctx.lineWidth = 2;
    // ctx.beginPath();
    // ctx.moveTo(contentX + 80, contentY + 50);
    // ctx.lineTo(width - contentX - 80, contentY + 50);
    // ctx.stroke();
    // ctx.restore();

    // 绘制大标题
    ctx.font = 'bold 30px serif';
    ctx.fillStyle = 'red';
    ctx.textAlign = 'center';
    ctx.letterSpacing = '10px';
    ctx.fillText('荣誉证书', width / 2, 40);
    ctx.letterSpacing = '0px';

    // 绘制称呼
    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = '#f4e622ff';
    ctx.textAlign = 'left';
    ctx.fillText('尊敬的戒烟达人：', 20, 80);

    // 获取戒烟开始日期
    const quitStartDate = app.globalData.quitDate || '2026-01-16';
    
    // 绘制正文内容
    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = '#f4e622ff';
    ctx.textAlign = 'center';
    const contentText = `${quitStartDate} 开始戒烟，已戒${quitDays}天！`;
    ctx.fillText(contentText, 160, 120);

    // 绘制鼓励语
    ctx.font = 'bold 24px sans-serif';
    ctx.fillStyle = '#f4e622ff';
    ctx.fillText('重点鼓励', width/2, 160);

    // 绘制底部横线装饰
    // ctx.save();
    // ctx.strokeStyle = config.color;
    // ctx.lineWidth = 2;
    // ctx.beginPath();
    // ctx.moveTo(contentX + 80, height - contentY - 50);
    // ctx.lineTo(width - contentX - 80, height - contentY - 50);
    // ctx.stroke();
    // ctx.restore();

    // 绘制签名
    ctx.font = '18px sans-serif';
    ctx.fillStyle = config.color;
    ctx.textAlign = 'right';
    ctx.fillText('我要戒烟', width  - 20, height - 20);
  },

  /**
   * 绘制边框图片
   */
  async drawBorderImage(ctx, imageUrl, width, height) {
    try {
      let tempUrl = imageUrl;
      
      // 如果是云存储地址，先转换为临时链接
      if (imageUrl.startsWith('cloud://')) {
        const res = await wx.cloud.getTempFileURL({
          fileList: [imageUrl]
        });
        
        if (res.fileList && res.fileList.length > 0 && res.fileList[0].tempFileURL) {
          tempUrl = res.fileList[0].tempFileURL;
        } else {
          throw new Error('获取临时链接失败');
        }
      }
      
      // 加载边框图片
      const img = this.canvas.createImage();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = tempUrl;
      });
      
      // 绘制边框图片（覆盖整个画布）
      ctx.drawImage(img, 0, 0, width, height);
    } catch (err) {
      console.error('边框图片加载失败:', err, imageUrl);
      // 加载失败时使用简单边框
      const padding = 40;
      this.drawSimpleBorder(ctx, { color: '#C41E3A' }, padding, padding, width - padding * 2, height - padding * 2);
    }
  },

  /**
   * 绘制简单边框（降级方案）
   */
  drawSimpleBorder(ctx, config, x, y, width, height) {
    const color = config.color;
    
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    
    // 绘制双线边框
    ctx.strokeRect(x, y, width, height);
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 8, y + 8, width - 16, height - 16);
    
    // 绘制四角装饰点
    ctx.fillStyle = color;
    const cornerSize = 8;
    const corners = [
      [x, y],
      [x + width, y],
      [x, y + height],
      [x + width, y + height]
    ];
    
    corners.forEach(([cx, cy]) => {
      ctx.beginPath();
      ctx.arc(cx, cy, cornerSize, 0, Math.PI * 2);
      ctx.fill();
    });
    
    ctx.restore();
  },

  /**
   * 根据等级绘制不同的边框（已废弃，保留用于兼容）
   */
  drawLevelBorder_deprecated(ctx, level, config, width, height) {
    // 边框位置参数（与白色内容区域对齐）
    const contentPadding = 50;
    const contentY = 60;
    const contentHeight = height - 120;
    
    const borderConfigs = {
      beginner: () => {
        // 初级：简单单线边框
        ctx.save();
        ctx.strokeStyle = config.bgGradient[0];
        ctx.lineWidth = 3;
        drawRoundRect(ctx, contentPadding + 8, contentY + 8, width - (contentPadding + 8) * 2, contentHeight - 16, 12);
        ctx.stroke();
        ctx.restore();
      },
      intermediate: () => {
        // 中级：双线边框
        ctx.save();
        ctx.strokeStyle = config.bgGradient[0];
        ctx.lineWidth = 3;
        drawRoundRect(ctx, contentPadding + 8, contentY + 8, width - (contentPadding + 8) * 2, contentHeight - 16, 12);
        ctx.stroke();
        ctx.lineWidth = 2;
        drawRoundRect(ctx, contentPadding + 14, contentY + 14, width - (contentPadding + 14) * 2, contentHeight - 28, 10);
        ctx.stroke();
        ctx.restore();
      },
      advanced: () => {
        // 高级：装饰性边框
        ctx.save();
        ctx.strokeStyle = config.bgGradient[0];
        ctx.lineWidth = 4;
        drawRoundRect(ctx, contentPadding + 8, contentY + 8, width - (contentPadding + 8) * 2, contentHeight - 16, 12);
        ctx.stroke();
        
        // 绘制四角装饰
        ctx.fillStyle = config.bgGradient[0];
        const corners = [
          [contentPadding + 8, contentY + 8], 
          [width - contentPadding - 8, contentY + 8], 
          [contentPadding + 8, contentY + contentHeight - 8], 
          [width - contentPadding - 8, contentY + contentHeight - 8]
        ];
        corners.forEach(([x, y]) => {
          ctx.beginPath();
          ctx.arc(x, y, 6, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();
      },
      expert: () => {
        // 专家：华丽边框
        ctx.save();
        // 外层边框
        ctx.strokeStyle = config.bgGradient[0];
        ctx.lineWidth = 5;
        drawRoundRect(ctx, contentPadding + 6, contentY + 6, width - (contentPadding + 6) * 2, contentHeight - 12, 14);
        ctx.stroke();
        
        // 内层边框
        ctx.strokeStyle = config.bgGradient[1];
        ctx.lineWidth = 2;
        drawRoundRect(ctx, contentPadding + 16, contentY + 16, width - (contentPadding + 16) * 2, contentHeight - 32, 10);
        ctx.stroke();
        
        // 绘制装饰线条
        ctx.strokeStyle = config.bgGradient[0];
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        drawRoundRect(ctx, contentPadding + 11, contentY + 11, width - (contentPadding + 11) * 2, contentHeight - 22, 12);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      },
      master: () => {
        // 大师：彩虹渐变边框
        ctx.save();
        
        // 绘制多层彩色边框
        const colors = config.bgGradient;
        const layers = 5;
        for (let i = 0; i < layers; i++) {
          ctx.strokeStyle = colors[i % colors.length];
          ctx.lineWidth = 3;
          const offset = contentPadding + 6 + i * 3;
          const yOffset = contentY + 6 + i * 3;
          drawRoundRect(ctx, offset, yOffset, width - offset * 2, contentHeight - 12 - i * 6, 14 - i);
          ctx.stroke();
        }
        
        // 绘制星星装饰（调整位置）
        ctx.fillStyle = '#FFD700';
        const stars = [
          [width / 2, contentY - 10],
          [contentPadding + 20, contentY + 30], 
          [width - contentPadding - 20, contentY + 30],
          [contentPadding + 20, contentY + contentHeight - 30], 
          [width - contentPadding - 20, contentY + contentHeight - 30]
        ];
        stars.forEach(([x, y]) => {
          this.drawStar(ctx, x, y, 8, 5);
        });
        
        ctx.restore();
      }
    };

    const drawBorder = borderConfigs[level] || borderConfigs.beginner;
    drawBorder();
  },

  /**
   * 绘制星星
   */
  drawStar(ctx, cx, cy, outerRadius, points) {
    const innerRadius = outerRadius / 2;
    const angle = Math.PI / points;
    
    ctx.beginPath();
    for (let i = 0; i < 2 * points; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const x = cx + Math.cos(i * angle - Math.PI / 2) * radius;
      const y = cy + Math.sin(i * angle - Math.PI / 2) * radius;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();
  },

  /**
   * 保存到相册
   */
  async handleSave() {
    if (!this.data.hasGenerated) {
      wx.showToast({
        title: '请先生成证书',
        icon: 'none'
      });
      return;
    }

    try {
      await certificateService.saveCertificateToAlbum(this.data.tempFilePath);
    } catch (err) {
      console.error('保存失败:', err);
    }
  }
});
