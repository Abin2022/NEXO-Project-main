const { Reject } = require("twilio/lib/twiml/VoiceResponse");
const Cart = require("../models/cartModel");
const Order = require("../models/orderModel");
const Address = require("../models/addressesModel");
const userHelpers = require('../helpers/userHelpers')


const Razorpay = require("razorpay");
var instance = new Razorpay({
    key_id: 'rzp_test_vohNN97b9WnKIu',
    key_secret: 'yXjHwM7lO6wpSg5aVdD6tsbF',
});

module.exports = {
  
 
  getProductListForOrders: async (userId) => {
    return new Promise(async (resovle, reject) => {
      const productDetails = await Cart.findOne({ user_id: userId });

      const subtotal = productDetails.products.reduce((acc, product) => {
        return acc + product.total;
      }, 0);


      const products = productDetails.products.map((product) => ({
        productId: product.productId,
        quantity: product.quantity,
        total: product.total,
      }));
      if (products) {
        resovle(products);
      } else {
        resovle(false);
      }
    });
  },

  getCartValue: (userId) => {
    return new Promise(async (resovle, reject) => {
      const productDetails = await Cart.findOne({ user_id: userId });

      const subtotal = productDetails.products.reduce((acc, products) => {
        return acc + products.total;
      }, 0);

      if (subtotal) {
        resovle(subtotal);
      } else {
        resovle(false);
      }
    });
  },

  placingOrder: async (userId, orderData, orderedProducts, totalOrderValue) => {
    return new Promise(async(resolve,reject)=>{
     try{
   
    let orderStatus =
      orderData["paymentMethod"] === "COD" ? "Placed" : "PENDING";
    console.log(orderStatus, "this is the order status");


    const defaultAddress = await Address.findOne(
      { user_id: userId, "addresses.is_default": true },
      { "addresses.$": 1 }
    ).lean();

    if (!defaultAddress) {
      return res.redirect("/address");
    }
    const defaultAddressDetails = defaultAddress.addresses[0];
    const address = {
      name: defaultAddressDetails.name,
      mobile: defaultAddressDetails.mobile,
      address: defaultAddressDetails.address,
      city: defaultAddressDetails.city,
      state: defaultAddressDetails.state,
      pincode: defaultAddressDetails.pincode,
    };
    
    const orderDetails = new Order({
      userId: userId,
      date: Date(),
      orderValue: totalOrderValue,
      paymentMethod: orderData["paymentMethod"],
      orderStatus: orderStatus,
      products: orderedProducts,
      addressDetails: address,
    });
    console.log(
      orderDetails,
      "this is the order details of the user from helper"
    );
    const placedOrder = await orderDetails.save();
    // console.log(placedOrder, "save to the database");

    const stockDecrease = await userHelpers.updateProductStock(
      orderedProducts
    );



    await Cart.deleteMany({ user_id: userId });
    let dbOrderId = placedOrder._id.toString();
    // console.log(dbOrderId, "order id of the user");
   
    resolve(dbOrderId)

    }catch(error){
      reject(error)
    }
  })
  },






  generateRazorpayOrder: (orderId, totalOrderValue) => {
    orderValue = totalOrderValue * 100;
    return new Promise((resolve, reject) => {
      let orderDetails = {
        amount: orderValue, // amount in the smallest currency unit
        currency: "INR",
        receipt: orderId,
      };
      instance.orders.create(orderDetails, function (err, orderDetails) {
        console.log("New order :", +err);
        
        resolve(orderDetails);
      });
    });
  },
};