const User = require('../models/userModel');
const Category = require('../models/categoryModel')
const Product = require('../models/productModel')
const Order =require('../models/orderModel')
const cartModel = require('../models/cartModel')
const Wallet = require('../models/walletModel')
const Razorpay = require("razorpay");
const { ObjectId } = require('mongodb');
const moment = require("moment-timezone")
var instance = new Razorpay({
    key_id: 'rzp_test_vohNN97b9WnKIu',

    key_secret: 'yXjHwM7lO6wpSg5aVdD6tsbF',
});




module.exports={


    insertingUser: async (req, res) => {
        try {
            const emailExists = await User.findOne({ email: req.body.email });
            if (emailExists) {
                return res.render('users/signup', { messages: "Email already exists. Please enter a different email." });
            }
            
            const spassword = await module.exports.passwordHash(req.body.password);
            const user = new User({
                name: req.body.name,
                email: req.body.email,
                mobile: req.body.mobile,
                password: spassword,
                is_admin: 0
            });
            const userData = await user.save();
            req.session.user_id = userData._id;
            //creating address collection
            const address = new address({
                user_id: req.session.user_id ,
                address:[]

            })

            const addresses = await address.save()
            
            await module.exports.sendingMailToVerify(req.body.name, req.body.email, userData._id);
            res.render('users/otp', { message: "Your registration has been successful. Please verify your email."});
        } catch (error) {
            res.render('users/signup', { message: "Your registration has failed." });
            throw new Error('Failed to insert user');
        }
    },














verifyOnlinePayment: (paymentData) => {

console.log(paymentData);

    return new Promise((resolve, reject) => {
     console.log("From here......");
        const crypto = require('crypto'); // Requiring crypto Module here for generating server signature for payments verification
         console.log(crypto);
        let razorpaySecretKey = 'yXjHwM7lO6wpSg5aVdD6tsbF';
         console.log(razorpaySecretKey);
        let hmac = crypto.createHmac('sha256', razorpaySecretKey); // Hashing Razorpay secret key using SHA-256 Algorithm
     console.log(hmac);
        hmac.update(paymentData['razorpayServerPaymentResponse[razorpay_order_id]'] + '|' + paymentData['razorpayServerPaymentResponse[razorpay_payment_id]']);
        // Updating the hash (re-hashing) by adding Razprpay payment Id and order Id received from client as response

        let serverGeneratedSignature = hmac.digest('hex');
        // Converted the final hashed result into hexa code and saving it as server generated signature

        let razorpayServerGeneratedSignatureFromClient = paymentData['razorpayServerPaymentResponse[razorpay_signature]']
          console.log(razorpayServerGeneratedSignatureFromClient);
        if (serverGeneratedSignature === razorpayServerGeneratedSignatureFromClient) {
            // Checking that is the signature generated in our server using the secret key we obtained by hashing secretkey,orderId & paymentId is same as the signature sent by the server 

            console.log("Payment Signature Verified");
            resolve()

        } else {

            console.log("Payment Signature Verification Failed");

            reject()

        }

    })

},

updateOnlineOrderPaymentStatus: (ordersCollectionId, onlinePaymentStatus) => {
    return new Promise(async (resolve, reject) => {
        if (onlinePaymentStatus) {
            const orderUpdate = await Order.findByIdAndUpdate({ _id: new ObjectId(ordersCollectionId) }, { $set: { orderStatus: "Placed" } }).then(() => {
                resolve()
            });

        } else {
            const orderUpdate = await Order.findByIdAndUpdate({ _id: new ObjectId(ordersCollectionId) }, { $set: { orderStatus: "Failed" } }).then(() => {
                resolve()
            })
        }
    })
    
},


 getCartValue:(userId)=>{
    return new Promise(async(resolve,reject)=>{
    try{
        const productDetails = await cartModel.findOne({ user_id:userId})

        const subtotal=productDetails.products.reduce((acc,product)=>{
            return acc+product.total
        },0)
        if(subtotal){
            resolve(subtotal)
        }else{
            resolve(false)
        }
    }catch(error){
        reject(error)
    }
    })
 },


//wallet
  

getWalletDetails:(userId)=>{
    return new Promise(async(resolve,reject)=>{
        try{
            const walletDetails = await Wallet.findOne({ userId:userId}).lean()
            console.log("walletDetails",walletDetails);
            resolve(walletDetails)
        }catch(error){
            reject(error)
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
            console.log(orderHistory,"orderHis");

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
                $or: [{ orderStatus: 'Placed' }, { orderStatus: 'Delivered' },{orderStatus:'Shipped'}],
              
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





//    updateWallet:(userId,orderId)=>{
//     return new Promise(async(resolve,reject)=>{
//         try{
//             const orderDetails=await Order.findOne({_id:orderId})
//             const wallet=await Wallet.findOne({userId:userId })

//             if(wallet){
//                 const updatedWalletAmount = wallet.walletAmount - orderDetails.orderValue;

//                 await Wallet.findOneAndUpdate(
//                     { userId:userId},
//                     { walletAmount: updatedWalletAmount}
//                 );
//                 resolve(updatedWalletAmount)
//             } else {

//                 reject('Wallet is not found')
//             }
//             }catch(error){
//                 reject(error)
//             }
        
//     })
//    },




updateWallet: (userId, orderId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const orderDetails = await Order.findOne({ _id: orderId });
        let wallet = await Wallet.findOne({ userId: userId });
  
        if (wallet) {
          const updatedWalletAmount = wallet.walletAmount - orderDetails.orderValue;
  
          await Wallet.findOneAndUpdate(
            { userId: userId },
            { walletAmount: updatedWalletAmount }
          );
          resolve(updatedWalletAmount);
        } else {
          // If the wallet is not found, create a new wallet for the user with the initial amount being the negative value of the order value.
          const initialWalletAmount = -orderDetails.orderValue;
  
          wallet = new Wallet({
            userId: userId,
            walletAmount: initialWalletAmount,
          });
  
          await wallet.save();
          resolve(initialWalletAmount);
        }
      } catch (error) {
        reject(error);
      }
    });
  },
  

   

  
   updateProductStock: async (orderedProducts) => {
    try {
      for (const orderedProduct of orderedProducts) {
        const productId = orderedProduct.productId;
        const quantity = orderedProduct.quantity;

        // Find the product by its ID
        const product = await Product.findById(productId);

        // Update the product stock by subtracting the ordered quantity
        product.inStock -= quantity;

        // Save the updated product
        await product.save();
      }
    } catch (error) {}
  },


  generateRazorpayForWallet:(userId,total)=>{
    total = parseInt(total);
    return new Promise(async(resolve,reject)=>{
        try {
            var options = {

                amount: total * 100,  // amount in the smallest currency unit
      
                currency: "INR",
      
                receipt: "" + userId
      
              };

              console.log('it resacged here ',options);

              instance.orders.create(options, function (err, order) {

                if (err) {
      
                  console.log(err);
      
                  reject(err);
      
                } else {
      
                  resolve(order);
      
                }
      
              });

        } catch (error) {
            reject(error);
        }
    })
},

rechargeUpdateWallet:(userId, referalAmount)=>{
    return new Promise(async(resolve,reject)=>{
        try {
            
            const wallet  = await Wallet.findOne({userId:new ObjectId(userId)}).lean().exec()
            
            if(wallet){
                const currentAmount = wallet.walletAmount
                const updatedAmount = currentAmount + referalAmount;

               
                
               const walletUpdate = await Wallet.updateOne({userId:new ObjectId(userId)},{ $set: { walletAmount: updatedAmount } })


                resolve()
            }else{
                reject(new Error('Wallet not found'));
            }
        } catch (error) {
            reject(error);
        }
    })
},



}