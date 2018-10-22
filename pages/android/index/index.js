let app = getApp();
let globalData = app.globalData;

const ERROR_OK = globalData.ERROR_OK;
const BASE_URL = globalData.requestBaseUrl;

const RADIUS = '1000';
const FREE = 15; //免费 15 分钟

// 登录
const loginUrl = BASE_URL + '/auth/wechatLogin';
// 获取手机号
const getPhoneUrl = BASE_URL + '/auth/getPhone';
// 附近停车场 url
const parklistUrl = BASE_URL + '/park/listParkByPosition';
// 车辆列表 url
const carlistUrl = BASE_URL + '/car/list';
// 停车订单
const carOrderUrl = BASE_URL + '/order/cost';

let utils = require('../../../utils/utils.js');
let showToast = utils.showToast;
let commonErrMsg = utils.commonErrMsg;

let wechat = require('../../../utils/WeChat.js');

var QQMapWX = require('../../../libs/qqmap-wx-jssdk.min.js');
// 实例化API核心类
var demo = new QQMapWX({
  key: 'SDIBZ-DLIWJ-52RFK-FRMPQ-AV3C6-VYFQI' // 必填
});

const parkListNoData = {
  image: '/resource/image/search.png',
  desc: '附近暂无停车场'
}
const plateNoData = {
  image: '/resource/image/carPlate.png',
  desc: '暂无绑定车牌'
}
const orderNoData = {
  image: '/resource/image/trip.png',
  desc: '暂无待缴费订单'
}

