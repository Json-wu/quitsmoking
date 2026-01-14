// pages/certificate/certificate.js
const app = getApp();
const certificateService = require('../../services/certificate.js');
const { getCanvasNode, drawGradientBackground, drawRoundRect, drawCenterText, canvasToTempFilePath } = require('../../utils/canvas.js');
const { formatDate } = require('../../utils/date.js');

Page({
  data: {
    quitDays: 0,
    certificateLevel: '初级证书',
    certificateDate: '',
    generating: false,
    hasGenerated: false,
    tempFilePath: '',
    levels: []
  },

  onLoad(options) {
    this.initData();
    this.initCanvas();
  },

  onShareAppMessage() {
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

    // 初始化等级列表
    const levels = [
      { level: 'beginner', name: '初级证书', days: 7, icon: '🌱' },
      { level: 'intermediate', name: '中级证书', days: 30, icon: '🌳' },
      { level: 'advanced', name: '高级证书', days: 90, icon: '🛡️' },
      { level: 'expert', name: '专家证书', days: 180, icon: '🏆' },
      { level: 'master', name: '大师证书', days: 365, icon: '👑' }
    ].map(item => ({
      ...item,
      unlocked: quitDays >= item.days
    }));

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
   * 生成证书
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

    // 绘制渐变背景
    drawGradientBackground(ctx, config.bgGradient, width, height, 'vertical');

    // 绘制白色内容区域
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    drawRoundRect(ctx, 20, 40, width - 40, height - 80, 16);
    ctx.fill();
    ctx.restore();

    // 绘制装饰边框
    ctx.save();
    ctx.strokeStyle = config.bgGradient[0];
    ctx.lineWidth = 3;
    drawRoundRect(ctx, 30, 50, width - 60, height - 100, 12);
    ctx.stroke();
    ctx.restore();

    // 绘制证书图标
    ctx.font = 'bold 48px sans-serif';
    ctx.fillStyle = config.bgGradient[0];
    ctx.textAlign = 'center';
    ctx.fillText(config.icon, width / 2, 120);

    // 绘制证书标题
    ctx.font = 'bold 32px sans-serif';
    ctx.fillStyle = '#333333';
    drawCenterText(ctx, '戒烟荣誉证书', 0, 170, width);

    // 绘制证书等级
    ctx.font = 'bold 28px sans-serif';
    ctx.fillStyle = config.bgGradient[0];
    drawCenterText(ctx, config.name, 0, 220, width);

    // 绘制分割线
    ctx.save();
    ctx.strokeStyle = '#E5E5E5';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(60, 250);
    ctx.lineTo(width - 60, 250);
    ctx.stroke();
    ctx.restore();

    // 绘制用户信息
    const userInfo = app.globalData.userInfo;
    ctx.font = '20px sans-serif';
    ctx.fillStyle = '#666666';
    ctx.textAlign = 'left';
    ctx.fillText('持有人:', 60, 300);
    ctx.fillStyle = '#333333';
    ctx.fillText(userInfo?.nickName || '戒烟者', 140, 300);

    // 绘制戒烟天数
    ctx.fillStyle = '#666666';
    ctx.fillText('戒烟天数:', 60, 340);
    ctx.font = 'bold 24px sans-serif';
    ctx.fillStyle = config.bgGradient[0];
    ctx.fillText(`${quitDays} 天`, 140, 340);

    // 绘制获得日期
    ctx.font = '20px sans-serif';
    ctx.fillStyle = '#666666';
    ctx.fillText('获得日期:', 60, 380);
    ctx.fillStyle = '#333333';
    ctx.fillText(this.data.certificateDate, 140, 380);

    // 绘制祝贺语
    ctx.font = '18px sans-serif';
    ctx.fillStyle = '#999999';
    ctx.textAlign = 'center';
    drawCenterText(ctx, '恭喜你坚持戒烟，继续加油！', 0, 440, width);

    // 绘制底部签名
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#CCCCCC';
    drawCenterText(ctx, '我要戒烟小程序', 0, height - 60, width);
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
