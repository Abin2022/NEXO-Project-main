const config = require('../config/config');
const User = require('../models/userModel');
const Order = require('../models/orderModel')
const Coupon = require('../models/couponModel')
 const UsedCoupon = require('../models/usedCouponModel')
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const cartModel = require('../models/cartModel')


module.exports = {
//user side
getCouponDataByCouponCode: (couponCode) => {

    return new Promise(async (resolve, reject) => {

        try {


            const couponData = await Coupon.findOne({ couponCode: couponCode });
            console.log(couponData, 'couponDataaaaaaaaaaa');
            if (couponData === null) {

                resolve({ couponNotFound: true });

            } else {

                resolve(couponData);

            }

        } catch (error) {

            console.log("Error from getCouponDataByCouponCode couponHelper :", error);

            reject(error);

        }

    })

},



verifyCouponEligibility: (requestedCouponCode) => {
    return new Promise(async (resolve, reject) => {

        try {


            const couponData = await Coupon.findOne({ couponCode: requestedCouponCode });

            if (couponData === null) {

                resolve({ status: false, reasonForRejection: "Coupon code dosen't exist" });

            } else {

                if (couponData.activeCoupon) {

                    const couponExpiryDate = new Date(couponData.createdOn.getTime());

                    couponExpiryDate.setDate(couponExpiryDate.getDate() + couponData.validFor);

                    const currentDate = new Date();

                    if (couponExpiryDate >= currentDate) {

                        resolve({ status: true });

                    } else {

                        resolve({ status: false, reasonForRejection: "Coupon code expired" });

                    }

                } else {

                    resolve({ status: false, reasonForRejection: "Coupon currently un-available" });

                }

            }

        } catch (error) {

            console.log("Error from updateCouponData couponHelper :", error);

            reject(error);

        }

    })

},


verifyCouponUsedStatus: (userId, couponId) => {

    return new Promise(async (resolve, reject) => {

        try {

            // Check if coupon Exist or not
            const dbQuery = {

                userId: userId,

                usedCoupons: { $elemMatch: { couponId, usedCoupon: true } }

            };
            

            const previouslyUsedCoupon = await UsedCoupon.findOne({ userId: userId, usedCoupons: { $elemMatch: { couponId, usedCoupon: true } } });
console.log(previouslyUsedCoupon,"previously used coupon");
            if (previouslyUsedCoupon === null) { // Coupon is not used ever

                resolve({ status: true });

            } else { // Coupon is used already

                resolve({ status: false });

            }

        } catch (error) {

            console.log("Error from verifyCouponUsedStatus couponHelper :", error);

            reject(error);

        }

    })

},
applyCouponToCart: (userId, couponId) => {
    return new Promise(async (resolve, reject) => {
        try {
            // Step-1 ==> Disable any other coupons that have been applied earlier
            const updateResult = await UsedCoupon.updateMany(
                { userId: userId, usedCoupons: { $elemMatch: { appliedCoupon: true } } },
                { $set: { "usedCoupons.$[elem].appliedCoupon": false } },
                { arrayFilters: [{ "elem.appliedCoupon": true }] }
            );

            // Step-2 ==> Add the given coupon to users coupon history
            const userCouponHistory = await UsedCoupon.findOne({ userId: userId });
            if (userCouponHistory === null) {// If the user have no document in the coupons history collection
                const usedCoupon = new UsedCoupon({
                    userId: userId,

                    usedCoupons: [{

                        couponId: couponId,

                        appliedCoupon: true,

                        usedCoupon: false

                    }]
                })

                const insertNewCouponHistory = await usedCoupon.save()
                resolve({ status: true });

            } else { // If the user has a document in the coupons history collection, but don't have this coupon or this coupon is not applied yet
                const couponObjectExist = await UsedCoupon.findOne({ userId: userId, usedCoupons: { $elemMatch: { couponId: couponId } } });
                if (couponObjectExist === null) { // Object containing Coupon code dosen't exist in the used coupons array
                    const couponObjectExist = await UsedCoupon.updateOne({ userId: userId }, { $push: { usedCoupons: { couponId: couponId, appliedCoupon: true, usedCoupon: false } } });
                    resolve({ status: true });
                } else {// Object containing Coupon code exist in the used coupons array, so update the applied coupon feild in the array object to true
                    const couponObjectModified = await UsedCoupon.updateOne({ userId: userId, usedCoupons: { $elemMatch: { couponId: couponId } } }, { $set: { "usedCoupons.$.appliedCoupon": true } });
                    resolve({ status: true });
                }
            }


        } catch (error) {
            console.log("Error from applyCouponToCart couponHelper :", error);

            reject(error);
        }
    })
},



//next  sections
checkCurrentCouponValidityStatus: (userId, cartValue) => {
    return new Promise(async (resolve, reject) => {
        try {
            // Check if coupon Exist or not
            const existingAppledCoupon = await UsedCoupon.findOne({ userId: userId, usedCoupons: { $elemMatch: { appliedCoupon: true } } });
            if (existingAppledCoupon === null) {

                resolve({ status: false, couponDiscount: 0 });

            } else {// Applied Coupon Exist
                
                
                const activeCoupon = existingAppledCoupon.usedCoupons.find(coupon => coupon.appliedCoupon === true);

                const activeCouponId = activeCoupon.couponId.toString();

                const activeCouponData = await Coupon.findOne({ _id: new ObjectId(activeCouponId) });
              
                const minimumOrderValue = parseInt(activeCouponData.minOrderValue);


                //Check if coupon previously used by the user 

                const previouslyUsedCoupon = await UsedCoupon.findOne({ userId: userId, usedCoupons: { $elemMatch: { couponId: activeCoupon.couponId, usedCoupon: true } } });
                //Check if the coupon is a active coupon
                if (activeCouponData.activeCoupon) {
                    // The provided Coupon is a active coupon
                    if (previouslyUsedCoupon === null) {
                        // Coupon is not used ever
                        if (cartValue >= minimumOrderValue) {
                            const couponExpiryDate = new Date(activeCouponData.createdOn.getTime());

                            couponExpiryDate.setDate(couponExpiryDate.getDate() + parseInt(activeCouponData.validFor));

                            const currentDate = new Date();
                            // Check if current date is lesser than the coupon expiry date 
                            if (couponExpiryDate >= currentDate) {

                                // Coupon is valid considering the expiry date
                                // Calculating eligible Discount Amount considering the cart total
                                const discountPercentage = parseInt(activeCouponData.discountPercentage);

                                const discountAmountForCart = cartValue * (discountPercentage / 100);

                                // Fixing maximum eligible discount amount
                                const maximumCouponDiscountAmount = parseInt(activeCouponData.maxDiscountAmount);

                                let eligibleCouponDiscountAmount = 0;

                                if (discountAmountForCart >= maximumCouponDiscountAmount) {
                                    eligibleCouponDiscountAmount = maximumCouponDiscountAmount;
                                } else {
                                    eligibleCouponDiscountAmount = discountAmountForCart;
                                }
                                //  Resolving all the coupon Discount Data of Eligible Coupon 
                                resolve({ status: true, couponId: activeCouponId, couponDiscount: eligibleCouponDiscountAmount });

                            } else {
                                // Coupon last use date exceeded, so coupon is invalid considering the expiry date

                                resolve({ status: false, couponId: activeCouponId, couponDiscount: 0 });
                            }
                        }else{
                            // Coupon is invalid considering the cart amount
    
                            resolve( { status : false, couponId : activeCouponId, couponDiscount : 0 } );
                        }
                    }else{ // Coupon is used already
    
                        resolve({ status: false, couponId : activeCouponId, couponDiscount : 0 });
        
                    }
                }else{
                    // The given coupon is a deactivated coupon

                     resolve({ status: false, couponId : activeCouponId, couponDiscount : 0 });
                }
            }

        } catch (error) {
            console.log("Error from checkCurrentCouponValidityStatus couponHelper :", error);

            reject(error);
        }
    })
},


updateCouponUsedStatus:(userId, couponId)=>{

    return new Promise( async (resolve, reject)=>{

        try{

            const requestedUserId = new ObjectId(userId);

            const requestedCouponId = new ObjectId(couponId);

            // Check if coupon Exist or not

            const findAppliedCoupon = await UsedCoupon.findOne({userId:requestedUserId, usedCoupons: { $elemMatch: { couponId : requestedCouponId }}});

            if (findAppliedCoupon) {

                // Coupon exists, update the usedCoupon value to true
                const couponUpdateStatus = await UsedCoupon.updateOne({userId:requestedUserId, usedCoupons: { $elemMatch: { couponId : requestedCouponId }}}
                , { $set: { "usedCoupons.$.usedCoupon": true } });
        
                resolve( {status: true} ); // Resolve the promise after updating the status

            } else {

                reject(new Error("Coupon not found")); // Reject the promise if coupon does not exist

            }
    
        }catch (error){
    
            console.log("Error from updateCouponUsedStatus couponHelper :", error);

            reject(error);
            
        }

    })
    
}



}