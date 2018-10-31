let app = getApp();
let globalData = app.globalData;

const ERROR_OK = globalData.ERROR_OK;
const BASE_URL = globalData.requestBaseUrl;

const RADIUS = '10000';

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

const LAT = 31.191887;
const LNG = 121.438835;
const SCALE = 5;

const diffHeight = 220; // 订单区域与总高度差值
const noPayInfoHeight = 108; // 没有订单
const hasPayInfoHeight = 222; // 有订单
const hasOrderHeight = 478; // 有订单是车牌信息高度
const noOrderHeight = 364; // 没有订单车牌信息高度
const carListHeight = 184; // 车牌列表高度

const productHeight = 152; // 产品信息高度
const parkInfoHeight = 400; // 停车场信息高度

const normal_font_size = 13;
const normal_color = '#ffffff';
const normal_one_time_anchorX = -20;
const normal_one_hour_anchorX = -19;
const normal_two_time_anchorX = -21;
const normal_two_hour_anchorX = -20;
const normal_anchorY = -30;
const normal_width = 72;
const normal_height = 38;
const normal_icon_path = '/resource/icon/normal-point.png';

const active_font_size = 14;
const active_color = '#ED3E35';
const active_time_anchorX = -15;
const active_hour_anchorX = -21;
const active_anchorY = -54;
const active_width = 62;
const active_height = 66;
const active_icon_path = '/resource/icon/active-point.png';

