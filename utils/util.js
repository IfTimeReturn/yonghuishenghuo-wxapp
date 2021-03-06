const ak = 'zcbTavuSRgQKQB9GyqZZRGYOoBht2RAP' //百度地图api-ak
const key = '27IBZ-YFMRI-B53G2-5UKP6-VDKPK-3BFUK' //腾讯地图api-key
const mta = require('./mta_analysis.js')
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

const formatPrice = (value) => {
  return parseFloat(isNaN(value) ? 0 : value).toFixed(2)
}
// 获得位置授权
const getUserLocation = () => {
  return new Promise(function(resolve, reject) {
    wx.getSetting({
        success: res => {
          resolve(res.authSetting['scope.userLocation'] ? true : false)
        }
    })
  })
}
// 获得地址
const getLocation = () => {
  return new Promise(function(resolve, reject) {
    wx.showLoading({
      title: '定位中...',
    })
    let that = this
    wx.getLocation({
      type: 'gcj02',
      success: function(res) {
        mta.Event.stat("1002", {})
        let latitude = res.latitude
        let longitude = res.longitude
        console.log(res)
        wx.request({
          url: `http://apis.map.qq.com/ws/geocoder/v1/?key=${key}&location=${latitude},${longitude}&output=json`,
          // url: `https://api.map.baidu.com/geocoder/v2/?ak=${ak}&location=${latitude},${longitude}&output=json`,
          success: (res) => {
            console.log(res)
            // let address = res.data.result.addressComponent
            // let data = address.district + address.street + address.street_number;
            let data = res.data.result.formatted_addresses.recommend
            wx.hideLoading()
            getApp().globalData.address = data
            resolve(data)
          },
          fail: (res) => {
            wx.hideLoading()
            console.log(res)
          }
        })
      },
      fail: function(res) {
        console.log(res)
        mta.Event.stat("1003", {})
        wx.hideLoading()
        reject(res)
      }
    })
  })
}
// 添加购物车
const addCart = (item, fn) => {
  let cart = wx.getStorageSync('cart') ? wx.getStorageSync('cart') : []
  let seller_id = []
  cart instanceof Array && cart.forEach((item) => {
    seller_id.push(item.seller.id)
  })
  let index = seller_id.indexOf(item.seller.id)
  if (index === -1) {
    let list = []
    list.push(item.goods)
    cart.push({
      seller: item.seller,
      list,
      total: 1,
      totalMoney: item.goods.price,
      check: true
    })
  } else {
    cart[index].total++
      let cart_list = cart[index].list
    let flag = []
    cart_list instanceof Array && cart_list.forEach((item) => {
      flag.push(item.id)
    })
    if (flag.indexOf(item.goods.id) === -1) {
      cart[index].list.push(item.goods)
    } else {
      cart[index].list[flag.indexOf(item.goods.id)].num++
    }
  }
  // console.log(item, cart)
  wx.setStorage({
    key: 'cart',
    data: cart,
    success: () => {
      let {id, name, price} = item.goods
      mta.Event.stat("2001", {})
      wx.reportAnalytics('add_to_cart', {
        goods_id: id,
        goods_name: name,
        goods_price: price
      })
      fn && fn()
    }
  })
}
// getCartNum
const getCartNum = () => {
  let cart = wx.getStorageSync('cart') ? wx.getStorageSync('cart') : []
  let num = 0
  cart.forEach((item) => {
    item.list && item.list.forEach(goods => {
      num += goods.num
    })
  })
  return num
}
// 设置购物车小红点
const setBadge = () => {
  let num = getCartNum()
  if (num > 0) {
    wx.setTabBarBadge({
      index: 2,
      text: `${num}` // num转换string
    })
  } else {
    wx.removeTabBarBadge({
      index: 2
    })
  }
}
// 判断对象是否相同
const diff = (obj1, obj2) => {
  return JSON.stringify(obj1) === JSON.stringify(obj2)
}
// 判断是否用户授权
const hasUserInfo = () => {
  wx.getSetting({
    success: res => {
      if (!res.authSetting['scope.userInfo']) {
        wx.setStorageSync('prePage', `/${getCurrentPages()[0].route}`)
        wx.reLaunch({
          url: '/pages/wxLogin/wxLogin',
        })
      }
    }
  })
}
module.exports = {
  formatTime,
  formatPrice,
  getUserLocation,
  getLocation,
  addCart,
  setBadge,
  diff,
  hasUserInfo,
  getCartNum
}