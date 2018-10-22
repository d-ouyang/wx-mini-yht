let app = getApp();
let globalData = app.globalData;

const ERROR_OK = globalData.ERROR_OK;
const BASE_URL = globalData.requestBaseUrl;

// 行程接口
const tripUrl = BASE_URL + '/park/listParkRecord';

let utils = require('../../../utils/utils.js');
let showToast = utils.showToast;
let handleCarPlate = utils.handleCarPlate;
let objIsNull = utils.objIsNull;

let wechat = require('../../../utils/WeChat.js');

let noData = {
  image: '/resource/image/trip.png',
  desc: '暂无行程记录'
}

const pageRowNo = 15;
// const trips = new Array(10)
Page({

  /**
   * 页面的初始数据
   */
  data: {
    trips: [],
    noData: noData,
    pageNo: 1,
    noMore: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    utils.loading();
    let pageNo = this.data.pageNo;
    wechat.request(tripUrl, {
      pageNo: pageNo,
      pageRowNo: pageRowNo
    })
    .then(res => {
      wx.hideLoading();
      if (pageNo < this.returnTotalRow(res.total, pageRowNo)) {
        this.setData({
          noMore: false
        })
      } else {
        this.setData({
          noMore: true
        })
      }
      this.handleTripList(res)
    })
    .catch(res => {
      wx.hideLoading();
    })
  },

  /**
   * totalRow
   */
  returnTotalRow: function (total, pageRowNo){
    let theInt = parseInt(total / pageRowNo);
    if (total % pageRowNo) {
      theInt++
    }
    return theInt
  },

  /**
   * 处理行程订单
   */
  handleTripList: function(data){
    let list = data.dataList;
    if (!list.length) {
      this.setData({
        trips:[]
      })
    } else {
      for (let i in list){
        list[i].carNumber = utils.handleCarPlate(list[i].car_number)
        let in_time_y = list[i].in_time.split(' ')[0];
        in_time_y = in_time_y.split('-')[0] + '年' + in_time_y.split('-')[1] + '月' + in_time_y.split('-')[2] + '日'
        list[i].in_time_y = in_time_y;
        list[i].in_time_d = list[i].in_time.split(' ')[1];
        let out_time_y = list[i].out_time.split(' ')[0];
        out_time_y = out_time_y.split('-')[0] + '年' + out_time_y.split('-')[1] + '月' + out_time_y.split('-')[2] + '日'
        list[i].out_time_y = out_time_y;
        list[i].out_time_d = list[i].out_time.split(' ')[1];
        list[i].amount_real = 0;
        for (let j in list[i].orderList) {
          list[i].amount_real += Number(list[i].orderList[j].amount_real)
        }
        list[i].amount_real = list[i].amount_real.toFixed(2);
      }
      list = this.data.trips.concat(list);
      this.setData({
        trips: list
      })
    }
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    let pageNo = this.data.pageNo;
    pageNo++;
    this.setData({
      pageNo: pageNo
    })
    let noMore = this.data.noMore;
    if (noMore) {
      return
    } else {
      utils.loading();
      wechat.request(tripUrl, {
        pageNo: pageNo,
        pageRowNo: pageRowNo
      })
        .then(res => {
          wx.hideLoading();
          if (pageNo < this.returnTotalRow(res.total, pageRowNo)) {
            this.setData({
              noMore: false
            })
          } else {
            this.setData({
              noMore: true
            })
          }
          this.handleTripList(res)
        })
        .catch(res => {
          wx.hideLoading();
        })
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  
  }
})