const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}
// 提示框
const showToast = (title, duration) => {
  var defaultDuration = 1500;
  wx.showToast({
    title: title,
    icon: 'none',
    duration: duration || defaultDuration
  })
}

const commonErrMsg = (errCode) => {
  let errMsg = '';
  switch (errCode) {
    case 1:
      errMsg = '数据校验失败';
      break;
    case 2:
      errMsg = '非法访问';
      break;
    case 3:
      errMsg = '其他错误';
      break;
    case 1000:
      errMsg = '请求接口失败';
      break;
    case 1001:
      errMsg = '接口异常';
      break;
    case 2000:
      errMsg = '参数校验失败';
      break;
    case 2001:
      errMsg = '必选参数不能为空';
      break;
    case 2002:
      errMsg = '参数格式错误';
      break;
    case 2003:
      errMsg = '不相等';
      break;
    case 2004:
      errMsg = '超出有效期';
      break;
    case 3001:
      errMsg = '获取信息失败';
      break;
    case 3002:
      errMsg = '获取信息不存在';
      break;
    case 3101:
      errMsg = '获取信息失败';
      break;
    case 3102:
      errMsg = '获取返回码失败';
      break;
    case 4000:
      errMsg = '身份认证失败';
      break;
    case 4001:
      errMsg = '身份认证失败';
      break;
    case 4002:
      errMsg = '获取用户信息失败';
      break;
    case 4003:
      errMsg = '已和其他账号绑定，不能更换手机号';
      break;
  }
  return errMsg;
}

const isiPhoneX = (data) => {
  return (data.model === 'iPhone X') ? true : false;
}

const drawCircleBg = (id, option) => {
  let ctx = wx.createCanvasContext(id);
  ctx.setStrokeStyle(option.color);
  ctx.setLineWidth(option.width);
  ctx.setLineCap('round');
  ctx.arc(option.x, option.x, option.x - option.width / 2, 0, 2 * Math.PI, false);
  ctx.stroke();
  ctx.draw();
}

const drawCircle = (id, option) => {
  let ctx = wx.createCanvasContext(id);
  ctx.setStrokeStyle(option.color);
  ctx.setLineWidth(option.width);
  ctx.setLineCap('round');
  ctx.arc(option.x, option.x, option.x - option.width / 2, -Math.PI / 2, (option.step * 2 - 1/2) * Math.PI, false);
  ctx.stroke();
  ctx.draw();
}

const loading = (title) => {
  title = (title == undefined) ? '加载中...' : title
  wx.showLoading({
    title: title,
  })
}

const handleCarPlate = (p) => {
  let charAt = p.charAt(1);
  return p = p.replace(charAt, charAt + '·')
}

// 判断空对象
const objIsNull = o => {
  let arr = Object.keys(o)
  if (arr.length) {
    return false;
  }
  return true;
}

// 处理停车时长
const handleParkTime = t => {
  let d, h, m;
  d = Math.floor(t / (60 * 24));
  h = Math.floor(t / 60 - 24 * d);
  m = Math.floor(t - 60 * h - 24 * 60 * d);

  if (d >= 1) {
    return `${d}天${h}小时${m}分钟`
  } else {
    return `${h}小时${m}分钟`
  }
}

module.exports = {
  formatTime: formatTime,
  formatNumber: formatNumber,
  showToast: showToast,
  isiPhoneX: isiPhoneX,
  drawCircleBg: drawCircleBg,
  drawCircle: drawCircle,
  loading: loading,
  commonErrMsg: commonErrMsg,
  handleCarPlate: handleCarPlate,
  objIsNull: objIsNull,
  handleParkTime: handleParkTime
}
