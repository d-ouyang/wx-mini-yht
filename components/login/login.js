let app = getApp();
let globalData = app.globalData;

const ERROR_OK = globalData.ERROR_OK;
const BASE_URL = globalData.requestBaseUrl;

// 获取手机号
const getPhoneUrl = BASE_URL + '/auth/getPhone';

let wechat = require('../../utils/WeChat.js');

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    logining: Boolean
  },

  /**
   * 组件的初始数据
   */
  data: {
    
  },
  attached: function(){
    
  },

  /**
   * 组件的方法列表
   */
  methods: {
    cancleLogin: function(){
      console.log('cancle')
      this.triggerEvent('hideLogin', {hasPhone:false}, {})
    },
    getphonenumber: function(e){
      if (e.detail.encryptedData) {
        const encryptedData = e.detail.encryptedData;
        const iv = e.detail.iv;
        wechat.request(getPhoneUrl, {
          encryptedData: encryptedData,
          iv: iv
        }).then(res => {
          wechat.getStorage('loginInfo').then( data => {
            if (res.newToken) {
              data.token = res.newToken;
            }
            data.hasPhone = true;
            return wechat.setStorage('loginInfo', data)
          }).then(() => {
            this.triggerEvent('hideLogin', { hasPhone: true }, {})
          })
        })
      }
    }
  }
})
