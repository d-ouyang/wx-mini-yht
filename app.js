App({
  onLaunch: function (options) {
    // 获取设备信息
    try {
      let res = wx.getSystemInfoSync();
      this.globalData.systemInfo = res;
    } catch (e) {
      showToast('获取设备信息失败');
    }

    wx.getNetworkType({
      success: (res) => {
        let networkType = res.networkType;
        this.globalData.networkType = networkType;
      },
    })

    wx.onNetworkStatusChange( (res) => {
      this.globalData.isConnected = res.isConnected;
      this.globalData.networkType = res.networkType;
    })
  },

  globalData: {
    // requestBaseUrl: 'http://139.196.102.32:8080',
    requestBaseUrl: 'https://2c.product.phtonspark.com',
    ERROR_OK: 0
  }
})