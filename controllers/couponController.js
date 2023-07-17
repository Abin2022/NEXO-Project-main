const User = require('../models/userModel');
const Category = require('../models/categoryModel');
const Product = require('../models/productModel');
const Coupon = require('../models/couponModel')
const mongoose = require('mongoose');
const cartModel = require('../models/cartModel')
// const admin=require('../models/adminModel')
const ObjectId = mongoose.Types.ObjectId;
 const couponHelpers = require('../helpers/couponHelper')
const userHelpers=require("../helpers/userHelpers")
//manage 
const manageCoupon = async (req, res) => {
    try {
    //   const admin = req.session.is_admin;
      const adminData = await User.find({ is_admin:1});
      
      console.log(adminData, 'adminData');
  
      const activeCoupons = await Coupon.find({ activeCoupon: true }).lean();
      const inActiveCoupons = await Coupon.find({ activeCoupon: false }).lean();
    
      
      const dataToRender = {
        adminData,
        activeCoupons,
        inActiveCoupons
      };
  
      res.render('admin/coupon-manage', dataToRender);
    } catch (error) {
      console.log(error);
    }
  };

  const addNewCouponPage = async(req,res)=>{
    try {
        // const admin = req.session.is_admin;
        const adminData = await User.find({is_admin:1})
        
        let couponExistError = false;

        if(req.session.couponExistError){
            couponExistError = req.session.couponExistError;     
        }
  
        res.render('admin/coupon-add',{ adminData, couponExistError });

        delete req.session.couponExistError;
    } catch (error) {
        console.log("Error from addNewCouponGET couponController :", error);
    }
}



