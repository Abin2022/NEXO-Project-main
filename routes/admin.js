const express=require("express");
var router=express.Router();
const config = require("../config/config")
const adminAuth=require("../middlewares/adminauth")
const { Admin } = require("mongodb");

const adminController = require("../controllers/adminController")
const couponController = require("../controllers/couponController")

var multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../public/uploads"));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const uploads = multer({ storage: storage });
// router.use(session({ secret: config.sessionSecret }));

var router = express.Router();
var bodyParser = require("body-parser");

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

router.get('/',adminAuth.isLogout,adminController.loadLogin)
router.post('/',adminController.verifyLogin)
router.get('/home',adminAuth.isLogin,adminController.loadDashboard)
 router.get('/logout',adminAuth.isLogin,adminController.adminLogout)


 router.get("/add-products", adminAuth.isLogin, adminController.loadProducts);
router.post( "/add-products", uploads.array("image",4), adminController.insertProducts);

router.get("/edit-product",adminAuth.isLogin,adminController.editProduct)
router.post("/edit-product",adminAuth.isLogin,uploads.array("image",4),adminController.updateProduct)

router.delete('/delete-img',adminController.deleteimg)
router.get( "/unlist-products",adminAuth.isLogin, adminController.unlistProducts);
router.get("/list-products", adminAuth.isLogin, adminController.listProducts);

router.get("/category", adminAuth.isLogin, adminController.loadCategory);
router.post("/category", adminController.addCategory);
router.get('/edit-category',adminAuth.isLogin,adminController.editCategoryLoad);
router.post('/edit-category',adminController.updateCategory);


router.get("/user",adminAuth.isLogin,adminController.addUser)
router.get("/block-user",adminAuth.isLogin,adminController.blockUser)
router.get("/blockeduserlist",adminAuth.isLogin,adminController.blockedUserlist)
router.get("/unblockUser",adminAuth.isLogin,adminController.unblockUser)
// Route for rendering the blocked users page
router.get('/blocked-users', adminAuth.isLogin, adminController.blockedUsers);


  router.get('/orders',adminAuth.isLogin,adminController.getUserOrders)
  router.get('/ordersView',adminAuth.isLogin,adminController.loadOrdersView);

  router.post('/cancel-by-admin',adminController.cancelledByAdmin);
  router.post('/reject-by-admin',adminController.rejectCancellation)
  router.post('/prepare-by-admin',adminController.productDelevery)
  router.post('/deliver-by-admin',adminController.deliveredProduct)

   router.get('/manage-coupons',adminAuth.isLogin,couponController.manageCoupon);
   router.get('/add-coupon',adminAuth.isLogin, couponController.addNewCouponPage);
   router.post('/add-coupon', couponController.addNewCoupon); 
   router.get('/coupon-deactivated',adminAuth.isLogin,couponController.inactiveCouponsPage);
   router.get('/coupon-edit',adminAuth.isLogin, couponController.editCouponPage);
   router.post('/update-coupon',couponController.updateCoupon)
   router.post('/change-coupon-status',couponController.changeCouponStatus)

router.get('*',(req,res)=>{ 
    res.redirect('/admin')
})
module.exports=router