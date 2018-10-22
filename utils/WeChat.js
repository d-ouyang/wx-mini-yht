let utils = require('./utils.js');
const showToast = utils.showToast;
const commonErrMsg = utils.commonErrMsg;
const ERROR_OK = 0;

Promise.prototype.finally = function (callback) {
  let P = this.constructor;
  return this.then(
    value => P.resolve(callback()).then(() => value),
    reason => P.resolve(callback()).then(() => { throw reason })
  );
};

class WeChat {
  // 监测有没有登录过期
  static checkSession() {
    return new Promise((resolve, reject) => wx.checkSession({
      success: resolve,
      fail: reject
    }))
  }

 // 登录获取 code
  static login() {
    return new Promise((resolve, reject) => {
      wx.login({ 
        success: resolve, 
        fail: reject 
      })
    })
  };

  static getUserInfo() {
    return new Promise((resolve, reject) => {
      wx.getUserInfo({
        withCredentials: false,
        success: resolve,
        fail: reject
      })
    })
  };

  static request(url, params) {
    return this.commonRequest(url, params,'POST', 'application/x-www-form-urlencoded');
  }

  static requestJson(url, params) {
    return this.commonRequest(url, params, 'POST', 'application/json');
  }

  static requestGet(url, params) {
     return this.commonRequest(url, params);
  }

  static requestLogin(url, params) {
    return new Promise((resolve, reject) => {
      let header = {
        "token": ''
      };
      header["content-type"] = 'application/x-www-form-urlencoded'
      let options = {
        url: url,
        method: 'POST',
        data: Object.assign({}, params),
        header: header,
        success: (res) => {
          if (res.data.code === ERROR_OK) {
            resolve(res.data.data);
          } else {
            if (res.data.code == '5001' || res.data.code == '5002' || res.data.code == '5003') {
              resolve(res.data.data);
            } else {
              showToast(commonErrMsg(res.data.code))
            }
          }
        },
        fail: reject
      }
      // console.log("请求的URL", options.url);
      wx.request(options);
    })
  }


  // 请求接口
  static commonRequest(url, params, method = 'GET', type) {
    return new Promise((resolve, reject) => {
      let loginInfo = wx.getStorageSync('loginInfo');
      let header = {
        "token": loginInfo && loginInfo.token ? loginInfo.token : ''
      };
      if (type) {
        header["content-type"] = type
      }
      let options = {
        url: url,
        method: method,
        data: Object.assign({}, params),
        header: header,
        success: (res) => {
          if (res.data.code === ERROR_OK) {
            resolve(res.data.data);
          } else {
            if (res.data.code == '5001' || res.data.code == '5002' || res.data.code == '5003') {
              resolve(res.data.data);
            } else {
              showToast(commonErrMsg(res.data.code))
            }
          }
        },
        fail: reject
      }
      console.log("请求的URL", options.url);
      wx.request(options);
    })
  }

  // 设置本地存储
  static setStorage(key, value) {
    return new Promise((resolve, reject) => {
      wx.setStorage({
        key: key,
        data: value,
        success: resolve,
        fail: reject
      });
    })
  }

  // 获取本地存储
  static getStorage(key) {
    return new Promise((resolve, reject) => {
      wx.getStorage({
        key: key,
        success: (res) => {
          resolve(res.data)
        },
        fail: error => {
          reject(error)
        }
      });
    })
  }

  // 获取设备信息
  static getSystemInfo() {
    return new Promise((resolve, reject) => {
      wx.getSystemInfo({
        success: resolve,
        fail: reject 
      })
    })
  }

  // 获取授权列表
  static getSetting() {
    return new Promise((resolve, reject) => {
      wx.getSetting({
        success: resolve,
        fail:reject
      })
    })
  }

  // 确认授权与否
  static authorize(o) {
    return new Promise((resolve, reject) => {
      wx.authorize({
        scope: o,
        success: resolve,
        fail: reject
      })
    })
  }

  // 获取当前地理位置
  static getLocation() {
    return new Promise((resolve, reject) => {
      let options = {
        type: 'gcj02',
        success: resolve,
        fail: reject
      }
      wx.getLocation(options)
    })
  }

  //拉起支付
  static wxPay(d) {
    return new Promise((resolve, reject) => {
      wx.requestPayment(Object.assign({}, d, {success: resolve, fail: reject}))
    })
  }

  // 显示模态框
  static showModal(content) {
    return new Promise((resolve, reject) => {
      let options = {
        title: '提示',
        content: content,
        showCancel:true,
        confirmColor: '#2657EB',
        success: resolve,
        fail: reject
      }
      wx.showModal(options)
    })
  }
}
module.exports = WeChat