Page({
  /**
   * 页面的初始数据
   */
  data: {
    state: 0,
    timer: null,
    freeTimeStatus: false,
    freeTime:'',
    currentCarPlate: {},// 默认当前选中车牌为空
    firstLoading: true, // 默认第一次加载获取当前位置拿停车场数据
    // firstCheckCarPlate: true, // 默认第一次查车牌
    destinationValue: '你想停在哪里？',
    isDestination: false,
    hasPay: false, // 默认没有要支付的订单
    needPay: false, // 默认不需要缴费
    hasPhone: false, // 默认需要授权获取手机号
    isOverDay: true, // 默认超过一天
    overDayValue: '',
    payH: '00',
    payM: '00',
    payS: '00',
    scale: 12,
    hasProduct: false, // 默认没有产品
    needAddLicense: false, // 是否需要添加车牌 也控制车牌的显示隐藏
    carListBox: false, // 默认隐藏车牌列表
    carList: [],
    isPlateOpacity: true, // 默认透明
    isParkingOpacity: true, //默认透明
    payInfoHeight: noPayInfoHeight,
    plateTranslateY: noOrderHeight, // 默认在底部
    plateInfoHeight: noOrderHeight, // 车牌信息高度 默认有订单
    productTranslateY: parkInfoHeight, // 默认在底部
    parkingInfoHeight: parkInfoHeight, // 停车场信息高度 固定的
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    
  },

  /**
   * 车牌元素过滤器
   */
  filterCarplate: function(item){
    item.carNumber = utils.handleCarPlate(item.car_number);
    if (item.is_newEnergyVehicle == '0') {
      item.isNewEnergy = false;
    } else if (item.is_newEnergyVehicle == '1') {
      item.isNewEnergy = true;
    }
    return item
  },

  /**
   * 处理车牌列表
   */
  handleCarlist: function(data) {
    let list = data.dataList;
    if (!list.length) {
      showToast('未查到您的车牌记录');
      this.setData({
        needAddLicense: true,
        carList: list
      })
      return;
    }

    let currentCarPlate = this.data.currentCarPlate;
    
    for (let i in list) {
      list[i] = this.filterCarplate(list[i]);
    }

    this.setData({
      needAddLicense: false
    },() => {
      // this.switchBottomBox()
      setTimeout(() => {
        this.setData({
          carList: list
        })
      },300)
    })

    if (utils.objIsNull(currentCarPlate)) { // 第一次
      currentCarPlate = list[0];
      this.setData({
        currentCarPlate
      },() => {
        this.checkPayOrder(currentCarPlate);
      })
    } else { // 第二次
      wechat.getStorage('onStatusChange').then( res => {
        if (res.status && currentCarPlate.car_number == res.carNumber) {
          currentCarPlate = list[0];
          wechat.setStorage('onStatusChange', {
            status: false,
            carNumber: ''
          });
          this.setData({
            currentCarPlate
          }, () => {
            this.checkPayOrder(currentCarPlate);
          })
        } else {
          this.checkPayOrder(currentCarPlate)
        }
      })
      .catch( res => {
        this.checkPayOrder(currentCarPlate)
      })
    }
  },

  /**
   * 生命周期函数--页面渲染完成
   */
  onReady: function() {
    // 使用 wx.createMapContext 获取 map 上下文
    this.mapCtx = wx.createMapContext('map');
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    if (this.data.hasPhone) {
      wechat.request(carlistUrl).then( res => {
        this.handleCarlist(res);
      })
    } else {
      wechat.getStorage('loginInfo').then(res => {
        this.setData({
          hasPhone: res.hasPhone
        })
        if (res.hasPhone){
          wechat.request(carlistUrl).then(res => {
            this.handleCarlist(res);
          })
        } else {
          this.setData({
            needAddLicense: true
          })
        }
      })
    }

    if (!this.data.state) {
      this.getCurrentPosition();
    } else {
      let markers = this.data.markers;
      let destinationData = this.data.destinationData;
      let destinationLat = destinationData.location.lat;
      let destinationLng = destinationData.location.lng;
      let currentLat = this.data.currentLat;
      let currentLng = this.data.currentLng;
      // 同一目的地不用重复加载
      if (this.data.destinationValue == destinationData.title) {
        this.switchBottomBox();
        return;
      }
      this.setData({
        destinationValue: destinationData.title,
        isDestination: true
      })

      // 请求
      let translateOptions = {
        markerId: markers.length - 1,
        destination: {
          latitude: destinationLat,
          longitude: destinationLng,
        },
        autoRotate: false,
        rotate: 0,
        duration: 500,
        animationEnd: () => {
          this.getNearbyParking(destinationLat, destinationLng);
          this.setMapCenter(destinationLat, destinationLng);
        }
      }
      // 平移目标点
      this.mapCtx.translateMarker(translateOptions);
    }
  },

  /**
   * 获取用户当前位置
   */
  getCurrentPosition: function () {
    wechat.getLocation().then(res => {
      this.setMapCenter(res.latitude, res.longitude);
      this.getNearbyParking(res.latitude, res.longitude);
    })
  },

  /**
   * 切换车牌列表状态
   */
  getCarPlate: function(e) {
    let len = this.data.carList.length;
    let carListBox = this.data.carListBox;
    console.log(carListBox);
    if (len > 1) {
      if (carListBox) {
        this.setData({
          plateTranslateY: carListHeight
        })
        setTimeout(res => {
          this.setData({
            carListBox: false
          })
        }, 300)
      } else {
        this.setData({
          carListBox: true,
          plateTranslateY: 0
        })
      }
    }
  },

  /**
   * 选择不同的车牌来查看是否有进行中的订单
   */
  selectCarNumber: function(e) {
    let selectCarPlate = e.currentTarget.dataset.item;
    let selectCarNumber = selectCarPlate.car_number;
    let currentCarPlate = this.data.currentCarPlate;
    console.log(selectCarPlate);
    if (selectCarNumber == currentCarPlate.car_number) {
      return;
    } else {
      this.setData({
        plateTranslateY: hasOrderHeight
      },() => {
        setTimeout(() => {
          this.setData({
            currentCarPlate: selectCarPlate
          })
        }, 300)
        this.checkPayOrder(selectCarPlate);
      })
    }
  },

  /**
   * 查询订单费用
   */
  checkPayOrder: function(o) {
    let options = {
      carNumber: o.car_number,
      carType: o.car_type
    }
    utils.loading();
    wechat.request(carOrderUrl, options).then(res => {
      if (!res) { // 说明不存在订单
        this.setData({
          hasPay: false,
          plateInfoHeight: noOrderHeight,
          payInfoHeight: noPayInfoHeight
        })
        setTimeout(() => {
          this.switchBottomBox();
          wx.hideLoading();
        },300)
      } else { // 存在订单
        let orderInfo = {}
        orderInfo.parkName = res.orderInfo.parkName;
        orderInfo.freeMinute = res.orderInfo.freeMinute;
        if (res.orderPay.realAmt <= 0) { // 无费用
          if (res.wechatFlag == 0 || res.wechatFlag == -1) {// 不支持
            this.setData({
              needPay: false,
              wxsp: false
            })
          } else if (res.wechatFlag == 1){ // 支持
            this.setData({
              needPay: false,
              wxsp: true
            })
          }
          if (res.payList.length) {
            if (res.orderInfo.minute <= res.orderInfo.freeMinute) {
              this.countDown(res);
            } else {
              this.setData({
                freeTimeStatus: false,
                freeTime: ''
              })
              this.commonCost(res);
            }
          } else {
            this.setData({
              freeTimeStatus: false,
              freeTime: ''
            })
            this.commonCost(res);
          }
        } else {
          // 产生费用
          if (res.wechatFlag == 0 || res.wechatFlag == -1) {// 不支持
            this.setData({
              needPay: false,
              wxsp: false
            })
          } else if (res.wechatFlag == 1) { // 支持
            this.setData({
              needPay: false,
              wxsp: true
            })
          }
          this.setData({
            needPay: true,
            freeTimeStatus: false,
            freeTime: ''
          })
          this.commonCost(res);
        }
        this.setData({
          orderInfo: orderInfo,
          hasPay: true,
          payInfoHeight: hasPayInfoHeight,
          plateInfoHeight: hasOrderHeight
        },() => {
          this.switchBottomBox()
        })
      }
    })
  },

  /**
   * 倒计时 默认 节点为 endTime
   */
  countDown: function(res){
    let startTime = res.orderPay.startTime;
    let start = this.returnStartTime(startTime)
    // 目标时间
    let goalTime = start + res.orderInfo.freeMinute * 60 * 1000;
    clearInterval(this.data.timer);
    // 倒计时开始时间
    let timer = setInterval(() => {
      this.setData({
        timer: timer
      })
      let date = new Date();
      let now = date.getTime();
      let diff = parseInt((goalTime - now) / 1000);
      if (diff <= 0) {
        clearInterval(timer);
        this.setData({
          freeTimeStatus: false,
          freeTime: ''
        })
        this.commonCost(res);
      } else {
        let m = Math.floor(diff / 60);
        let s = Math.floor(diff - 60 * m);
        if (m <= 9) m = '0' + m;
        if (s <= 9) s = '0' + s;
        this.setData({
          freeTimeStatus: true,
          freeTime: m + ':' + s
        })
        wx.hideLoading();
      }
    }, 1000)
  },


  returnStartTime: function (startTime) {
    startTime = startTime.replace(/\-/g, '/');
    let startDate = new Date(startTime)
    let start = startDate.getTime();
    return start;
  },

  /**
   * 处理时间 时间段
   */
  commonCost: function(res){
    let startTime = res.orderPay.startTime;
    let start = this.returnStartTime(startTime);
    clearInterval(this.data.timer);
    let timer = setInterval(() => {
      this.countTime(start,res)
    }, 1000)
    this.setData({
      timer: timer
    })
  },

  /**
   * 处理时间 正计时
   */
  countTime: function (start,res) {
    let date = new Date();
    let now = date.getTime();
    let diff = parseInt((now - start) / 1000);
    let d, h, m, s;
    if (diff > 0) {
      d = Math.floor(diff / (60 * 60 * 24));
      h = Math.floor(diff / (60 * 60)) - (d * 24);
      m = Math.floor(diff / 60) - (d * 24 * 60) - (h * 60);
      s = Math.floor(diff) - (d * 24 * 60 * 60) - (h * 60 * 60) - (m * 60);
    }
    if (d >= 1) {
      let duration = parseInt(diff / 60);
      let day, hour;
      day = Math.floor(duration / (60 * 24));
      hour = Math.floor(duration / 60 - 24 * day);
      this.setData({
        isOverDay: true,
        overDayValue: `停车已超过${day}天${hour}小时`
      })
    } else {
      if (h <= 9) h = '0' + h;
      if (m <= 9) m = '0' + m;
      if (s <= 9) s = '0' + s;

      if(h != this.data.payH){
        this.setData({
          isOverDay: false,
          payH: h,
          payM: m,
          payS: s
        })
        this.commonCost(res);
      } 
      this.setData({
        isOverDay: false,
        payH: h,
        payM: m,
        payS: s
      })
    }
    wx.hideLoading();
  },

  /**
   * 去缴费
   */
  bindpay: function(e) {
    let theData = e.currentTarget.dataset;
    let needPay = theData.pay;
    let wxsp = theData.wxsp;
    let payInfo = JSON.stringify(theData.info);
     
    if (needPay && wxsp) {
      wx.navigateTo({
        url: `/pages/index/order/order?payInfo=${payInfo}`
      })
    } else {
      if (!wxsp) {
        showToast('停车场暂未开通微信支付');
      } else {
        showToast('暂未产生费用，无需缴费');
      }
    }
  },

  /**
   * 点击产品
   */
  bindProduct: function(){
    showToast('即将上线，尽请期待');
  },

  /**
   * 获取附近停车场
   */
  getNearbyParking: function(lat, lng) {
    let requestData = {
      radius: RADIUS,
      latitude: lat,
      longitude: lng
    }
    utils.loading();
    wechat.request(parklistUrl, requestData).then(res => {
      wx.hideLoading();
      if (!res.parkList.length) {
        showToast('附近暂无停车场');
      }
      this.handleMarkers(res, lat, lng)
    })
    .catch(res => {
      if (res.errMsg.indexOf('timeout') > -1) {
        wx.hideLoading();
        showToast('请求超时');
      }
    })
  },

  /**
   * 处理 markers 
   */
  handleMarkers: function(res, lat, lng) {
    this.setData({
      parkList: res.parkList
    })
    let data = res.parkList;
    var markers = [];
    var destination_marker = {
      id: data.length,
      latitude: lat,
      longitude: lng,
      iconPath: '/resource/icon/detination-point.png',
      width: 24,
      height: 45
    }

    for (let i in data) {
      let marker = {};
      let label = {};
      marker.id = parseInt(i);
      marker.parkcode = data[i].park_code; // parkcode
      marker.parktype = data[i].rule.rule_type; // parktype
      marker.longitude = data[i].lon_lat.split(',')[0];
      marker.latitude = data[i].lon_lat.split(',')[1];
      marker.iconPath = normal_icon_path;
      marker.width = normal_width;
      marker.height = normal_height;
      marker.click = false;

      if (data[i].rule.rule_type == '0') { // 按小时收费
        label.content = '￥' + data[i].rule.unit_smallcharge_rate + '/H';
        if (Number(data[i].rule.unit_smallcharge_rate) < 10) { // 单位数
          label.anchorX = normal_one_hour_anchorX;
        } else { // 双位数
          label.anchorX = normal_two_hour_anchorX;
        }
      } else if (data[i].rule.rule_type == '1') { // 按次收费
        label.content = '￥' + data[i].rule.onetime_smallcharge_rate + '/次';
        if (Number(data[i].rule.onetime_smallcharge_rate) < 10) {
          label.anchorX = normal_one_time_anchorX;
        } else {
          label.anchorX = normal_two_time_anchorX;
        }
      }
      label.fontSize = normal_font_size;
      label.color = normal_color;
      label.anchorY = normal_anchorY;
      label.textAlign = 'center';
      marker.label = label;
      markers.push(marker);
    }

    // 保证目的地在最上面
    markers.push(destination_marker);
    this.setData({
      markers: markers
    },() => {
      this.switchBottomBox();
      wx.hideLoading();
    })
  },

  /**
   * 设置地图中心点, 即目的地点, 并带上范围
   */
  setMapCenter: function(lat, lng) {
    var circles = [];
    var circle = {
      latitude: lat,
      longitude: lng,
      color: '#86B5F264',
      fillColor: '#ADCDFA48',
      radius: 300,
      strokeWidth: 1
    }
    circles.push(circle);
    this.setData({
      currentLat: lat,
      currentLng: lng,
      circles: circles
    })
  },

  /**
   * 点击 marker
   */
  bindmarkertap: function(e) {
    let parkList = this.data.parkList;
    let markers = this.data.markers;
    let current_marker_id = e.markerId;
    if (current_marker_id == markers.length - 1) {
      return false;
    }
    if (markers[current_marker_id].click) {
      return false;
    }


    markers[current_marker_id] = markers.splice(markers.length - 2, 1, markers[current_marker_id])[0];
    parkList[current_marker_id] = parkList.splice(parkList.length - 1, 1, parkList[current_marker_id])[0];


    for (let i in markers) {
      markers[i].id = parseInt(i);
    }

    markers = this.resetAllMarkers(markers);

    let active_id = markers.length - 2;

    markers[active_id].click = true;
    markers[active_id].iconPath = active_icon_path;
    markers[active_id].width = active_width;
    markers[active_id].height = active_height;
    markers[active_id].label.color = active_color;
    markers[active_id].label.fontSize = active_font_size;
    markers[active_id].label.anchorY = active_anchorY;
    let content = markers[active_id].label.content;
    if (content.length == 4) { // 单位数
      if (content.indexOf('H') > -1) { // 按小时
        content = content.slice(0, 2) + '\n每小时';
        markers[active_id].label.anchorX = active_hour_anchorX;
      } else { // 按次
        content = content.slice(0, 2) + '\n每次';
        markers[active_id].label.anchorX = active_time_anchorX;
      }
    } else if (content.length == 5) { // 双位数
      if (content.indexOf('H') > -1) { // 按小时
        content = content.slice(0, 3) + '\n每小时';
        markers[active_id].label.anchorX = active_hour_anchorX;
      } else { // 按次
        content = content.slice(0, 3) + '\n每次';
        markers[active_id].label.anchorX = active_time_anchorX;
      }
    }

    markers[active_id].label.content = content;

    this.setData({
      markers: markers,
      parkList: parkList
    })

    this.restructureParkingInfo(parkList[active_id]);

  },

  /**
   * 重构停车场信息数据结构
   */
  restructureParkingInfo: function(data) {
    // 判断是否有长租产品
    if (!data.longLeaseList.length) {
      data.hasLongLeaseProduct = false;
    } else {
      data.hasLongLeaseProduct = true;
    }
    // 判断是否有错峰产品
    if (!data.staggerList.length) {
      data.hasStaggerProduct = false;
    } else {
      data.hasStaggerProduct = true;
    }

    if (!data.hasLongLeaseProduct && !data.hasStaggerProduct) {
      var productTranslateY = productHeight;
      var hasProduct = false;
    } else {
      var productTranslateY = 0;
      var hasProduct = true;
    }

    // 导航信息
    let navInfo = {};
    navInfo.longitude = data.lon_lat.split(',')[0];
    navInfo.latitude = data.lon_lat.split(',')[1];
    navInfo.name = data.park_name;
    navInfo.address = data.addr;
    data.navInfo = navInfo;
    this.setData({
      parkingInfo: data
    })

    if (!this.data.isPlateOpacity) {
      // 如果是从车牌切换到停车场信息
      this.setData({
        plateTranslateY: this.data.plateInfoHeight,
        isPlateOpacity: true,
        productTranslateY: productTranslateY,
        hasProduct: hasProduct,
        isParkingOpacity: false
      })
    } else {
      // 如果是没有绑定手机号 或者 如果是停车场切换停车场
      if (this.data.hasProduct && !hasProduct) {
        this.setData({
          productTranslateY: productTranslateY,
          isParkingOpacity: false
        })
        setTimeout(res => {
          this.setData({
            hasProduct: hasProduct
          })
        }, 300)
      } else {
        this.setData({
          productTranslateY: productTranslateY,
          hasProduct: hasProduct,
          isParkingOpacity: false
        })
      }
    }
  },

  /**
   * 当前定位
   */
  bindLocation: function(){
    this.setData({
      state: 0,
      destinationValue: '你想停在哪里？',
      isDestination: false
    },() => {
      this.getCurrentPosition()
    })
  },

  /**
   * 点击地图
   */
  bindmaptap: function(e) {
    this.switchBottomBox()
  },

  /**
   * 导航
   */
  bindNavigate: function(e) {
    let navInfo = e.currentTarget.dataset.navInfo;
    navInfo.latitude = Number(navInfo.latitude);
    navInfo.longitude = Number(navInfo.longitude);
    wx.openLocation(navInfo);
  },

  /**
   * 前往搜索页
   */
  goToSearch: function() {
    wx.navigateTo({
      url: '../search/search',
    })
  },

  /**
   * marker 复位
   */
  resetAllMarkers: function(markers) {
    for (let i in markers) {
      if (markers[i].click) {
        markers[i].click = false;
        markers[i].iconPath = normal_icon_path;
        markers[i].width = normal_width;
        markers[i].height = normal_height;
        markers[i].label.color = normal_color;
        markers[i].label.fontSize = normal_font_size;
        markers[i].label.anchorY = normal_anchorY;
        let content = markers[i].label.content;
        if (content.indexOf('次') > -1) { // 按次
          if (content.length === 5) { //单位数
            content = content.slice(0, 2) + '/次';
            markers[i].label.anchorX = normal_one_time_anchorX;
          } else if (content.length === 6) { // 双位数
            content = content.slice(0, 3) + '/次';
            markers[i].label.anchorX = normal_two_time_anchorX;
          }
        } else { // 按小时
          if (content.length === 6) { //单位数
            content = content.slice(0, 2) + '/H';
            markers[i].label.anchorX = normal_one_hour_anchorX;
          } else if (content.length === 7) {
            content = content.slice(0, 3) + '/H';
            markers[i].label.anchorX = normal_two_hour_anchorX;
          }
        }
        markers[i].label.content = content;
        break;
      }
    }
    return markers;
  },

  /**
   * 点击停车场信息顶部切换 box
   * bindtap = 'switchBottomBox'
   */
  switchBottomBox: function() {
    let plateTranslateY = carListHeight
    let carListBox = this.data.carListBox
    if (!this.data.isParkingOpacity) { // 停车场信息显示
      let markers = this.data.markers;
      if (!markers || !markers.length) {
        return
      }
      markers = this.resetAllMarkers(markers);
      this.setData({
        markers,
        productTranslateY: parkInfoHeight,
        isParkingOpacity: true
      })
      if (this.data.needAddLicense) {
        return
      }
      if (carListBox) { // 表示是显示车牌列表的
        carListBox = false
      }
      this.setData({
        carListBox,
        plateTranslateY,
        isPlateOpacity: false
      })
    } else { // 停车场信息隐藏
      if (this.data.needAddLicense) {
        return
      }
      if (carListBox) {
        carListBox = false
      }
      if (!this.data.isPlateOpacity) { // 车牌信息显示
        this.setData({
          plateTranslateY
        }, () => {
          setTimeout(() => {
            this.setData({
              carListBox
            })
          }, 300)
        })
      } else {
        if (carListBox) {
          carListBox = false
        }
        console.log('车牌信息隐藏')
        this.setData({
          carListBox,
          plateTranslateY,
          isPlateOpacity: false
        })
      }
    }
  },

  /**
   * 添加车牌入口
   */
  addLicense: function() {
    wx.navigateTo({
      url: '../../common/addLicense/addLicense?page=home'
    })
  },

  /**
   * onHide
   */
  onHide: function() {
    let timer = this.data.timer;
    clearInterval(timer);
  },
})