const addNewCoupon = async (req, res) => {
    try {
    //   const admin = req.session.is_admin;
      const adminData = await User.find({ is_admin:1 });
      const newCouponData = req.body;
  
      const couponExist = await Coupon.find({ couponCode: newCouponData.couponCode.toLowerCase() }).lean();
      if (couponExist.length === 0) {
        const couponData = new Coupon({
          couponCode: newCouponData.couponCode.toLowerCase(),
          couponDescription: newCouponData.couponDescription,
          discountPercentage: newCouponData.discountPercentage,
          maxDiscountAmount: newCouponData.maxDiscountAmount,
          minOrderValue: newCouponData.minOrderValue,
          validFor: newCouponData.validFor,
          activeCoupon: newCouponData.activeCoupon === "true" ? true : false,
          usageCount: 0,
          createdOn: new Date()
        });
  
        const couponAddition = await couponData.save();
          console.log(couponExist,"couponexit value");
        res.redirect('/admin/add-coupon');
      } else {
        req.session.couponExistError = "Coupon code already exists, try some other code";
        res.redirect('/admin/add-coupon');
      }
    } catch (error) {
      console.log(error);
    }
  };
  

  const inactiveCouponsPage = async (req, res) => {
    try {
        console.log("entered into disablecoupon page...............");
    //   const admin = req.session.is_admin;
      
      const adminData = await User.find({ is_admin: 1});
  
      const inActiveCoupons = await Coupon.find({ activeCoupon: false }).lean();
  
      const dataToRender = {
        adminData,
        inActiveCoupons
      };
  
      res.render('admin/coupon-deactivated', dataToRender);
  
    } catch (error) {
      console.log(error.message);
    }
  };

  const editCouponPage = async (req, res) => {
    try {
    //   const admin = req.session.is_admin;
      const adminData = await User.find({ is_admin:1 });
  
      let couponExistError = false;
  
      if (req.session.couponExistError) {
        couponExistError = req.session.couponExistError;
      }
  
      const couponId = req.query.id;
      const couponData = await Coupon.findOne({ _id: new ObjectId(couponId) }).lean();
    
      const dataToRender = {
       
        adminData,
        couponExistError,
        couponData
      };
      res.render('admin/coupon-edit', dataToRender);
  
      delete req.session.couponExistError;
    } catch (error) {
      console.log("Error from editCouponPOST couponController:", error);
    }
  };
  
  

  const updateCoupon = async (req, res) => {
    try {
    //   const admin = req.session.is_admin;
      const adminData = await User.find({ is_admin: 1 });
  
      const couponDataForUpdate = req.body;
      const couponId = couponDataForUpdate.couponId;
  
      const couponExist = await Coupon.find({ couponCode: couponDataForUpdate.couponCode.toLowerCase() }).lean();
       console.log("couponExit",couponExist);
      if (couponExist.length === 0) {
        const couponCode = couponDataForUpdate.couponCode.toLowerCase();
        const activeCoupon = couponDataForUpdate.activeCoupon === "true" ? true : false;
        const couponDescription = couponDataForUpdate.couponDescription;
        const discountPercentage = couponDataForUpdate.discountPercentage;
        const maxDiscountAmount = couponDataForUpdate.maxDiscountAmount;
        const minOrderValue = couponDataForUpdate.minOrderValue;
        const validFor = couponDataForUpdate.validFor;
  
        const couponUpdation = await Coupon.updateOne({ _id: couponId }, {
          $set: {
            couponCode: couponCode,
            couponDescription: couponDescription,
            discountPercentage: discountPercentage,
            maxDiscountAmount: maxDiscountAmount,
            minOrderValue: minOrderValue,
            validFor: validFor,
            activeCoupon: activeCoupon
          }
        });
        console.log("Couponupdation...............",couponUpdation);
  
        res.redirect('/admin/manage-coupons');
      } else {
        req.session.couponExistError = "Coupon code already exists, try some other code";
        res.redirect('/admin/edit-coupon/?id=' + couponId);
      }
    } catch (error) {
      console.log("Error from updateCouponPOST couponController:", error);
    }
  };
  
  
  const changeCouponStatus = async (req, res) => {
    try {
      // const admin = req.session.is_admin;
      const adminData = await User.find({ is_admin: 1 });
  
      const couponId = req.body.couponId;
  
      const couponData = await Coupon.findOne({ _id: couponId });
  
      if (couponData.activeCoupon) {
        couponData.activeCoupon = false;
      } else {
        couponData.activeCoupon = true;
      }
  
      const couponStatusUpdation = await Coupon.updateOne({ _id: couponData._id }, { $set: couponData });
  
      if (couponData.activeCoupon) {
        res.redirect('/admin/manage-coupons');
      } else {
        res.redirect('/admin/inactive-coupons');
      }
  
    } catch (error) {
      console.log("Error from changeCouponStatusPOST couponController:", error);
    }
  };
  

 //user side 


 const applyCouponOnUserside = async(req,res)=>{
  try {
      const userId = req.session.user_id;
      const couponCode  = req.body.couponCodeFromUser.toLowerCase();
      const couponData = await couponHelpers.getCouponDataByCouponCode(couponCode);
      const couponEligible = await couponHelpers.verifyCouponEligibility(couponCode);
   
      if(couponEligible.status){
          const cartValue = await userHelpers.getCartValue(userId);
          if(cartValue >= couponData.minOrderValue){
              const userEligible = await couponHelpers.verifyCouponUsedStatus(userId, couponData._id);
              if(userEligible.status){
                  const applyNewCoupon = await couponHelpers.applyCouponToCart(userId, couponData._id);
                  if(applyNewCoupon.status){
                      req.session.couponApplied = "Congrats, Coupon applied succesfully";

                      res.redirect('/checkout');
                  }else{
                      req.session.couponInvalidError = "Sorry, Unexpected Error in applying coupon";

                      res.redirect('/checkout');
                      

                  }
              }else{
                  req.session.couponInvalidError = "Coupon already used earlier";

                  res.redirect('/checkout');
              }
          }else{
              req.session.couponInvalidError = "Coupon not applied, purchase minimum for ₹" + couponData.minOrderValue + " to get coupon";

              res.redirect('/checkout');
          }
      }else if (couponEligible.reasonForRejection){
          req.session.couponInvalidError = couponEligible.reasonForRejection;

          res.redirect('/checkout');
      }




  } catch (error) {
      console.log("Error-3 from changeCouponStatusPOST couponController :", error);
  }
}

  

  
  module.exports = {
    manageCoupon,
    addNewCouponPage,
    addNewCoupon,
    inactiveCouponsPage,
    editCouponPage,
    updateCoupon,
    changeCouponStatus,
    applyCouponOnUserside,

  };
  




