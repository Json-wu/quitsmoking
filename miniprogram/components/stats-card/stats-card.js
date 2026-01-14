// components/stats-card/stats-card.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    icon: {
      type: String,
      value: '📊'
    },
    value: {
      type: String,
      value: '0'
    },
    label: {
      type: String,
      value: '统计'
    },
    trend: {
      type: Number,
      value: 0
    },
    customClass: {
      type: String,
      value: ''
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    Math: Math
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleTap() {
      this.triggerEvent('tap', {
        label: this.properties.label,
        value: this.properties.value
      });
    }
  }
});
