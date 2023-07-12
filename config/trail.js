const placeOrder = async (req, res) => {
    try {
        let userId = req.session.user_id// Used for storing user details for further use in this route
        let orderDetails = req.body;

        // console.log(req.body,'vvvvvvvvvvvvvvvvvvvvvvvv');

        let orderedProducts = await userHelpers.getProductListForOrders(userId);
        // console.log(orderedProducts,'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');
        if (orderedProducts) {
            let totalOrderValue = await userHelpers.getCartValue(userId);
            const availableCouponData = await couponHelpers.checkCurrentCouponValidityStatus(userId, totalOrderValue);
            if (availableCouponData.status) {
                const couponDiscountAmount = availableCouponData.couponDiscount;

                // Inserting the value of coupon discount into the order details object created above
                orderDetails.couponDiscount = couponDiscountAmount;

                // Updating the total order value with coupon discount applied
                totalOrderValue = totalOrderValue - couponDiscountAmount;

                const updateCouponUsedStatusResult = await couponHelpers.updateCouponUsedStatus(userId, availableCouponData.couponId);

            }


            if (req.body['paymentMethod'] === 'COD') {
                userHelpers.placingOrder(userId, orderDetails, orderedProducts, totalOrderValue).then(async (orderId,error) => {
                    res.json({ COD_CHECKOUT: true });
                })

            } else if (req.body['paymentMethod'] === 'WALLET') {
                const walletBalance = await userHelpers.walletBalance(userId);
                if (walletBalance.walletAmount >= totalOrderValue) {
                    userHelpers.placingOrder(userId, orderDetails, orderedProducts, totalOrderValue).then(async (orderId,error) => {
                        res.json({ WALLET_CHECKOUT: true ,orderId});
                    })
                } else {
                    res.json({ error: 'Insufficient balance.' })
                }
            }

            else if (req.body['paymentMethod'] === 'ONLINE') {
                userHelpers.placingOrder(userId, orderDetails, orderedProducts, totalOrderValue).then(async (orderId,error) => {
                    if(error){
                        res.json({ checkoutStatus: false });
                    }else{
                        userHelpers.generateRazorpayOrder(orderId, totalOrderValue).then(async (razorpayOrderDetails,err) => {
                            const user = await User.findById({ _id: userId }).lean()
                            res.json(
                                {
    
                                    ONLINE_CHECKOUT: true,
                                    userDetails: user,
                                    userOrderRequestData: orderDetails,
                                    orderDetails: razorpayOrderDetails,
                                    razorpayKeyId: process.env.KEY_ID,
                                }
                            )
    
                        })
                    }
                   
                })

            } else {
                res.json({ paymentStatus: false });
            }

        } else {
            res.json({ checkoutStatus: false });
        }



    } catch (error) {
        console.log(error.message);
        res.redirect('/user-error')
    }
}
