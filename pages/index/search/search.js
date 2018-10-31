let globalData = getApp().globalData;
let utils = require('../../../utils/utils.js');

// let isiPhoneX = utils.isiPhoneX;

var QQMapWX = require('../../../libs/qqmap-wx-jssdk.min.js');
// 实例化API核心类
var demo = new QQMapWX({
  key: 'SDIBZ-DLIWJ-52RFK-FRMPQ-AV3C6-VYFQI' // 必填
});

let wechat = require('../../../utils/WeChat.js');

const HEARCH_HEIGHT = 62;
// pages/search/search.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    resetValue: false,
    searchValue: '',
    historyData: [],
    // historyId: [],
    historyModelShow: true,
    searchResults: [],//检索的结果
    locationAddress: '当前位置',
    searchResultHeight:0
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wechat.getLocation().then( res => {
      this.reverseGeocoder(res.latitude, res.longitude)
    })

    wechat.getSystemInfo().then(res => {
      let searchResultHeight = (res.screenHeight - HEARCH_HEIGHT) * 2;
      this.setData({
        searchResultHeight: searchResultHeight
      })
    })

  },
  onShow: function () {
    var historyData = (wx.getStorageSync('historyData') == '') ? [] : wx.getStorageSync('historyData');
    this.setData({
      historyData: historyData
    })
  },

  bindInput: function (e) {
    var clearBool = (e.detail.value == '') ? false : true;

    this.setData({
      resetValue: clearBool,
      historyModelShow: !clearBool
    })
    demo.getSuggestion({
      keyword: e.detail.value,
      region_fix: 1,
      success: (res) => {
        this._calculateDistance(res.data);
      }
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

  resetValue: function () {
    this.setData({
      searchValue: '',
      resetValue: false,
      historyModelShow: true
    })
    this._calculateDistance([]);
  },

  confirmInput: function (e) {
    if (e.detail.value == '') {
      this.setData({
        historyModelShow: true
      })
      this._calculateDistance([]);
    } else {
      demo.getSuggestion({
        keyword: e.detail.value,
        success: (res) => {
          if (!res.data.length) {
            wx.showToast({
              title: '搜索失败',
              image: '../../../resource/icon/cancle.png',
              duration: 1200
            })
            this.setData({
              historyModelShow: true
            })
          } else {
            this.setData({
              historyModelShow: false
            })
            this._calculateDistance(data);
          }
        }
      })
    }
  },

  /**
   * 计算距离
   * */
  _calculateDistance:function (data) {
    if (!data.length) {
      return;
    }
    let distanceArr = [];
    let toArr = [];
    for (let i in data) {
      let point = {
        location: data[i].location
      };
      toArr.push(point);
    }
    demo.calculateDistance({
      mode: 'driving',
      to: toArr,
      success: (res) => {
        if (res.status === 0) {
          let elements = res.result.elements;
          for (let j in elements) {
            let distance = '';
            if (elements[j].distance >= 1000) {
              distance = Number(elements[j].distance / 1000).toFixed(2) + 'km';
            } else {
              distance = elements[j].distance + 'm';
            }
            distanceArr.push(distance);
          }

          if (distanceArr.length >= elements.length) {
            this.handlePositions(data, distanceArr);
          }
        }
      }
    })
  },

  // 处理拿到的地点数组
  handlePositions: function (data, distanceArr) {
    let historyData = this.data.historyData;
    console.log(data)
    for (let i in data) {
      if (data[i].address == '') {
        data[i].address = data[i].title
      } else {
        data[i].address = data[i].address.replace(data[i].city + data[i].district, '')
      }

      if (!data[i].city || data[i].city == '') {
        data[i].city == ''
      } else{
        data[i].city += '-'
      }
      if (!data[i].district || data[i].district == '') {
        data[i].district = ''
      } else {
        data[i].district += '-'
      }

      data[i].address = data[i].city + data[i].district + data[i].address;
      data[i].distance = distanceArr[i];
      for (let j in historyData) {
        if (data[i].id == historyData[j].id) {
          data[i].isGone = true;
          break;
        }
      }
    }
    this.setData({
      searchResults: data
    })
  },
  // 取消搜索，返回首页

  bindSearchItem: function (e) {
    let item = e.currentTarget.dataset.item;
    let historyData = this.data.historyData;
    for (let i in historyData) {
      if (historyData[i].id === item.id) {
        historyData.splice(i,1);
        break;
      }
    }
    historyData.unshift(item);
    historyData.slice(0,10);
    wx.setStorageSync('historyData', historyData);
    this.setData({
      historyData: historyData,
      historyModelShow: true
    })

    let pages = getCurrentPages();//当前页面
    let prevPage = pages[pages.length - 2];//上一页面
    prevPage.setData({
      state: 1,
      destinationData: item,
      isDestination: true
    });
    wx.navigateBack();
  },

  bindHistoryItem: function (e) {
    var index = 0;
    var historyData = this.data.historyData;
    var historyDataItem = e.currentTarget.dataset.history;
    for (let i in historyData) {
      if (historyData[i].id === historyDataItem.id) {
        historyData.splice(i, 1);
        break;
      }
    }
    historyData.unshift(historyDataItem);
    wx.setStorageSync('historyData', historyData);
    this.setData({
      historyData: historyData
    })

    let pages = getCurrentPages();//当前页面
    let prevPage = pages[pages.length - 2];//上一页面
    prevPage.setData({
      state: 1,
      destinationData: historyDataItem,
      parkActive:true
    })
    wx.navigateBack();
  },

  /**
   * bindLocation 
   */
  bindLocation: function() {
    let pages = getCurrentPages();//当前页面
    let prevPage = pages[pages.length - 2];//上一页面
    prevPage.setData({
      state: 0,
      destinationValue: '你想停在哪里？',
      isDestination: false,
      parkActive:true
    })
    wx.navigateBack();
  },

})