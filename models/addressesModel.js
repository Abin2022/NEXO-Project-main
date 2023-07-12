const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const addressSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },

  addresses: [
    {
      user_id: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },

      name: {
        type: String,
      },
      mobile:{
        type:Number,
      },
      city: {
        type: String,
      },
      state: {
        type: String,
      },
      pincode: {
        type: Number,
      },
      address: {
        type: String,
      },
      is_default: {
        type: Boolean,
        default: false,
      },
      images: {
        type: String,
        // required: true
      },
    },
  ],
});

const addresses = mongoose.model("address", addressSchema);

module.exports = addresses;

