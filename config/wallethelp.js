   exports.modules={ 
    getWalletDetails: (userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const walletDetails = await Wallet.findOne({ userId: userId }).lean()
            // console.log(walletDetails,'walletDetailsvvvvvvvvvvvvvv');


            resolve(walletDetails)
        } catch (error) {
            reject(error);
        }
    })
},

creditOrderDetails: (userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const orderDetails = await Order.find({
                userId: userId,
                $or: [{ paymentMethod: 'ONLINE' }, { paymentMethod: 'WALLET' }],
                orderStatus: 'cancelled'
            }).lean();

            const orderHistory = orderDetails.map(history => {
                let createdOnIST = moment(history.date)
                    .tz('Asia/Kolkata')
                    .format('DD-MM-YYYY h:mm A');

                return { ...history, date: createdOnIST };
            });

            resolve(orderHistory);
        } catch (error) {
            reject(error);
        }
    });
},

debitOrderDetails: (userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const orderDetails = await Order.find({
                userId: userId,
                paymentMethod: 'WALLET',
                $or: [{ orderStatus: 'Placed' }, { orderStatus: 'Delivered' },{orderStatus:'Preparing food'}],
              
            }).lean();

            const orderHistory = orderDetails.map(history => {
                let createdOnIST = moment(history.date)
                    .tz('Asia/Kolkata')
                    .format('DD-MM-YYYY h:mm A');

                return { ...history, date: createdOnIST };
            });

            resolve(orderHistory);
        } catch (error) {
            reject(error);
        }
    });
},









//other section

walletBalance: (userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const walletBalance = await Wallet.findOne({ userId: userId })
            resolve(walletBalance)
        } catch (error) {
            reject(err)

        }
    })
},

updateWallet: (userId, orderId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const orderDetails = await Order.findOne({ _id: orderId });
            const wallet = await Wallet.findOne({ userId: userId });

            if (wallet) {
                // Subtract orderValue from walletAmount
                const updatedWalletAmount = wallet.walletAmount - orderDetails.orderValue;

                // Update the walletAmount in the Wallet collection
                await Wallet.findOneAndUpdate(
                    { userId: userId },
                    { walletAmount: updatedWalletAmount }
                );

                resolve(updatedWalletAmount);
            } else {
                reject('Wallet not found');
            }
        } catch (error) {
            reject(error);
        }
    });
},



placeOrder: async (req, res) => {
    try {
      console.log("entered placed order routeeeee");
      let userId = req.session.user_id;
      let orderDetails = req.body;
      console.log(orderDetails, "ordeerdetails have reached here");

      let productsOrdered = await productHepler.getProductListForOrders(userId);
      console.log(productsOrdered, "products that are ordered");

      if (productsOrdered) {
        let totalOrderValue = await productHepler.getCartValue(userId);
        console.log(totalOrderValue, "this is the total order value");
        productHepler
          .placingOrder(userId, orderDetails, productsOrdered, totalOrderValue)
          .then(async (orderId) => {
            console.log("successfully reached hereeeeeeeeee");

            if (req.body["paymentMethod"] === "COD") {
              console.log("cod_is true here");
              res.json({ COD_CHECKOUT: true });
            } else if (req.body["paymentMethod"] === "ONLINE") {
              productHepler
                .generateRazorpayOrder(orderId, totalOrderValue)
                .then(async (razorpayOrderDetails) => {
                  console.log(
                    razorpayOrderDetails,
                    "razorpayOrderDetails reached here"
                  );
                  const user = await User.findById({ _id: userId }).lean();
                  res.json({
                    ONLINE_CHECKOUT: true,
                    userDetails: user,
                    userOrderRequestData: orderDetails,
                    orderDetails: razorpayOrderDetails,
                    razorpayKeyId: "rzp_test_bfnSH6XKHJdHG9",
                  });
                });
            } else if (req.body["paymentMethod"] === "WALLET") {
              console.log("wallet true");
              const walletBalance = await userhelper.walletBalance(userId);
              console.log(walletBalance, "wallet balance is this");
              if (walletBalance >= totalOrderValue) {
                productHepler
                  .placingOrder(
                    userId,
                    orderDetails,
                    productsOrdered,
                    totalOrderValue
                  )
                  .then(async (orderId, error) => {
                    res.json({ WALLET_CHECKOUT: true, orderId });
                  });
              } else {
                res.json({ error: "Insufficient balance." });
              }
            } else {
              res.json({ paymentStatus: false });
            }
          });
      } else {
        res.json({ checkoutStatus: false });
      }
    } catch (error) {
      console.log(error.message);
    }
  },










  //wallet page
  getWalletDetails: (userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const walletDetails = await Wallet.findOne({ userId: userId }).lean()
            // console.log(walletDetails,'walletDetailsvvvvvvvvvvvvvv');


            resolve(walletDetails)
        } catch (error) {
            reject(error);
        }
    })
},

