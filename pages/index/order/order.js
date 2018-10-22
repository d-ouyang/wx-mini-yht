let app = getApp();
let globalData = app.globalData;

const BASE_URL = globalData.requestBaseUrl;
const orderUrl = BASE_URL + '/order/cost';
const payUrl = BASE_URL + '/order/wxTradeCreate';
const callNotifyUrl = BASE_URL + '/order/callNotify';

let utils = require('../../../utils/utils.js');
let showToast = utils.showToast;
let handleCarPlate = utils.handleCarPlate;

let wechat = require('../../../utils/WeChat.js');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    payOrderInfo:{}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let payInfo = JSON.parse(options.payInfo);
    let requestData = {
      carNumber: payInfo.car_number,
      carType: payInfo.car_type
    }
    utils.loading();
    wechat.request(orderUrl, requestData)
      .then(res => {
        this.handleInfo(res)
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

  /**
   * 处理订单信息
   */
  handleInfo: function(res){
    let payOrderInfo = {};
    payOrderInfo.car_number = res.orderInfo.carNumber;
    payOrderInfo.carNumber = handleCarPlate(res.orderInfo.carNumber);
    payOrderInfo.parkName = res.orderInfo.parkName;
    payOrderInfo.inTime = res.orderInfo.inTime;
    payOrderInfo.freeMinute = res.orderInfo.freeMinute;
    payOrderInfo.parkTime = utils.handleParkTime(res.orderInfo.minute);
    payOrderInfo.endTime = res.orderPay.endTime;
    payOrderInfo.receivableAmt = res.orderPay.receivableAmt;
    payOrderInfo.realAmt = res.orderPay.realAmt;
    payOrderInfo.id = res.orderPay.id;
    if (!res.payList || !res.payList.length) {
      payOrderInfo.hasPayNote = false;
    } else {
      payOrderInfo.hasPayNote = true;
      payOrderInfo.lastPayTime = res.orderPay.startTime;
    }
    this.setData({
      payOrderInfo: payOrderInfo
    })
    wx.hideLoading();
  },

  /**
   * 点击支付 bindPay
   */
  bindPay: function(){
    let payInfo = this.data.payOrderInfo;
    let payId = payInfo.id;
    wechat.request(payUrl, { orderPayId: payId })
      .then( res => {
        return wechat.wxPay(res.unifiedOrder);
      }).then(res => {
        utils.loading();
        wechat.request(callNotifyUrl, { id: payId }).then(res => {
          wx.hideLoading();
          wx.redirectTo({
            url: '../orderOver/orderOver?payInfo=' + JSON.stringify(payInfo),
          })
        })
      })
      .catch(res => {
        showToast('支付失败')
      })
  }
})