let app = getApp();
let globalData = app.globalData;

const ERROR_OK = globalData.ERROR_OK;
const BASE_URL = globalData.requestBaseUrl;

let utils = require('../../../utils/utils.js');
let showToast = utils.showToast;
let objIsNull = utils.objIsNull;

let wechat = require('../../../utils/WeChat.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {
  
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let payInfo = JSON.parse(options.payInfo);
    this.setData({
      payInfo: payInfo
    })
  },

  /**
   * 完成
   */
  bindOverPay: function(){
    // 如果为苹果手机
    wechat.getSystemInfo().then(res => {
      if (res.system.indexOf('iOS') > -1) {
        wx.switchTab({
          url: '/pages/index/index/index'
        })
      } else if (res.system.indexOf('Android') > -1) {
        wx.redirectTo({
          url: '/pages/android/index/index'
        })
      }
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
  
  },
})