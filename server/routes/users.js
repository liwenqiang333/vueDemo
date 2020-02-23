var express = require('express');
var router = express.Router();
var User = require('../models/user');
/* GET users listing. */
router.get('/', function (req, res, next) {
  res.send('这是users的页面');
});
router.post('/login', function (req, res, next) {
  var param = {
    userName: req.body.userName,
    userPwd: req.body.userPwd
  }
  User.findOne(param, function (err, doc) {
    if (err) {
      res.json({
        status: '1',
        msg: err.message
      });
    } else {
      if (doc) {
        res.cookie('userId', doc.userId, {
          path: '/',
          maxAge: 1000 * 60 * 60
        })
        // req.session.user = doc;
        res.json({
          status: '0',
          msg: '',
          result: {
            userName: doc.userName
          }
        })
      }
    }
  })
})
// 登出接口
router.post('/logout', function (req, res, next) {
  res.cookie('userId', '', {
    path: '/',
    maxAge: -1
  })
  res.json({
    status: '0',
    msg: '',
    result: ''
  })
})

router.get('/cartList', function (req, res, next) {
  var userId = req.cookies.userId;
  User.findOne({
    userId: userId
  }, function (err, doc) {
    if (err) {
      res.json({
        status: '1',
        msg: err.message,
        result: ''
      })
    } else {
      if (doc) {
        doc.cartList;
        res.json({
          status: '0',
          msg: '',
          result: doc.cartList
        })
      }
    }
  })
})
// 购物车删除
router.post('/cartDel', function (req, res, next) {
  var userId = req.cookies.userId,
    productId = req.body.productId;
  User.update({
    userId: userId
  }, {
    $pull: {
      'cartList': {
        'productId': productId
      }
    }
  }, function (err, doc) {
    if (err) {
      res.json({
        status: '1',
        msg: err.message,
      })
    } else {
      res.json({
        status: '0',
        msg: '',
        result: 'suc'
      })
    }
  });
})

router.post('/cartEdit', function (req, res, next) {
  var userId = req.cookies.userId,
    productId = req.body.productId,
    productNum = req.body.productNum;
  checked = req.body.checked;
  User.update({
    'userId': userId,
    'cartList.productId': productId
  }, {
    'cartList.$.productNum': productNum, //更新子文档
    'cartList.$.checked': checked
  }, function (err, doc) {
    if (err) {
      res.json({
        status: '1',
        msg: err.message,
        result: ''
      })
    } else {
      res.json({
        status: '0',
        msg: '',
        result: 'suc'
      })
    }
  })
})

// 查询地址列表
router.get('/addressList', function (req, res, next) {
  var userId = req.cookies.userId;
  User.findOne({
    userId: userId
  }, function (err, doc) {
    if (err) {
      res.json({
        status: '1',
        msg: err.message,
        result: ''
      });
    } else {
      if (doc) {
        doc.addressList
        res.json({
          status: '0',
          msg: '',
          result: doc.addressList
        });
      }

    }
  })
});
// 设置默认地址接口
router.post('/setDefault', function (req, res, next) {
  var userId = req.cookies.userId,
    addressId = req.body.addressId;
  if (!addressId) {
    res.json({
      status: '1003',
      msg: 'addressId is null',
      result: ''
    });
  } else {
    User.findOne({
      userId: userId
    }, function (err, doc) {
      if (err) {
        res.json({
          status: '1',
          msg: err.message,
          result: ''
        });
      } else {
        var addressList = doc.addressList;
        addressList.forEach((item) => {
          if (item.addressId == addressId) {
            item.isDefault = true;
          } else {
            item.isDefault = false;
          }
        });
        doc.save(function (err1, doc1) {
          if (err1) {
            res.json({
              status: '1',
              msg: err.message,
              result: ''
            });
          } else {
            res.json({
              status: '0',
              msg: '',
              result: ''
            })
          }
        })
      }
    })
  }
})
// 地址删除
router.post('/delAddress', function (req, res, next) {
  var userId = req.cookies.userId,
    addressId = req.body.addressId;
  User.update({
    userId: userId
  }, {
    $pull: {
      'addressList': {
        'addressId': addressId
      }
    }
  }, function (err, doc) {
    if (err) {
      res.json({
        status: '1',
        msg: err.message,
        result: ''
      })
    } else {
      res.json({
        status: '0',
        msg: '',
        result: ''
      })
    }
  });
})
router.post('/payMent', function (req, res, next) {
  var userId = req.cookies.userId,
    addressId = req.body.addressId;
  orderTotal = req.body.orderTotal;
  User.findOne({
    userId: userId
  }, function (err, doc) {
    if (err) {
      res.json({
        status: '1',
        msg: err.message,
        result: ''
      });
    } else {
      var address = '',
        goodsList = [];
      // 获取当前用户的地址信息
      doc.addressList.forEach((item) => {
        if (addressId == item.addressId) {
          address = item;
        }
      })
      // 获取用户购物车的购买商品
      doc.cartList.filter((item) => {
        if (item.checked == '1') {
          goodsList.push(item);
        }
      });
      var platform = '622';
      var r1 = Math.floor(Math.random() * 10);
      var orderId = platform + r1;
      var order = {
        orderId: orderId,
        orderTotal: orderTotal,
        addressInfo: address,
        goodsList: goodsList,
        orderStatus: '1',
      };
      doc.orderList.push(order);
      doc.save(function (err1, doc1) {
        if (err1) {
          res.json({
            status: '1',
            msg: err.message,
            result: ''
          });
        } else {
          res.json({
            status: '0',
            msg: '',
            result: {
              orderId: order.orderId,
              orderTotal: order.orderTotal
            }
          });
        }
      })
    }
  })
});
//  根据订单ID查询订单信息
router.get('/orderDetail', function (req, res, next) {
  var userId = req.cookies.userId,
    orderId = req.param('orderId');
  User.findOne({
    userId: userId
  }, function (err, userInfo) {
    if (err) {
      res.json({
        status: '1',
        msg: err.message,
        result: ''
      })
    } else {
      var orderList = userInfo.orderList;
      if (orderList.length > 0) {
        var orderTotal = 0;
        orderList.forEach((item) => {
          if (item.orderId == orderId) {
            orderTotal = item.orderTotal;
          }
        });
        if (orderTotal > 0) {
          res.json({
            status: '0',
            msg: '',
            result: {
              orderId: orderId,
              orderTotal: orderTotal
            }
          })
        } else {
          res.json({
            status: '120002',
            msg: '无此订单',
            result: ''
          })
        }
      } else {
        res.json({
          status: '120001',
          msg: '当前用户未创建订单',
          result: ''
        })
      }
    }
  })
});
router.get('/getCartCount', function (req, res, next) {
  if (req.cookies && req.cookies.userId) {
    var userId = req.cookies.userId;
    User.findOne({userId:userId},function (err,doc) {
      if (err) {
        res.json({
          status: '1',
          msg: err.message,
          result: ''
        });
      } else {
        var cartList = doc.cartList;
        let cartCount = 0;
        cartList.map(function (item) {
          cartCount += parseInt(item.productNum);
        });
        res.json({
          status: '0',
          msg: '',
          result: cartCount
        })
      }
    })
  }
});
module.exports = router;
