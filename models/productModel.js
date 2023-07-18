

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const productSchema = new Schema({
  brand: { 
    type: String,
    require: true,
  },
  productname: {
    type: String,
    require: true,
  },
  category: {
    type: String,

    require: true,
  },
  price: {
    type: Number,
    required: true,
  },

  images: {
    type: [String],
    required: true
  },
  
  description: {
    type: String,
    required: true,
  },

  unlist: {
    type: Boolean,
    default: false,
  },
  Subtotal:{
    type:Number,
    // required:true,
  },
  inStock: {
    type: Number,
    required: true,
  },
});

const Products = mongoose.model("Product", productSchema);

module.exports = Products;