creditOrderDetails: (userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const orderDetails = await Order.find({
                userId: userId,
                $or: [{ paymentMethod: 'ONLINE' }, { paymentMethod: 'WALLET' }],
                orderStatus: 'cancelled'
            }).lean();

            const orderHistory = orderDetails.map(history => {
                let createdOnIST = moment(history.date)
                    .tz('Asia/Kolkata')
                    .format('DD-MM-YYYY h:mm A');

                return { ...history, date: createdOnIST };
            });

            resolve(orderHistory);
        } catch (error) {
            reject(error);
        }
    });
},

debitOrderDetails: (userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const orderDetails = await Order.find({
                userId: userId,
                paymentMethod: 'WALLET',
                $or: [{ orderStatus: 'Placed' }, { orderStatus: 'Delivered' },{orderStatus:'Preparing food'}],
              
            }).lean();

            const orderHistory = orderDetails.map(history => {
                let createdOnIST = moment(history.date)
                    .tz('Asia/Kolkata')
                    .format('DD-MM-YYYY h:mm A');

                return { ...history, date: createdOnIST };
            });

            resolve(orderHistory);
        } catch (error) {
            reject(error);
        }
    });
},

   }







   placingOrder: async (userId, orderData, orderedProducts, totalOrderValue) => {
    return new Promise(async (resolve, reject)=>{
        try {
            let orderStatus

            if (orderData['paymentMethod'] === 'COD') {
                orderStatus = 'Placed'
            } else if (orderData['paymentMethod'] === 'WALLET') {
                orderStatus = 'Placed'
            } else {
                orderStatus = 'Pending'
            }
    
            const defaultAddress = await Address.findOne(
                { user_id: userId, 'address.isDefault': true },
                { 'address.$': 1 }
            ).lean();
            console.log(defaultAddress, 'default address');
    
            if (!defaultAddress) {
                console.log('Default address not found');
                return res.redirect('/address');
            }
    
            const defaultAddressDetails = defaultAddress.address[0];
            const address = {
                name: defaultAddressDetails.name,
                mobile: defaultAddressDetails.mobile,
                homeAddress: defaultAddressDetails.homeAddress,
                city: defaultAddressDetails.city,
                street: defaultAddressDetails.street,
                postalCode: defaultAddressDetails.postalCode
            };
            console.log(address, 'address');
    
    
            const orderDetails = new Order({
                userId: userId,
                date: Date(),
                orderValue: totalOrderValue,
                couponDiscount: orderData.couponDiscount,
                paymentMethod: orderData['paymentMethod'],
                orderStatus: orderStatus,
                products: orderedProducts,
                addressDetails: address,
                actualOrderValue:orderData.actualOrderValue,
                productOfferDiscount:orderData.productOfferDiscount,
                categoryOfferDiscount:orderData.categoryOfferDiscount

            });
    
            const placedOrder = await orderDetails.save();
    
            console.log(placedOrder, 'placedOrder');
    
            // Remove the products from the cart
            await Cart.deleteMany({ user_id: userId });
    
            let dbOrderId = placedOrder._id.toString();
            console.log(dbOrderId, 'order id in stringggggggggggggggggggggggggggg');
            
            resolve(dbOrderId)
        } catch (error) {
            reject(error)
        }
    })
    
   


}