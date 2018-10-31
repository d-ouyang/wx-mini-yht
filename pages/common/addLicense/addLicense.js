let globalData = getApp().globalData;

const ERROR_OK = globalData.ERROR_OK;
const BASE_URL = globalData.requestBaseUrl;

let utils = require('../../../utils/utils.js');
let showToast = utils.showToast;
// let requestPost = utils.requestPost;
let isiPhoneX = utils.isiPhoneX;
let objIsNull = utils.objIsNull;

// 绑定车牌
const carAddUrl = BASE_URL + '/car/add';

const local_data = require('../../../data/data.js');
const province_data = local_data.province_data;
const plate_number = local_data.plate_number;
const plate_letter = local_data.plate_letter;

var plate_arr = ['沪', '', '', '', '', '', '', ''];

let wechat = require('../../../utils/WeChat.js')

// pages/addLicense/addLicense.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    province_data: province_data,
    plate_number: plate_number,
    plate_letter: plate_letter,
    province_show: false,
    plate_show: true,
    plate_bottom: false,
    current_index: 1,
    plate_arr: plate_arr,
    is_new_energy: false,
    last_page:'',
    logining: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    if (!objIsNull(options)) {
      let last_page = options.page;
      this.setData({
        last_page: 'home'
      })
    } else {
      this.setData({
        last_page: ''
      })
    }
    
    let systemInfo = globalData.systemInfo;
    this.setData({
      isiPhoneX: isiPhoneX(systemInfo)
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.judgePhone();
  },
  
  /**
   * 判断是否有手机号
   */
  judgePhone: function() {
    wechat.getStorage('loginInfo').then(res => {
      console.log(res)
      if (res.hasPhone) {
        this.setData({
          logining: false
        })
      } else {
        this.setData({
          logining: true
        })
      }
    })
  },

  /**
   * 触发选择省份的键盘
   */
  selectProvince: function(){
    this.setData({
      province_show: true,
      plate_show: false
    })
  },

  /**
   * 触发车牌号键盘
   */
  selectPlate: function(){
    var plate_bottom = this.data.plate_bottom;
    if (!plate_bottom) {
      return;
    }
    this.setData({
      plate_bottom: false
    })
  },

  /**
   * 切换省份
   */
  bindProvinceItem: function(e){
    var current_index = this.data.current_index;
    var plate_arr = this.data.plate_arr;
    var the_province_index = e.currentTarget.dataset.index;
    var current_province_value = province_data[the_province_index];
    plate_arr[0] = current_province_value;
    if (current_index <= 1) {
      current_index = 1;
    }
    this.setData({
      plate_arr: plate_arr,
      current_index: current_index,
      province_show: false,
      plate_show: true,
      plate_bottom: false
    })
  },

  /**
   * 切换省份键盘
   */
  provinceKeyboardReturn: function(){
    var current_index = this.data.current_index;
    var plate_bottom = this.data.plate_bottom;
    if (!current_index) {
      current_index++;
    } 
    if (plate_bottom) {
      this.setData({
        plate_bottom: false
      })
    }
    this.setData({
      province_show: false,
      plate_show: true,
      current_index: current_index
    })
  },

  /**
   * 输入数字
   */
  bindPlateNumberItem: function(e){
    var current_index = this.data.current_index;
    console.log(current_index);
    var plate_arr = this.data.plate_arr;
    var the_plate_number_index = e.currentTarget.dataset.index;
    var the_plate_number_value = plate_number[the_plate_number_index];
    plate_arr[current_index] = the_plate_number_value;
    current_index = this._judgeIsLast(current_index);
    this.setData({
      plate_arr: plate_arr,
      current_index: current_index
    })
  },

  /**
   * 输入字母
   */
  bindPlateLetterItem: function(e){
    var current_index = this.data.current_index;
    var plate_arr = this.data.plate_arr;
    var the_plate_letter_index = e.currentTarget.dataset.index;
    var the_plate_letter_value = plate_letter[the_plate_letter_index];
    if (the_plate_letter_index == 7 || the_plate_letter_index == 8) {
      return;
    }
    plate_arr[current_index] = the_plate_letter_value;
    current_index = this._judgeIsLast(current_index);
    this.setData({
      plate_arr: plate_arr,
      current_index: current_index
    })
  },

  /**
   * 删除车牌号
   */
  bindPlateDelete: function(){
    var current_index = this.data.current_index;
    var plate_arr = this.data.plate_arr;
    if (current_index > 1) {
      if (plate_arr[current_index] == '') {
        current_index--;
      }
      plate_arr[current_index] = '';
    } else if (current_index <= 1){
      if (plate_arr[current_index] == '') {
        this.setData({
          plate_show: false,
          province_show: true
        })
      } else {
        plate_arr[current_index] = '';
      }
    }
    this.setData({
      current_index: current_index,
      plate_arr: plate_arr,
      is_new_energy: false
    })
  },

  /**
   * 收起车牌号键盘
   */
  takeUpPlateKeyboard: function(){
    this.setData({
      plate_bottom: true
    })
  },

  /**
   * 点击完成
   */
  bindCpmplete: function(){
    var last_page = this.data.last_page;
    var plate_arr = this.data.plate_arr;
    var plate_str = plate_arr.join('');
    let length = plate_str.length;
    let is_newEnergyVehicle = '0';//默认不是
    if (length < 7 ) {
      showToast('请填写完整车牌');
    } else {
      if (length === 7) {
        is_newEnergyVehicle = '0';
      } else if (length === 8) {
        is_newEnergyVehicle = '1';
      }
      wechat.request(carAddUrl, { car_type: '0', car_number: plate_str, is_newEnergyVehicle: is_newEnergyVehicle})
        .then(res => {
          if (last_page == 'home') {
            wx.switchTab({
              url: '/pages/index/index/index'
            })
          } else {
            wx.navigateBack()
          }
        })
    }
  },

  /**
   * 判断是哦否是最后一位
   */
  _judgeIsLast:function(index){
    if (index == plate_arr.length - 1) {
      index = plate_arr.length - 1;
      this.setData({
        is_new_energy: true
      })
    } else {
      index++;
      is_new_energy: false
    }
    return index;
  },

  onHideLogin: function(e){
    let hasPhone = e.detail.hasPhone;
    const last_page = this.data.last_page;
    this.setData({
      logining: false
    },() => {
      if (hasPhone) {
        return;
      } else {
        if (last_page == 'home') {
          wx.switchTab({
            url: '/pages/index/index/index'
          })
        } else {
          wx.navigateBack()
        }
      }
    })
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  
  }
})