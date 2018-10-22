let app = getApp();
let globalData = app.globalData;

const ERROR_OK = globalData.ERROR_OK;
const BASE_URL = globalData.requestBaseUrl;
const loginUrl = BASE_URL + '/auth/wechatLogin';

let utils = require('../../utils/utils.js');
let showToast = utils.showToast;

let wechat = require('../../utils/WeChat.js');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    isAuthorize: true, // 默认不出现授权框
    firstLoading: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this._chession()
  },

  _chession: function(){
    wechat.checkSession().then(() => {
      wechat.getStorage('loginInfo').then(res => {
        
      }).catch(res => {
        wechat.login().then(res => {
          return wechat.requestLogin(loginUrl, {
            js_code: res.code
          });
        }).then(res => {
          this.setData({
            hasPhone: res.hasPhone
          })
          return wechat.setStorage('loginInfo', res)
        })
      })
    }, () => {
      wechat.login().then(res => {
        return wechat.requestLogin(loginUrl, {
          js_code: res.code
        });
      }).then(res => {
        return wechat.setStorage('loginInfo', res)
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
    this.getLocation();
  },

  /**
   * 拿地理位置授权
   */
  getLocation: function() {
    wechat.getSetting().then(res => { // 还未授权
      if (!res.authSetting['scope.userLocation']) {
        wechat.authorize('scope.userLocation').then(res => {
          return true;
        }).catch( res => {
          return false;
        }).then (res => {
          this.setData({
            isAuthorize: res
          })
          if (res) {
            return wechat.getSystemInfo()
          }
        }).then(res => {
          if (res) {
            this.toIosOrAndroid(res)
          }
        })
      } else { // 已经授权
        this.setData({
          isAuthorize: res
        })
        return wechat.getSystemInfo()
      }
    }).then(res => {
      if (res) {
        this.toIosOrAndroid(res)
      }
    })
  },

  /**
   * 前往 Android 还是 ios
   */
  toIosOrAndroid: function(res) {
    if (res.system.indexOf('iOS') > -1) {
      wx.switchTab({
        url: '/pages/index/index/index'
      })
    } else if (res.system.indexOf('Android') > -1) {
      wx.redirectTo({
        url: '/pages/android/index/index'
      })
    }
  },
})