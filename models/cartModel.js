const mongoose = require('mongoose');

const Schema = mongoose.Schema
const cartSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref:"User"
  },
  products: [
    {
        productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref:"Product"
      },
      quantity: {
        type: Number,
        required: true,
        default: 1 
      },
      total:{
        type:Number,
        default:0
      },
      subtotal:{
        type:Number,
        default:0
      }
    }
  ]

});

module.exports = mongoose.model('Cart', cartSchema);