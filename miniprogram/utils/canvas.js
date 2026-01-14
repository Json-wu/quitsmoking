// utils/canvas.js - Canvas工具函数

/**
 * 绘制圆角矩形
 * @param {Object} ctx - Canvas上下文
 * @param {Number} x - x坐标
 * @param {Number} y - y坐标
 * @param {Number} width - 宽度
 * @param {Number} height - 高度
 * @param {Number} radius - 圆角半径
 */
const drawRoundRect = (ctx, x, y, width, height, radius) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.arc(x + width - radius, y + radius, radius, -Math.PI / 2, 0);
  ctx.lineTo(x + width, y + height - radius);
  ctx.arc(x + width - radius, y + height - radius, radius, 0, Math.PI / 2);
  ctx.lineTo(x + radius, y + height);
  ctx.arc(x + radius, y + height - radius, radius, Math.PI / 2, Math.PI);
  ctx.lineTo(x, y + radius);
  ctx.arc(x + radius, y + radius, radius, Math.PI, Math.PI * 1.5);
  ctx.closePath();
};

/**
 * 绘制渐变背景
 * @param {Object} ctx - Canvas上下文
 * @param {Array} colors - 颜色数组
 * @param {Number} width - 宽度
 * @param {Number} height - 高度
 * @param {String} direction - 方向: horizontal/vertical
 */
const drawGradientBackground = (ctx, colors, width, height, direction = 'vertical') => {
  let gradient;
  if (direction === 'horizontal') {
    gradient = ctx.createLinearGradient(0, 0, width, 0);
  } else {
    gradient = ctx.createLinearGradient(0, 0, 0, height);
  }
  
  colors.forEach((color, index) => {
    gradient.addColorStop(index / (colors.length - 1), color);
  });
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
};

/**
 * 绘制文字(支持自动换行)
 * @param {Object} ctx - Canvas上下文
 * @param {String} text - 文字内容
 * @param {Number} x - x坐标
 * @param {Number} y - y坐标
 * @param {Number} maxWidth - 最大宽度
 * @param {Number} lineHeight - 行高
 * @returns {Number} 绘制的行数
 */
const drawText = (ctx, text, x, y, maxWidth, lineHeight) => {
  const words = text.split('');
  let line = '';
  let currentY = y;
  let lineCount = 0;

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i];
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && i > 0) {
      ctx.fillText(line, x, currentY);
      line = words[i];
      currentY += lineHeight;
      lineCount++;
    } else {
      line = testLine;
    }
  }
  
  ctx.fillText(line, x, currentY);
  lineCount++;
  
  return lineCount;
};

/**
 * 绘制居中文字
 * @param {Object} ctx - Canvas上下文
 * @param {String} text - 文字内容
 * @param {Number} x - x坐标
 * @param {Number} y - y坐标
 * @param {Number} width - 容器宽度
 */
const drawCenterText = (ctx, text, x, y, width) => {
  const metrics = ctx.measureText(text);
  const textX = x + (width - metrics.width) / 2;
  ctx.fillText(text, textX, y);
};

/**
 * Canvas转图片
 * @param {Object} canvas - Canvas对象
 * @param {Object} options - 配置选项
 * @returns {Promise} 图片临时路径
 */
const canvasToTempFilePath = (canvas, options = {}) => {
  return new Promise((resolve, reject) => {
    wx.canvasToTempFilePath({
      canvas,
      ...options,
      success: (res) => resolve(res.tempFilePath),
      fail: reject
    });
  });
};

/**
 * 加载网络图片到Canvas
 * @param {Object} canvas - Canvas对象
 * @param {Object} ctx - Canvas上下文
 * @param {String} src - 图片地址
 * @param {Number} x - x坐标
 * @param {Number} y - y坐标
 * @param {Number} width - 宽度
 * @param {Number} height - 高度
 * @returns {Promise} 加载结果
 */
const loadImageToCanvas = (canvas, ctx, src, x, y, width, height) => {
  return new Promise((resolve, reject) => {
    const img = canvas.createImage();
    img.onload = () => {
      ctx.drawImage(img, x, y, width, height);
      resolve();
    };
    img.onerror = reject;
    img.src = src;
  });
};

/**
 * 绘制圆形图片
 * @param {Object} ctx - Canvas上下文
 * @param {Object} img - 图片对象
 * @param {Number} x - 圆心x坐标
 * @param {Number} y - 圆心y坐标
 * @param {Number} radius - 半径
 */
const drawCircleImage = (ctx, img, x, y, radius) => {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(img, x - radius, y - radius, radius * 2, radius * 2);
  ctx.restore();
};

/**
 * 绘制虚线
 * @param {Object} ctx - Canvas上下文
 * @param {Number} x1 - 起点x坐标
 * @param {Number} y1 - 起点y坐标
 * @param {Number} x2 - 终点x坐标
 * @param {Number} y2 - 终点y坐标
 * @param {Number} dashLength - 虚线长度
 */
const drawDashedLine = (ctx, x1, y1, x2, y2, dashLength = 5) => {
  ctx.setLineDash([dashLength, dashLength]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.setLineDash([]);
};

/**
 * 绘制阴影
 * @param {Object} ctx - Canvas上下文
 * @param {Number} offsetX - x偏移
 * @param {Number} offsetY - y偏移
 * @param {Number} blur - 模糊度
 * @param {String} color - 颜色
 */
const setShadow = (ctx, offsetX, offsetY, blur, color) => {
  ctx.shadowOffsetX = offsetX;
  ctx.shadowOffsetY = offsetY;
  ctx.shadowBlur = blur;
  ctx.shadowColor = color;
};

/**
 * 清除阴影
 * @param {Object} ctx - Canvas上下文
 */
const clearShadow = (ctx) => {
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';
};

/**
 * 获取Canvas节点
 * @param {String} selector - 选择器
 * @param {Object} component - 组件实例
 * @returns {Promise} Canvas节点和上下文
 */
const getCanvasNode = (selector, component) => {
  return new Promise((resolve, reject) => {
    const query = component.createSelectorQuery();
    query.select(selector)
      .fields({ node: true, size: true })
      .exec((res) => {
        if (res && res[0]) {
          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          const dpr = wx.getSystemInfoSync().pixelRatio;
          
          canvas.width = res[0].width * dpr;
          canvas.height = res[0].height * dpr;
          ctx.scale(dpr, dpr);
          
          resolve({ canvas, ctx, width: res[0].width, height: res[0].height });
        } else {
          reject(new Error('Canvas节点获取失败'));
        }
      });
  });
};

module.exports = {
  drawRoundRect,
  drawGradientBackground,
  drawText,
  drawCenterText,
  canvasToTempFilePath,
  loadImageToCanvas,
  drawCircleImage,
  drawDashedLine,
  setShadow,
  clearShadow,
  getCanvasNode
};
