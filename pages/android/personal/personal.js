let app = getApp();
let globalData = app.globalData;

const ERROR_OK = globalData.ERROR_OK;
const BASE_URL = globalData.requestBaseUrl;

const getPhoneUrl = BASE_URL + '/auth/getPhone';

let utils = require('../../../utils/utils.js');
let showToast = utils.showToast;
let commonErrMsg = utils.commonErrMsg;

let wechat = require('../../../utils/WeChat.js');

const defaultInfo = {
  nickName: '优会停用户',
  avatarUrl: '../../../resource/icon/default-user-avatar.png'
}

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
    userInfo: defaultInfo,
    hasUserInfo: false,
    hasPhone: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

    wechat.getStorage('loginInfo')
      .then(res => {
        if (res.hasPhone) {
          this.setData({
            hasPhone: res.hasPhone
          })
          wechat.getUserInfo()
            .then(res => {
              this.setData({
                userInfo: res.userInfo,
                hasUserInfo: true
              })
            })
        } else {
          this.setData({
            hasPhone: false
          })
        }
      }, res => {
        this.setData({
          hasPhone: false
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
   * 获取用户信息
   */
  bindgetuserinfo: function (e) {
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  },

  /**
   * 前往个人中心子页面
   */
  bindFunctionItem: function (e) {
    wechat.getStorage('loginInfo').then(res => {
      if (res.hasPhone) {
        let $router = e.currentTarget.dataset.router;
        wx.navigateTo({
          url: `/personalPages/pages/${$router}/${$router}`
        })
      } else {
        showToast('请先绑定手机号');
      }
    })
  },
})