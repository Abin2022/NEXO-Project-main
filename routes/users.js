const express=require("express")
var router=express.Router();
const userControllers = require("../controllers/userController")
const config = require("../config/config")
const session=require("express-session")
const auth=require("../middlewares/auth")

const couponController=require("../controllers/couponController")

const multer = require('multer')
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, '../public/userImage'))
    },
    filename: (req, file, cb) => {
      const name = Date.now() + '-' + file.originalname;
      cb(null, name)
    }
  })

const userUpload = multer ({storage: storage})

router.get('/signup',auth.isLogout,userControllers.loadSignup)
router.post('/signup',userControllers.insertUser)
router.get('/emailVerificationNotation',userControllers.mailNotification)
router.get('/verify',userControllers.verifyMail)

router.get('/',auth.isLogout,userControllers.loginLoad)
router.get('/login',auth.isLogout,userControllers.loginLoad)
router.post('/login',userControllers.verifyLogin)

router.get('/home',auth.isLogin,userControllers.loadHome)
router.get('/logout',auth.isLogin,userControllers.userLogout)

router.get('/forget',auth.isLogout,userControllers.forgetLoad)
router.post('/forget',userControllers.forgetVerify)

router.get('/forgetPassPage',auth.isLogout,userControllers.notifyForPassReset)
router.get('/forget-password',auth.isLogout,userControllers.forgetPasswordLoad)
router.post('/forget-password',auth.isLogout,userControllers.resetPassword)

router.get('/otp',userControllers.getOtp)
router.post('/sendOtp',userControllers.sendOtp)
router.post('/verifyOtp',userControllers.verifyOtp)

   router.get('/product-details',auth.isLogin,userControllers.singleProductDetails)

   router.get('/profile',auth.isLogin,userControllers.profilePage)
   router.post('/edit-user',userUpload.single('image'),userControllers.editUser);

   router.get('/address',userControllers.loadAddress)  
   router.post('/address',userControllers.addAddress);
   router.post('/set-as-default',userControllers.setAsDefault);
   router.get('/delete-address',auth.isLogin,userControllers.deleteAddress);
   router.post('/edit-address',userControllers.editAddress);


// router.post('/editCheckoutAddress ',userControllers.editCheckoutAddress);
// router.post('/edit-addressCheckoutPage',userControllers.editAddressCheckoutPage);

 router.get('/checkout',auth.isLogin,userControllers.loadCheckout);
 router.post('/change-address',userControllers.changeAddress);
 router.post('/add-new-address',userControllers.addNewAddress);
 router.get('/delete-address-checkout',auth.isLogin,userControllers.deleteAddressCheckout);
 router.post('/update-address',userControllers.editAddressCheckout);

  //wallet
  router.get('/wallet-placed',auth.isLogin,userControllers.walletOrder)
  router.post('/place-order',auth.isLogin,userControllers.placeOrder)
  router.get('/orderPlaced',auth.isLogin,userControllers.orderPlaced);
  router.get('/orderFailed',auth.isLogin,userControllers.orderFailed)
  router.post('/verify-payment',auth.isLogin,userControllers.verifyPayment)


   router.get('/order-details',auth.isLogin,userControllers.orderDetails)
   router.get('/ordersView',auth.isLogin,userControllers.loadOrdersView)
   router.post('/cancel-order',userControllers.cancelOrder)
   router.post('/undo-cancel',userControllers.undoCancel)
   router.post("/return-order", auth.isLogin,userControllers.returnOrder);
   router.get('/download/order/:orderId',auth.isLogin,userControllers.downloadInvoice)


 router.post('/addtocart',auth.isLogin,userControllers.addToCart)
router.get('/cart',auth.isLogin,userControllers.getCart)
router.post('/change-product-quantity',userControllers.changeQuantity)
// router.post('/delete-product-from-cart',userControllers.deleteProduct)


router.post('/apply-coupon', couponController.applyCouponOnUserside);

router.get('/block',userControllers.blockUser)
router.get('/shop',auth.isLogin,userControllers.loadShopPage)


 router.get('/wallet-details',auth.isLogin,userControllers.loadWallet)
 router.post('/generate-wallet-recharge-order',userControllers.generateWalletRechargeOrder)
router.post('/verify-wallet-recharge-payment',userControllers.verifyWalletRecharge)

//  router.get('/mobile',auth.isLogin,userControllers.mobilePage)
 router.get('/mobile',auth.isLogin,userControllers.mobilePage)
 router.get('/laptop',auth.isLogin,userControllers.laptopPage)
 
module.exports=router