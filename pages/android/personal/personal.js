let app = getApp();
let globalData = app.globalData;

const ERROR_OK = globalData.ERROR_OK;
const BASE_URL = globalData.requestBaseUrl;

const getPhoneUrl = BASE_URL + '/auth/getPhone';

let utils = require('../../../utils/utils.js');
let showToast = utils.showToast;
let commonErrMsg = utils.commonErrMsg;

let wechat = require('../../../utils/WeChat.js');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    items: [
      // {
      //   icon: '/resource/icon/personal_card.png',
      //   title: '卡包',
      //   router: 'cardsBag'
      // },
      // {
      //   icon: '/resource/icon/personal_coupon.png',
      //   title: '优惠券',
      //   router: 'coupons'
      // },
      {
        icon: '/resource/icon/personal_journey.png',
        title: '行程',
        router: 'trip'
      },
      {
        icon: '/resource/icon/personal_car_license.png',
        title: '车牌',
        router: 'licensePlate'
      },
      // {
      //   icon: '/resource/icon/personal_invoice.png',
      //   title: '发票',
      //   router: 'invoice'
      // }
    ],
    hasPhone: false,
    locked: true,
    logining: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wechat.getStorage('loginInfo').then(res => {
      if (res.hasPhone) {
        this.setData({
          hasPhone: true,
          locked: false
        })
      } else {
        this.setData({
          hasPhone: false,
          locked: false
        })
      }
    }, res => {
      this.setData({
        hasPhone: false,
        locked: false
      })
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
   * 前往个人中心子页面
   */
  bindFunctionItem: function (e) {
    console.log(this.data.locked);
    console.log(this.data.hasPhone);
    if (this.data.locked) {
      return
    }
    if (this.data.hasPhone) {
      let $router = e.currentTarget.dataset.router;
      wx.navigateTo({
        url: `/personalPages/pages/${$router}/${$router}`
      })
    } else {
      console.log(this.data.logining);
      this.setData({
        logining: true
      })
    }
  },

  /**
   * 监听子组件事件
   */
  onHideLogin: function (e) {
    let hasPhone = e.detail.hasPhone;
    this.setData({
      hasPhone,
      logining: false
    })
  },

  onHide: function () {
    this.setData({
      logining: false
    })
  }
})