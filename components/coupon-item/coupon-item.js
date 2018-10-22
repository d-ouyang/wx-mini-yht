// components/coupon-item/coupon-item.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    coupon: Object,
    index: Number
  },

  /**
   * 组件的初始数据
   */
  data: {

  },

  /**
   * 组件的方法列表
   */
  methods: {
    getData: function(){
      console.log(this.data.coupon);
    }
  },
  attached: function () {
    this.getData();
  },
})
