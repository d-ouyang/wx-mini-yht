// components/circle/circle.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    step:Number
  },

  /**
   * 组件的初始数据
   */
  data: {
    bottomColor: '#D5D5D6',
    middleColor: '#D5D5D6',
    circleData:[
      {
        deg: -90
      },
      {
        deg: -90
      },
      {
        deg: -90
      },
      {
        deg: -90
      }
    ]
  },

  /**
   * 组件的方法列表
   */
  methods: {
    setCircle: function(step) {
      let circleData = this.data.circleData;
      let activeIndex = 0;
      let bottomColor = '';
      let middleColor = '';
      let deg = 0;
      if (step == 0) { // 没库存
        bottomColor = '#D5D5D6';
        middleColor = '#D5D5D6';
        activeIndex = 0;
        deg = -90;
      } else if (step > 0 && step <= 25) {
        bottomColor = '#FEE9E9';
        middleColor = '#FF6767';
        activeIndex = 0;
        deg = 0;
      } else if (step > 25 && step <= 50) {
        bottomColor = '#FEF8E9';
        middleColor = '#FED215';
        activeIndex = 1;
        deg = parseInt(90 * (step - 25)/25) - 90;
      } else if (step > 50 && step <= 75) {
        bottomColor = '#FEF8E9';
        middleColor = '#FED215';
        activeIndex = 2;
        deg = parseInt(90 * (step - 50) / 25) - 90;
      } else if (step > 75 && step <= 100) {
        bottomColor = '#E8FBF6';
        middleColor = '#1AD19D';
        activeIndex = 3;
        deg = parseInt(90 * (step - 75) / 25) - 90;
      }

      for (let i in circleData) {
        if (i < activeIndex) {
          circleData[i].deg = 0;
        } else if (i == activeIndex) {
          circleData[i].deg = deg;
        } else if (i > activeIndex) {
          circleData[i].deg = -90;
        }
      }

      this.setData({
        bottomColor: bottomColor,
        middleColor: middleColor,
        circleData: circleData
      })
    }
  },
  attached: function(){
    let step = this.data.step;
    console.log(step);
    this.setCircle(step);
  }
})
