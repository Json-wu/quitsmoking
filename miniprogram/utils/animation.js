// utils/animation.js - 动画工具函数

/**
 * 创建签到成功动画
 * @returns {Object} 动画对象
 */
const createCheckinAnimation = () => {
  const animation = wx.createAnimation({
    duration: 500,
    timingFunction: 'ease-in-out'
  });

  animation.scale(1.2).rotate(360).step();
  animation.scale(1).rotate(0).step();
  
  return animation.export();
};

/**
 * 创建烟雾粒子
 * @param {Number} count - 粒子数量
 * @returns {Array} 粒子数组
 */
const createSmokeParticles = (count = 30) => {
  const particles = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * 50 - 25,
      y: 0,
      vx: (Math.random() - 0.5) * 2,
      vy: -Math.random() * 3 - 1,
      radius: Math.random() * 3 + 2,
      opacity: 1,
      life: Math.random() * 60 + 40
    });
  }
  return particles;
};

/**
 * 更新粒子状态
 * @param {Array} particles - 粒子数组
 * @returns {Array} 更新后的粒子数组
 */
const updateParticles = (particles) => {
  return particles.filter(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.opacity -= 0.015;
    p.life--;
    return p.life > 0 && p.opacity > 0;
  });
};

/**
 * 绘制粒子
 * @param {Object} ctx - Canvas上下文
 * @param {Array} particles - 粒子数组
 * @param {Number} baseX - 基准x坐标
 * @param {Number} baseY - 基准y坐标
 */
const drawParticles = (ctx, particles, baseX, baseY) => {
  particles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = p.opacity;
    ctx.fillStyle = '#CCCCCC';
    ctx.beginPath();
    ctx.arc(baseX + p.x, baseY + p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
};

/**
 * 创建烟花动画
 * @returns {Object} 动画对象
 */
const createFireworkAnimation = () => {
  const animation = wx.createAnimation({
    duration: 1000,
    timingFunction: 'ease-out'
  });

  animation.opacity(1).scale(1.5).step();
  animation.opacity(0).scale(2).step();
  
  return animation.export();
};

/**
 * 创建淡入动画
 * @param {Number} duration - 持续时间
 * @returns {Object} 动画对象
 */
const createFadeInAnimation = (duration = 300) => {
  const animation = wx.createAnimation({
    duration,
    timingFunction: 'ease-in'
  });

  animation.opacity(1).step();
  return animation.export();
};

/**
 * 创建淡出动画
 * @param {Number} duration - 持续时间
 * @returns {Object} 动画对象
 */
const createFadeOutAnimation = (duration = 300) => {
  const animation = wx.createAnimation({
    duration,
    timingFunction: 'ease-out'
  });

  animation.opacity(0).step();
  return animation.export();
};

/**
 * 创建滑入动画
 * @param {String} direction - 方向: left/right/top/bottom
 * @param {Number} distance - 距离
 * @param {Number} duration - 持续时间
 * @returns {Object} 动画对象
 */
const createSlideInAnimation = (direction = 'bottom', distance = 100, duration = 300) => {
  const animation = wx.createAnimation({
    duration,
    timingFunction: 'ease-out'
  });

  switch (direction) {
    case 'left':
      animation.translateX(0).step();
      break;
    case 'right':
      animation.translateX(0).step();
      break;
    case 'top':
      animation.translateY(0).step();
      break;
    case 'bottom':
      animation.translateY(0).step();
      break;
  }

  return animation.export();
};

/**
 * 创建缩放动画
 * @param {Number} scale - 缩放比例
 * @param {Number} duration - 持续时间
 * @returns {Object} 动画对象
 */
const createScaleAnimation = (scale = 1.2, duration = 300) => {
  const animation = wx.createAnimation({
    duration,
    timingFunction: 'ease-in-out'
  });

  animation.scale(scale).step();
  animation.scale(1).step();
  
  return animation.export();
};

/**
 * 创建旋转动画
 * @param {Number} rotate - 旋转角度
 * @param {Number} duration - 持续时间
 * @returns {Object} 动画对象
 */
const createRotateAnimation = (rotate = 360, duration = 1000) => {
  const animation = wx.createAnimation({
    duration,
    timingFunction: 'linear'
  });

  animation.rotate(rotate).step();
  return animation.export();
};

/**
 * 创建弹跳动画
 * @param {Number} duration - 持续时间
 * @returns {Object} 动画对象
 */
const createBounceAnimation = (duration = 600) => {
  const animation = wx.createAnimation({
    duration,
    timingFunction: 'ease-in-out'
  });

  animation.translateY(-20).step({ duration: duration / 3 });
  animation.translateY(0).step({ duration: duration / 3 });
  animation.translateY(-10).step({ duration: duration / 6 });
  animation.translateY(0).step({ duration: duration / 6 });
  
  return animation.export();
};

/**
 * 创建摇晃动画
 * @param {Number} duration - 持续时间
 * @returns {Object} 动画对象
 */
const createShakeAnimation = (duration = 500) => {
  const animation = wx.createAnimation({
    duration,
    timingFunction: 'ease-in-out'
  });

  animation.rotate(10).step({ duration: duration / 4 });
  animation.rotate(-10).step({ duration: duration / 4 });
  animation.rotate(5).step({ duration: duration / 4 });
  animation.rotate(0).step({ duration: duration / 4 });
  
  return animation.export();
};

/**
 * 创建脉冲动画
 * @param {Number} duration - 持续时间
 * @returns {Object} 动画对象
 */
const createPulseAnimation = (duration = 1000) => {
  const animation = wx.createAnimation({
    duration,
    timingFunction: 'ease-in-out'
  });

  animation.scale(1.1).step({ duration: duration / 2 });
  animation.scale(1).step({ duration: duration / 2 });
  
  return animation.export();
};

/**
 * 缓动函数 - easeInOut
 * @param {Number} t - 当前时间
 * @param {Number} b - 初始值
 * @param {Number} c - 变化量
 * @param {Number} d - 持续时间
 * @returns {Number} 计算值
 */
const easeInOut = (t, b, c, d) => {
  if ((t /= d / 2) < 1) return c / 2 * t * t + b;
  return -c / 2 * ((--t) * (t - 2) - 1) + b;
};

/**
 * 缓动函数 - easeOutBounce
 * @param {Number} t - 当前时间
 * @param {Number} b - 初始值
 * @param {Number} c - 变化量
 * @param {Number} d - 持续时间
 * @returns {Number} 计算值
 */
const easeOutBounce = (t, b, c, d) => {
  if ((t /= d) < (1 / 2.75)) {
    return c * (7.5625 * t * t) + b;
  } else if (t < (2 / 2.75)) {
    return c * (7.5625 * (t -= (1.5 / 2.75)) * t + 0.75) + b;
  } else if (t < (2.5 / 2.75)) {
    return c * (7.5625 * (t -= (2.25 / 2.75)) * t + 0.9375) + b;
  } else {
    return c * (7.5625 * (t -= (2.625 / 2.75)) * t + 0.984375) + b;
  }
};

module.exports = {
  createCheckinAnimation,
  createSmokeParticles,
  updateParticles,
  drawParticles,
  createFireworkAnimation,
  createFadeInAnimation,
  createFadeOutAnimation,
  createSlideInAnimation,
  createScaleAnimation,
  createRotateAnimation,
  createBounceAnimation,
  createShakeAnimation,
  createPulseAnimation,
  easeInOut,
  easeOutBounce
};
