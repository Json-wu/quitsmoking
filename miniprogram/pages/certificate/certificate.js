// pages/certificate/certificate.js
const app = getApp();
const certificateService = require('../../services/certificate.js');
const { getCanvasNode, canvasToTempFilePath } = require('../../utils/canvas.js');
const { formatDate } = require('../../utils/date.js');

Page({
  data: {
    quitDays: 0,
    certificateDate: '',
    generating: false,
    hasGenerated: false,
    tempFilePath: '',
    loading: true,
    currentTemplate: 'template1',
    templates: [
      { id: 'template1', name: '模板一', icon: '📜', bgImage: '/assets/images/cert1.jpeg' },
      { id: 'template2', name: '模板二', icon: '🎨', bgImage: '/assets/images/cert2.jpeg' },
      { id: 'template3', name: '模板三', icon: '✨', bgImage: '/assets/images/cert3.jpeg' }
    ]
  },

  async onLoad(options) {
    this.initData();
    await this.initCanvas();
    // 自动生成证书
    await this.autoGenerateCertificate();
  },

  async onShareAppMessage() {
    // 确保使用当前选中的模板生成最新的证书
    if (!this.data.hasGenerated || !this.data.tempFilePath) {
      await this.autoGenerateCertificate();
    }
    
    return {
      title: `分享我的荣誉证书！`,
      path: '/pages/index/index',
      imageUrl: this.data.tempFilePath || ''
    };
  },

  /**
   * 初始化数据
   */
  initData() {
    const globalData = app.globalData;
    const quitDays = globalData.quitDays || 0;

    this.setData({
      quitDays,
      certificateDate: formatDate(new Date(), 'YYYY-MM-DD')
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
      console.log('Canvas初始化成功:', { width, height });
    } catch (err) {
      console.error('Canvas初始化失败:', err);
      this.setData({ loading: false });
      wx.showToast({
        title: 'Canvas初始化失败',
        icon: 'none'
      });
    }
  },

  /**
   * 切换模板
   */
  async handleTemplateChange(e) {
    const template = e.currentTarget.dataset.template;
    this.setData({ currentTemplate: template });
    
    // 只重绘背景，不重绘文字
    await this.drawCertificateBackground();
    
    // 转换为图片并更新
    try {
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
    } catch (err) {
      console.error('生成证书图片失败:', err);
    }
  },

  /**
   * 自动生成证书
   */
  async autoGenerateCertificate() {
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
   * 绘制证书（完整版：背景+内容）
   */
  async drawCertificate() {
    const ctx = this.ctx;
    const width = this.canvasWidth;
    const height = this.canvasHeight;
    const { currentTemplate, templates } = this.data;

    console.log('开始绘制证书');

    if (!ctx || !width || !height) {
      console.error('Canvas未初始化');
      return;
    }

    // 清空画布
    ctx.clearRect(0, 0, width, height);

    // 获取当前模板配置
    const template = templates.find(t => t.id === currentTemplate) || templates[0];
    console.log('使用模板:', template);
    
    // 绘制背景图片
    await this.drawBackgroundImage(ctx, template.bgImage, width, height);

    // 绘制文字内容
    this.drawCertificateContent(ctx, width, height);
  },

  /**
   * 仅绘制背景（用于切换模板）
   */
  async drawCertificateBackground() {
    const ctx = this.ctx;
    const width = this.canvasWidth;
    const height = this.canvasHeight;
    const { currentTemplate, templates } = this.data;

    if (!ctx || !width || !height) {
      console.error('Canvas未初始化');
      return;
    }

    // 清空画布
    ctx.clearRect(0, 0, width, height);

    // 获取当前模板配置
    const template = templates.find(t => t.id === currentTemplate) || templates[0];
    
    // 绘制背景图片
    await this.drawBackgroundImage(ctx, template.bgImage, width, height);

    // 重新绘制文字内容（覆盖在新背景上）
    this.drawCertificateContent(ctx, width, height);
  },

  /**
   * 绘制证书文字内容
   */
  drawCertificateContent(ctx, width, height) {
    const { quitDays } = this.data;
    const padding = 40;
    const contentX = padding;
    const contentY = padding;

    // 获取戒烟开始日期
    const quitStartDate = app.globalData.quitDate || '2026-01-16';
    
    // 绘制文字内容（带阴影以增强可读性）
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    // 绘制称呼
    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'left';
    ctx.fillText('尊敬的戒烟达人：', contentX + 10, contentY + 70);

    // 绘制正文内容
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    const contentText = `${quitStartDate} 开始戒烟，已戒 ${quitDays} 天！`;
    ctx.fillText(contentText, width / 2, contentY + 100);

    // 绘制鼓励语
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = '#000000';
    const encouragement = '重点鼓励';
    ctx.fillText(encouragement, width / 2, contentY + 130);

    // 绘制签名
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#d01a1a';
    ctx.fillText('我要戒烟', width - contentX - 40, height - contentY + 5);

    // 清除阴影效果
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  },

  /**
   * 绘制背景图片
   */
  async drawBackgroundImage(ctx, imagePath, width, height) {
    try {
      console.log('开始加载背景图片:', imagePath);
      // 加载背景图片
      const img = this.canvas.createImage();
      await new Promise((resolve, reject) => {
        img.onload = () => {
          console.log('背景图片加载成功');
          resolve();
        };
        img.onerror = (err) => {
          console.error('背景图片加载错误:', err);
          reject(err);
        };
        img.src = imagePath;
      });
      
      // 绘制背景图片（覆盖整个画布）
      ctx.drawImage(img, 0, 0, width, height);
      console.log('背景图片绘制完成');
    } catch (err) {
      console.error('背景图片加载失败:', err, imagePath);
      // 加载失败时使用纯色背景
      ctx.fillStyle = '#F5EDE4';
      ctx.fillRect(0, 0, width, height);
      console.log('使用纯色背景降级');
    }
  },

  /**
   * 绘制边框图片
   */
  async drawBorderImage(ctx, imageUrl, width, height) {
    try {
      let tempUrl = imageUrl;
      
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
   * 绘制简单边框
   */
  drawSimpleBorder(ctx, config, x, y, width, height) {
    const color = config.borderColor;
    
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
  }
});