Page({
  /**
   * 页面的初始数据
   */
  data: {
    state: 0,
    destinationValue:'你想停在哪里？',
    locationAddress: '当前位置',
    isDestination: false,
    parkActive: false, // 默认为缴费
    firstLoading: true, // 默认第一次加载获取当前位置拿停车场数据
    needAddLicense: false, // 是否需要添加车牌 也控制车牌的显示隐藏
    parkList: [],
    hasOrder: false, // 默认没有订单
    parkListNoData: parkListNoData,
    plateNoData: plateNoData,
    orderNoData: orderNoData,
    firstCheckCarPlate: true,
    hasUserInfo: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wechat.checkSession().then(() => {
      wechat.getStorage('loginInfo').then(res => {
        this.setData({
          hasPhone: res.hasPhone
        })
        this.handleUserInfo(res.hasPhone);
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
        }).then(() => {
          this.handleUserInfo(this.data.hasPhone);
        })
      })
      }, () => {
        wechat.login().then(res => {
          return wechat.requestLogin(loginUrl, {
            js_code: res.code
          });
        }).then(res => {
          this.setData({
            hasPhone: res.hasPhone
          })
          return wechat.setStorage('loginInfo', res)
        }).then(() => {
          this.handleUserInfo(this.data.hasPhone);
        })
      })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // 查车牌 不是初始化
    if (!this.data.firstCheckCarPlate) {
      if (this.data.hasPhone && !this.data.parkActive) {
        utils.loading()
        wechat.request(carlistUrl).then(res => {
          this.handleCarlist(res)
        })
      }
    }

    let pages = getCurrentPages();
    let currPage = pages[pages.length - 1];
    let data = currPage.data;

    if (!data.state && data.parkActive) {
      this.getCurrentPosition();
      return;
    } else if (data.state){
      let destinationData = data.destinationData;
      let destinationLat = destinationData.location.lat;
      let destinationLng = destinationData.location.lng;
      let currentLat = this.data.currentLat;
      let currentLng = this.data.currentLng;
      // 同一目的地不用重复加载
      if (this.data.destinationValue == destinationData.title) {
        return;
      }

      this.setData({
        destinationValue: destinationData.title,
        isDestination: true,
        parkActive: false
      },() => {
        if (!this.data.parkActive) {
          this.setData({
            parkActive: true
          })
        }
        this.getNearbyParking(destinationLat, destinationLng);
      })
    }
  },

  /**
   * bindreset
   */
  catchreset: function() {
    this.setData({
      destinationValue: '你想停在哪里？',
      isDestination: false
    }, () => {
      this.getCurrentPosition();
    })
  },

  /**
   * 前往搜索页
   */
  goToSearch: function () {
    wx.navigateTo({
      url: '/pages/index/search/search',
    })
  },

  /**
   * 逆地址解析
   */
  reverseGeocoder: function (latitude, longitude) {
    demo.reverseGeocoder({
      location: {
        latitude: latitude,
        longitude: longitude
      },
      success: res => {
        this.setData({
          locationAddress: res.result.address
        })
      },
      fail: res => {
        this.setData({
          locationAddress: '当前位置'
        })
      }
    })
  },

  /**
   * hasPhone 处理 是否查询车牌
   */
  handleUserInfo: function (bool) {
    if (bool == true) { // 如果绑定了手机就去查车牌
      utils.loading();
      wechat.request(carlistUrl)
        .then(res => {
          this.setData({
            firstCheckCarPlate: false
          }, this.handleCarlist(res))
        })
    } else { // 没有绑定手机号就显示绑定车牌
      this.setData({
        needAddLicense: true
      })
    }
  },

  /**
   * 处理车牌列表
   */
  handleCarlist: function (data) {
    var list = data.dataList;
    var len = list.length;
    if (!len) {
      this.setData({
        needAddLicense: true,
        hasOrder: false
      }, () => {
        wx.hideLoading();
      })
      return;
    } else {
      wx.hideLoading();
      this.setData({
        needAddLicense: false
      })
      for (let i in list) {
        list[i].carNumber = utils.handleCarPlate(list[i].car_number)
        if (list[i].is_newEnergyVehicle == '0') {
          list[i].isNewEnergy = false;
        } else if (list[i].is_newEnergyVehicle == '1') {
          list[i].isNewEnergy = true;
        }

        let options = {
          carNumber: list[i].car_number,
          carType: list[i].car_type
        }
        utils.loading()
        wechat.request(carOrderUrl, options).then(res => {
          
          if (!res) { // 无订单
            list[i].hasOrder = false;
          } else {
            list[i].hasOrder = true;
            list[i].duration = '需付费时长' + utils.handleParkTime(res.orderInfo.minute);
            list[i].parkName = res.orderInfo.parkName;
            if (res.wechatFlag == 0 || res.wechatFlag == -1) { // 不支持
              list[i].needPay = false;
              list[i].wxsp = false;
            } else if (res.wechatFlag == 1){ // 支持
              list[i].wxsp = true;
              if (res.orderPay.receivableAmt <= 0) {
                list[i].needPay = false;
              } else {
                list[i].needPay = true;
              }
            }
            if (res.payList.length) {
              // 判断当前时间和上次结算时间是否大于免费离场时间
              let obj = this.judgeDiff(res.orderPay.startTime, res.orderPay.endTime, res.orderInfo.minute, res.orderInfo.freeMinute);
              list[i].status = obj.bool;
              list[i].duration = obj.duration;
            } else {
              list[i].status = true;
              list[i].duration = '需付费时长' + utils.handleParkTime(res.orderInfo.minute);
            }
            this.setData({
              hasOrder: true
            })
          }
          return i
        }).then( res => {
          this.setData({
            carList: list
          },() => {
            wx.hideLoading();
          })
        })
      }
    }
  },

  /**
   * 判断 orderPay diff
   */
  judgeDiff: function (start, end, minute, free){
    let startSecond = this.returnSecond(start);
    let endSecond = this.returnSecond(end);
    let diff = endSecond - startSecond;
    let duration = '';
     
    if (diff >= free*60) {
      duration = '需付费时长' + utils.handleParkTime(minute);
      return {
        bool: true,
        duration: duration
      }
    } else {
      let criticalTime = (startSecond + free * 60) * 1000// 临界值
      let theEndDate = new Date(criticalTime);
      let h, m, s;
      h = theEndDate.getHours();
      m = theEndDate.getMinutes();
      s = theEndDate.getSeconds();
      if (h <= 9) h = '0' + h;
      if (m <= 9) m = '0' + m;
      if (s <= 9) s = '0' + s;

      duration = `请在 ${h}:${m}:${s} 前离开`
      return {
        bool: false,
        duration: duration
      }
    }
  },

  /**
   * 返回秒数
   */
  returnSecond: function (startTime) {
    startTime = startTime.replace(/\-/g, '/');
    let startDate = new Date(startTime)
    let start = startDate.getTime() / 1000;
    return start;
  },

  /**
   * 去缴费
   */
  bindpay: function (e) {
    let theData = e.currentTarget.dataset;
    let needPay = theData.needPay;
    let wxsp = theData.wxsp;
    let payInfo = JSON.stringify(theData.info);
    if (needPay && wxsp) {
      wx.navigateTo({
        url: `/pages/index/order/order?payInfo=${payInfo}`
      })
    } else {
      if (!wxsp) { // 产生费用 但为一清模式
        showToast('停车场暂未开通微信支付');
      } else {
        showToast('暂未产生费用，无需缴费');
      }
    }
  },

  /**
   * 添加车牌
   */
  addLicense: function(){
    wx.navigateTo({
      url: '../../common/addLicense/addLicense'
    })
  },

  /**
   * 点击停车场
   */
  bindtabpark: function(e){
    let active = e.currentTarget.dataset.active;
    if (active) {
      return;
    } else {
      this.setData({
        parkActive: true
      }, () => {
        if (this.data.isDestination){
          return;
        } else {
          this.getCurrentPosition();
        }
      })
    }
  },

  /**
   * 点击缴费
   */
  bindtabpayment: function(e){
    let active = e.currentTarget.dataset.active;
    if (active) {
      this.setData({
        parkActive: false
      })
    } else {
      return
    }
  },

  /**
   * 获取用户当前位置
   */
  getCurrentPosition: function () {
    wechat.getLocation().then(res => {
      this.getNearbyParking(res.latitude, res.longitude);
      if (!this.data.isDestination) {
        this.reverseGeocoder(res.latitude, res.longitude);
      }
    })
  },

  /**
   * 获取附近停车场
   */
  getNearbyParking: function (lat, lng) {
    let requestData = {
      radius: RADIUS,
      latitude: lat,
      longitude: lng
    }
    utils.loading();
    wechat.request(parklistUrl, requestData)
      .then(res => {
        wx.hideLoading();
        this.handleParkList(res.parkList, lat, lng)
      })
      .catch(res => {
        if (res.errMsg.indexOf('timeout') > -1) {
          wx.hideLoading();
          showToast('请求超时');
        }
      })
  },

  /**
   * 处理停车场列表
   */
  handleParkList: function (list, lat, lng){
    if (!list.length) {
      this.setData({
        parkList: []
      })
    } else {
      for (let i in list) {
        list[i] = this.restructureParkingInfo(list[i])
      }
      this.setData({
        parkList: list
      })
    }
  },

  /**
   * 重构停车场信息数据结构
   */
  restructureParkingInfo: function (data) {
    // 导航信息
    let navInfo = {};
    navInfo.longitude = data.lon_lat.split(',')[0];
    navInfo.latitude = data.lon_lat.split(',')[1];
    navInfo.name = data.park_name;
    navInfo.address = data.addr;
    data.navInfo = navInfo;
    data.rule_type = data.rule.rule_type;
    if (data.rule.rule_type == '0') {
      data.charge = '每小时'
      data.amount = data.rule.unit_smallcharge_rate;
    } else if (data.rule.rule_type == '1' ){
      data.charge = '每次'
      data.amount = data.rule.onetime_smallcharge_rate;
    }
    return data
  },

  /**
   * 获取用户手机号
   */
  getPhoneNumber: function (e) {
    if (e.detail.encryptedData) {
      const encryptedData = e.detail.encryptedData;
      const iv = e.detail.iv;
      utils.loading();
      wechat.request(getPhoneUrl, {
        encryptedData: encryptedData,
        iv: iv
      }).then(res => {
        wechat.getStorage('loginInfo').then(data => {
          let loginInfo = data;
          if (res.newToken) {
            loginInfo.token = res.newToken;
          }
          loginInfo.hasPhone = true;
          loginInfo.phone = res.phone;
          return wechat.setStorage('loginInfo', loginInfo)
        }).then(res => {
          this.setData({
            hasPhone: true
          })
          this.handleUserInfo(true);
        })
      })
    }
  },

  /**
   * 导航
   */
  bindNavigate: function(e){
    let navInfo = e.currentTarget.dataset.navInfo;
    navInfo.latitude = Number(navInfo.latitude);
    navInfo.longitude = Number(navInfo.longitude);
    wx.openLocation(navInfo);
  },

  /**
   * 刷新订单状态
   */
  bindrefresh: function(){
    utils.loading()
    wechat.request(carlistUrl).then(res => {
      this.handleCarlist(res)
    })
  },

  /**
   * 前往个人中心
   */
  goToPersonal: function(){
    wx.navigateTo({
      url: '/pages/android/personal/personal',
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  

  
})