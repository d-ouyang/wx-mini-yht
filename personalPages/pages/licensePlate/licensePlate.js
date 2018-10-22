let app = getApp();
let globalData = app.globalData;

const ERROR_OK = globalData.ERROR_OK;
const BASE_URL = globalData.requestBaseUrl;

// 查询车牌列表
const carlistUrl = BASE_URL + '/car/list';
// 删除车牌
const deletePlateUrl = BASE_URL + '/car/delete';
// 设置默认车牌
const setDefaultUrl = BASE_URL + '/car/default';

let utils = require('../../../utils/utils.js');
let showToast = utils.showToast;
let handleCarPlate = utils.handleCarPlate;
let objIsNull = utils.objIsNull;

let wechat = require('../../../utils/WeChat.js');

let noData = {
  image: '/resource/image/carPlate.png',
  desc: '暂无绑定车牌'
}

let initLicensePlates = new Array(3)

Page({

  /**
   * 页面的初始数据
   */
  data: {
    licensePlates: initLicensePlates,
    hasLeftStatue: false,
    noData: noData,
    hasCarPlates: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    
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
    wechat.getStorage('loginInfo')
      .then(res => {
        utils.loading();
        return wechat.request(carlistUrl)
      })
      .then(res => {
        this.handlePlatesData(res.dataList);
      })
  },

  /**
   * 处理车牌数据
   */
  handlePlatesData: function(list){
    // let licensePlates = [];
    if (list.length) {
      for (let i in list) {
        if (list[i].default_flag == '1') {
          list[i].isChecked = true
        } else {
          list[i].isChecked = false
        }
        list[i].leftAnimation = false;
        list[i].value = handleCarPlate(list[i].car_number);
      }

      this.setData({
        licensePlates: list,
        hasCarPlates: true
      })
    } else {
      this.setData({
        licensePlates: [],
        hasCarPlates: false
      })
    }
    wx.hideLoading();
  },

  /**
   * 左滑删除
   * bindStartPoint
   */
  bindStartPoint: function (e) {
    const startX = e.changedTouches[0].clientX;
    const startY = e.changedTouches[0].clientY;
    this.setData({
      startX: startX,
      startY: startY
    })
  },

  bindEndPoint: function(e){
    let licensePlates = this.data.licensePlates;
    let currentIndex = e.currentTarget.dataset.index;
    let hasLeftStatue = this.data.hasLeftStatue;
    const startX = this.data.startX;
    const startY = this.data.startY;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const angle = this._calculateAngle({ X: startX, Y: startY }, { X: endX, Y: endY });
    if (endX < startX) { // 左滑
      if (licensePlates[currentIndex].leftAnimation) return;

      if (Math.abs(angle) > 30) return;

      licensePlates = this._changeLeftAnimation(licensePlates);

      licensePlates[currentIndex].leftAnimation = true;
      
      hasLeftStatue = true;

      this.setData({
        licensePlates: licensePlates,
        hasLeftStatue: hasLeftStatue
      })
    } else { // 右滑 或 点击
      if (endX === startX && startY === endY) { // 点击
        if (!hasLeftStatue) { // 如果没有左滑状态
          if (!licensePlates[currentIndex].isChecked) { // 点的不是默认车牌
            // 设置默认车牌
            let carNumber = licensePlates[currentIndex].value;
            wechat.showModal(`确认将 ${carNumber} 设置为默认车牌`)
              .then( res => {
                if (res.confirm) {
                  return true;
                }
                if (res.cancel) {
                  return false;
                }
              }, res => {
                return false
              })
              .then( res => {
                if (res) {
                  utils.loading('正在设置...');
                  return wechat.request(setDefaultUrl, { 
                    car_type: licensePlates[currentIndex].car_type,
                    car_number: licensePlates[currentIndex].car_number
                  })
                }
              })
              .then( res => {
                wx.hideLoading();
                if (res.flg == '0') {
                  for (let i in licensePlates) {
                    if (licensePlates[i].isChecked) {
                      licensePlates[i].isChecked = false;
                      break;
                    }
                  }
                  licensePlates[currentIndex].isChecked = true;
                  licensePlates = this._changeLeftAnimation(licensePlates);
                  hasLeftStatue = false;
                  this.setData({
                    licensePlates: licensePlates,
                    hasLeftStatue: hasLeftStatue
                  })
                  showToast('设置成功')
                } else {
                  showToast('设置失败')
                }
              })
              .catch( res => {
                showToast('设置失败')
                return false;
              })
          }
        } else {
          for (let i in licensePlates) {
            if (licensePlates[i].leftAnimation) {
              licensePlates[i].leftAnimation = false;
              break;
            }
          }
          this.setData({
            hasLeftStatue: false,
            licensePlates: licensePlates
          })
          return;
        }
      } else {
        for (let i in licensePlates) {
          if (licensePlates[i].leftAnimation) {
            licensePlates[i].leftAnimation = false;
            break;
          }
        }
        this.setData({
          hasLeftStatue: false,
          licensePlates: licensePlates
        })
        return;
      }
    }
  },

  /**
   * 计算角度
   * @param Object start:{}
   * @param Object end:{}
   */
  _calculateAngle: function (start, end) {
    const _X = end.X - start.X;
    const _Y = end.Y - start.Y;
    return 360 * Math.atan(_Y / _X) / (2 * Math.PI);
  },

  /**
   * 重置删除状态均为 false
   */
  _changeLeftAnimation: function (arr) {
    for (let i in arr) {
      if (arr[i].leftAnimation) {
        arr[i].leftAnimation = false;
        break;
      }
    }
    return arr;
  },

  /**
   * 删除
   */
  bindDelete:function(e){
    let licensePlates = this.data.licensePlates;
    const currentIndex = e.currentTarget.dataset.index;
    let checkedPlate = licensePlates[currentIndex];
    const carNumber = checkedPlate.car_number;

    utils.loading('正在删除...')
    wechat.request(deletePlateUrl, {
      car_type: '0',
      car_number: carNumber
    })
    .then( res => {
      wx.hideLoading();
      if (res.flg == '0') {
        licensePlates.splice(currentIndex, 1);
        if (checkedPlate.isChecked) { // 删除的是默认车牌
          if (licensePlates.length) {
            wechat.request(setDefaultUrl,{
              car_type: licensePlates[0].car_type,
              car_number: licensePlates[0].car_number
            })
            .then( res => {
              licensePlates[0].isChecked = true;
              this.setData({
                licensePlates: licensePlates
              })
              showToast('删除成功')
            })
          } else {
            this.setData({
              licensePlates: licensePlates,
              hasCarPlates: false
            })
            showToast('删除成功')
          }
        } else {
          this.setData({
            licensePlates: licensePlates
          })
          showToast('删除成功')
        }
        wechat.setStorage('onStatusChange', {
          status: true,
          carNumber: carNumber
        })
      } else {
        showToast('删除失败')
      }
    })
    .catch( res => {
      showToast('删除失败')
      return false
    })
  },

  /**
   * 添加车牌
   */
  addLicense: function(){
    wx.navigateTo({
      url: '/pages/common/addLicense/addLicense',
    })
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
  
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
  
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
  
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  
  }
})